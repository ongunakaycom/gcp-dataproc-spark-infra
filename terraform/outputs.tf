###############################################################################
# Outputs
###############################################################################

output "project_id" {
  description = "Google Cloud project ID."
  value       = var.project_id
}

output "region" {
  description = "Region hosting the Dataproc cluster."
  value       = var.region
}

output "cluster_name" {
  description = "Name of the Dataproc cluster."
  value       = google_dataproc_cluster.example.name
}

output "cluster_id" {
  description = "Fully qualified Dataproc cluster ID."
  value       = google_dataproc_cluster.example.id
}

output "staging_bucket" {
  description = "GCS bucket used by Dataproc for staging and logs."
  value       = google_storage_bucket.staging.name
}

output "default_compute_service_account" {
  description = "Compute Engine default service account granted the Dataproc Worker role."
  value       = local.default_compute_service_account
}

output "submit_job_command" {
  description = "Ready-to-run command that submits the SparkPi example job."
  value       = "gcloud dataproc jobs submit spark --cluster=${google_dataproc_cluster.example.name} --region=${var.region} --class=org.apache.spark.examples.SparkPi --jars=file:///usr/lib/spark/examples/jars/spark-examples.jar -- 1000"
}
