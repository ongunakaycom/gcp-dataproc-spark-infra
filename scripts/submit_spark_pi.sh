#!/usr/bin/env bash
#
# Submits the SparkPi example job to the Dataproc cluster.
#
# The SparkPi example estimates the value of Pi using a Monte Carlo method.
# Passing 1000 as the argument means 1000 slices/tasks are used, which is the
# value used throughout the official Dataproc quickstart.
#
# Usage:
#   ./scripts/submit_spark_pi.sh
#
# Optional overrides:
#   CLUSTER_NAME=my-cluster REGION=europe-west1 ./scripts/submit_spark_pi.sh

set -euo pipefail

CLUSTER_NAME="${CLUSTER_NAME:-example-cluster}"
REGION="${REGION:-us-east1}"

if ! command -v gcloud >/dev/null 2>&1; then
  echo "error: gcloud CLI not found. Install the Google Cloud SDK first." >&2
  exit 1
fi

echo "Submitting SparkPi job to cluster '${CLUSTER_NAME}' in region '${REGION}'..."

gcloud dataproc jobs submit spark \
  --cluster="${CLUSTER_NAME}" \
  --region="${REGION}" \
  --class=org.apache.spark.examples.SparkPi \
  --jars=file:///usr/lib/spark/examples/jars/spark-examples.jar \
  -- 1000
