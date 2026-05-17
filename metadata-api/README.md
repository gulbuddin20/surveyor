# Metadata API

Small internal file service for Surveyor/FIKLINGO evidence files.

Production currently runs this service on IBM as `metadata-api.service`, bound to `127.0.0.1:19090`.

The GitLab `deploy_metadata_api_prod` job deploys `metadata-api/server.js` before the production Dokploy deploy.

Required environment:

```env
METADATA_ROOT=/data/metadata
METADATA_ARCHIVE_ROOT=/mnt/archive/metadata-archive
METADATA_API_KEY=...
METADATA_UPLOAD_TOKEN_SECRET=...
METADATA_UPLOAD_ALLOWED_ORIGINS=https://fiklingo.pkmpalmerah.com,https://surveyor-dev.pkmpalmerah.cloud
PORT=19090
```
