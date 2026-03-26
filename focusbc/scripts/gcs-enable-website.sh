#!/usr/bin/env bash
# One-time: set bucket "specialty pages" so the site root and .../dir/ URLs serve
# index.html instead of an XML bucket listing (ListBucketResult).
# Requires: gcloud CLI, permission storage.buckets.update on the bucket.
#
# Docs: https://docs.cloud.google.com/storage/docs/hosting-static-website
# ("if you don't assign an index page suffix ... users ... are served an XML document tree")
#
# Usage:
#   GCS_BUCKET=focusbc-websites bash focusbc/scripts/gcs-enable-website.sh
#
# After this, both of these should return HTML (not XML) at bucket root:
#   https://storage.googleapis.com/${BUCKET}/
#   https://${BUCKET}.storage.googleapis.com/
# And directory URLs like .../about/ resolve to about/index.html.

set -euo pipefail
BUCKET="${GCS_BUCKET:-focusbc-websites}"

echo "Setting website config on gs://${BUCKET} (main page suffix: index.html)..."
gcloud storage buckets update "gs://${BUCKET}" \
  --web-main-page-suffix=index.html

echo ""
echo "Verifying bucket website settings (must show mainPageSuffix: index.html):"
gcloud storage buckets describe "gs://${BUCKET}" --format="yaml(website)"

echo ""
echo "Done. Hard-refresh the bucket root in a browser (or curl -sI) — expect text/html, not ListBucketResult XML."
