###############################################################################
# Terraform configuration
#
# Provisions a Managed Service for Apache Spark (Dataproc) cluster on Google
# Cloud, together with the APIs and IAM bindings required to run Spark jobs.
###############################################################################

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 8.9"
    }
    time = {
      source  = "hashicorp/time"
      version = "~> 0.11"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
  zone    = var.zone
}

###############################################################################
# Project metadata
#
# The Compute Engine default service account email is derived from the project
# number, which is not known until the project is queried.
###############################################################################

data "google_project" "current" {
  project_id = var.project_id
}

locals {
  default_compute_service_account = "${data.google_project.current.number}-compute@developer.gserviceaccount.com"

  required_services = [
    "dataproc.googleapis.com",
    "iam.googleapis.com",
    "compute.googleapis.com",
  ]
}

###############################################################################
# API enablement
###############################################################################

resource "google_project_service" "required" {
  for_each = toset(local.required_services)

  project            = var.project_id
  service            = each.value
  disable_on_destroy = false
}

###############################################################################
# IAM
#
# Dataproc requires the Compute Engine default service account to be able to
# act as a Dataproc worker. Without this binding, cluster creation fails with
# a permission error even though the caller has the Owner/Editor role.
#
# Reference:
# https://cloud.google.com/dataproc/docs/concepts/configuring-clusters/service-accounts
###############################################################################

resource "google_project_iam_member" "dataproc_worker" {
  project = var.project_id
  role    = "roles/dataproc.worker"
  member  = "serviceAccount:${local.default_compute_service_account}"

  depends_on = [google_project_service.required]
}

# IAM bindings are eventually consistent. Give Google Cloud a short window to
# propagate the Worker role before the cluster tries to use it.
resource "time_sleep" "wait_for_iam" {
  create_duration = "30s"

  depends_on = [google_project_iam_member.dataproc_worker]
}

###############################################################################
# Staging bucket
#
# Dataproc uploads job dependencies and log files here. Managing the bucket in
# Terraform (instead of letting Dataproc create one implicitly) means that
# `terraform destroy` removes it as well, avoiding orphaned storage costs.
###############################################################################

resource "google_storage_bucket" "staging" {
  name                        = "${var.project_id}-dataproc-staging-${var.region}"
  project                     = var.project_id
  location                    = var.region
  storage_class               = "STANDARD"
  uniform_bucket_level_access = true
  force_destroy               = true

  versioning {
    enabled = false
  }

  lifecycle_rule {
    condition {
      age = 7
    }
    action {
      type = "Delete"
    }
  }

  depends_on = [google_project_service.required]
}

###############################################################################
# Dataproc cluster
###############################################################################

resource "google_dataproc_cluster" "example" {
  name   = var.cluster_name
  region = var.region
  labels = var.labels

  cluster_config {
    staging_bucket = google_storage_bucket.staging.name

    gce_cluster_config {
      zone = var.zone

      # Tags make it easy to attach firewall rules or budgets to the nodes.
      tags = ["dataproc", var.cluster_name]

      metadata = {
        "enable-oslogin" = "TRUE"
      }
    }

    master_config {
      num_instances = 1
      machine_type  = var.master_machine_type

      disk_config {
        boot_disk_type    = "pd-standard"
        boot_disk_size_gb = 100
      }
    }

    worker_config {
      num_instances = var.worker_count
      machine_type  = var.worker_machine_type

      disk_config {
        boot_disk_type    = "pd-standard"
        boot_disk_size_gb = 100
      }
    }

    software_config {
      image_version = var.image_version

      override_properties = {
        # Keep the cluster small and cheap for a demo workload.
        "dataproc:dataproc.allow.zero.workers"         = "true"
        "dataproc:dataproc.logging.stackdriver.enable" = "true"
      }
    }

    # Automatically delete the cluster after two hours of idleness so a
    # forgotten demo cluster cannot accrue costs indefinitely.
    lifecycle_config {
      idle_delete_ttl = var.idle_delete_ttl
    }
  }

  depends_on = [
    time_sleep.wait_for_iam,
    google_storage_bucket.staging,
  ]
}
