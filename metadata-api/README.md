# Metadata API

Small internal file service for Surveyor/FIKLINGO evidence files.

Production currently runs this service on IBM as `metadata-api.service`, bound to `127.0.0.1:19090`.

Deploy manually until this package gets its own pipeline:

```bash
scp metadata-api/server.js ibm:/tmp/metadata-api-server.js
ssh -t ibm 'sudo install -o metadata -g metadata -m 640 /tmp/metadata-api-server.js /opt/metadata-api/server.js && sudo systemctl restart metadata-api && systemctl is-active metadata-api'
```

Required environment:

```env
METADATA_ROOT=/data/metadata
METADATA_API_KEY=...
METADATA_UPLOAD_TOKEN_SECRET=...
METADATA_UPLOAD_ALLOWED_ORIGINS=https://fiklingo.pkmpalmerah.com,https://surveyor-dev.pkmpalmerah.cloud
PORT=19090
```
