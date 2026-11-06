###############################################################################
# Input variables
###############################################################################

variable "project_id" {
  description = "Google Cloud project ID where the Dataproc cluster will be created."
  type        = string

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{4,28}[a-z0-9]$", var.project_id))
    error_message = "project_id must be a valid Google Cloud project ID (6-30 lowercase characters)."
  }
}

variable "region" {
  description = "Region for the Dataproc cluster and its staging bucket."
  type        = string
  default     = "us-east1"

  validation {
    condition     = contains(["us-east1", "europe-west1"], var.region)
    error_message = "region must be either us-east1 or europe-west1 (the regions used by this project)."
  }
}

variable "zone" {
  description = "Zone for the cluster's Compute Engine instances. Must belong to var.region. When null, Dataproc selects a zone automatically."
  type        = string
  default     = null
}

variable "cluster_name" {
  description = "Name of the Dataproc cluster."
  type        = string
  default     = "example-cluster"

  validation {
    condition     = can(regex("^[a-z]([-a-z0-9]{0,49}[a-z0-9])?$", var.cluster_name))
    error_message = "cluster_name must start with a lowercase letter, contain only lowercase letters, digits and hyphens, and be at most 51 characters."
  }
}

variable "image_version" {
  description = "Dataproc image version (see https://cloud.google.com/dataproc/docs/concepts/versioning/dataproc-versions)."
  type        = string
  default     = "2.2-debian12"
}

variable "master_machine_type" {
  description = "Machine type for the master node."
  type        = string
  default     = "e2-standard-4"
}

variable "worker_machine_type" {
  description = "Machine type for each worker node."
  type        = string
  default     = "e2-standard-4"
}

variable "worker_count" {
  description = "Number of worker nodes in the cluster."
  type        = number
  default     = 2

  validation {
    condition     = var.worker_count >= 0 && var.worker_count <= 10
    error_message = "worker_count must be between 0 and 10."
  }
}

variable "idle_delete_ttl" {
  description = "Duration after which an idle cluster is automatically deleted (Dataproc duration string, e.g. 7200s)."
  type        = string
  default     = "7200s"
}

variable "labels" {
  description = "Labels applied to the Dataproc cluster."
  type        = map(string)
  default = {
    environment = "demo"
    managed_by  = "terraform"
    application = "spark-pi"
  }
}
