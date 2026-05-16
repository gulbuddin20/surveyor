/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars */
const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");
const express = require("express");
const helmet = require("helmet");
const multer = require("multer");
const sharp = require("sharp");
require("dotenv").config();

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024, files: 1 },
});

const port = Number(process.env.PORT || 19090);
const root = process.env.METADATA_ROOT || "/data/metadata";
const apiKey = process.env.METADATA_API_KEY || "";
const uploadTokenSecret = process.env.METADATA_UPLOAD_TOKEN_SECRET || "";
const allowedUploadOrigins = (process.env.METADATA_UPLOAD_ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(helmet());
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.post("/files/:project/:category", requireKey, upload.single("file"), async (req, res, next) => {
  try {
    const project = safeSegment(req.params.project);
    const category = safeSegment(req.params.category);
    if (!req.file) return res.status(400).json({ ok: false, message: "Missing file" });
    const result = await storeBuffer({
      category,
      buffer: req.file.buffer,
      mimeType: req.file.mimetype || "application/octet-stream",
      originalName: req.file.originalname,
      project,
    });
    return res.json({ ok: true, ...result });
  } catch (error) {
    return next(error);
  }
});

app.get("/files/:project/*path", requireKey, async (req, res, next) => {
  try {
    const project = safeSegment(req.params.project);
    const filePath = Array.isArray(req.params.path) ? req.params.path.join("/") : req.params.path;
    const fullPath = resolveSafePath(root, project, filePath);
    return res.sendFile(fullPath);
  } catch (error) {
    return next(error);
  }
});

app.post("/maintenance/orphan-uploads/:project/:category", requireKey, async (req, res, next) => {
  try {
    const project = safeSegment(req.params.project);
    const category = safeSegment(req.params.category);
    const knownPaths = new Set(Array.isArray(req.body?.knownPaths) ? req.body.knownPaths.filter((item) => typeof item === "string") : []);
    const olderThanHours = Math.max(1, Math.min(720, Number(req.body?.olderThanHours || 24)));
    const dryRun = req.body?.dryRun !== false;
    const cutoffMs = Date.now() - olderThanHours * 60 * 60 * 1000;
    const directory = resolveSafePath(root, project, category);
    const entries = await fs.readdir(directory, { withFileTypes: true }).catch((error) => {
      if (error.code === "ENOENT") return [];
      throw error;
    });
    const orphanPaths = [];

    for (const entry of entries) {
      if (!entry.isFile()) continue;
      const relativePath = `${project}/${category}/${entry.name}`;
      if (knownPaths.has(relativePath)) continue;
      const fullPath = resolveSafePath(directory, entry.name);
      const stat = await fs.stat(fullPath);
      if (stat.mtimeMs > cutoffMs) continue;
      orphanPaths.push(relativePath);
      if (!dryRun) await fs.unlink(fullPath);
    }

    return res.json({
      ok: true,
      deleted: dryRun ? 0 : orphanPaths.length,
      dryRun,
      olderThanHours,
      orphanPaths,
    });
  } catch (error) {
    return next(error);
  }
});

app.options("/direct/:project/:category", corsUpload, (_req, res) => res.status(204).end());
app.post("/direct/:project/:category", corsUpload, markRequestStart, upload.single("file"), async (req, res, next) => {
  const handlerStartedAt = hrtimeNow();
  try {
    if (!uploadTokenSecret) return res.status(503).json({ ok: false, message: "Direct upload disabled" });
    if (!req.file) return res.status(400).json({ ok: false, message: "Missing file" });

    const token = String(req.get("x-upload-token") || "");
    const payload = verifyUploadToken(token);
    const project = safeSegment(req.params.project);
    const category = safeSegment(req.params.category);

    if (payload.project !== project || payload.category !== category) {
      return res.status(403).json({ ok: false, message: "Upload scope mismatch" });
    }
    if (payload.mimeType !== req.file.mimetype) {
      return res.status(400).json({ ok: false, message: "MIME type mismatch" });
    }
    if (req.file.size > payload.maxOriginalBytes) {
      return res.status(400).json({ ok: false, message: "File too large" });
    }

    const stored = await storeBuffer({
      category,
      buffer: req.file.buffer,
      maxOutputBytes: payload.maxOutputBytes,
      mimeType: req.file.mimetype,
      originalName: req.file.originalname || payload.fileName || "upload",
      project,
    });

    logUploadTiming({
      category,
      fieldKey: payload.fieldKey,
      fileName: payload.fileName || req.file.originalname,
      inputBytes: req.file.size,
      maxOutputBytes: payload.maxOutputBytes,
      outputBytes: stored.fileSizeBytes,
      project,
      receiveMs: elapsedMs(req.uploadStartedAt, handlerStartedAt),
      timings: stored.timings,
      totalMs: elapsedMs(req.uploadStartedAt, hrtimeNow()),
    });

    return res.json({
      ok: true,
      file: {
        fileName: payload.fileName || req.file.originalname,
        fileSizeBytes: stored.fileSizeBytes,
        mimeType: stored.mimeType,
        provider: "metadata-api-direct",
        sha256: stored.sha256,
        storagePath: stored.path,
        uploadReceipt: signUploadReceipt({
          aud: "metadata-upload-receipt",
          category,
          exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
          fieldKey: payload.fieldKey,
          fileName: payload.fileName || req.file.originalname,
          fileSizeBytes: stored.fileSizeBytes,
          iat: Math.floor(Date.now() / 1000),
          mimeType: stored.mimeType,
          project,
          sha256: stored.sha256,
          storagePath: stored.path,
          sub: payload.sub,
          templateId: payload.templateId,
        }),
      },
    });
  } catch (error) {
    return next(error);
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  return res.status(error.status || 500).json({ ok: false, message: error.message || "Internal server error" });
});

app.listen(port, "127.0.0.1", () => {
  console.log(`metadata-api listening on 127.0.0.1:${port}`);
});

function requireKey(req, res, next) {
  if (!apiKey || req.get("x-metadata-key") !== apiKey) {
    return res.status(401).json({ ok: false, message: "Unauthorized" });
  }
  return next();
}

function corsUpload(req, res, next) {
  const origin = req.get("origin");
  if (origin && allowedUploadOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Headers", "x-upload-token,content-type");
    res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
    res.setHeader("Access-Control-Max-Age", "600");
  }
  return next();
}

function markRequestStart(req, _res, next) {
  req.uploadStartedAt = hrtimeNow();
  return next();
}

async function storeBuffer({ category, buffer, maxOutputBytes, mimeType, originalName, project }) {
  const storeStartedAt = hrtimeNow();
  let compressMs = 0;
  const normalized = category === "photos"
    ? await compressPhoto(buffer, maxOutputBytes || 1024 * 1024).then((result) => {
        compressMs = elapsedMs(storeStartedAt, hrtimeNow());
        return result;
      })
    : { buffer, mimeType };
  const safeName = sanitizeName(originalName).replace(/\.[^.]+$/, "") || "file";
  const extension = extensionForMime(normalized.mimeType);
  const fileName = `${Date.now()}-${crypto.randomUUID()}-${safeName}${extension}`;
  const directory = resolveSafePath(root, project, category);
  const mkdirStartedAt = hrtimeNow();
  await fs.mkdir(directory, { recursive: true });
  const fullPath = resolveSafePath(root, project, category, fileName);
  const writeStartedAt = hrtimeNow();
  await fs.writeFile(fullPath, normalized.buffer, { mode: 0o640 });
  const hashStartedAt = hrtimeNow();
  const sha256 = crypto.createHash("sha256").update(normalized.buffer).digest("hex");
  return {
    fileSizeBytes: normalized.buffer.length,
    mimeType: normalized.mimeType,
    path: `${project}/${category}/${fileName}`,
    sha256,
    timings: {
      compressMs,
      compressSkipped: Boolean(normalized.skipped),
      hashMs: elapsedMs(hashStartedAt, hrtimeNow()),
      mkdirMs: elapsedMs(mkdirStartedAt, writeStartedAt),
      storeMs: elapsedMs(storeStartedAt, hrtimeNow()),
      writeMs: elapsedMs(writeStartedAt, hashStartedAt),
    },
  };
}

async function compressPhoto(input, maxOutputBytes) {
  if (input.length <= maxOutputBytes && isJpeg(input)) {
    return { buffer: input, mimeType: "image/jpeg", skipped: true };
  }

  let quality = 82;
  let width;
  const metadata = await sharp(input).metadata();
  if (metadata.width && metadata.width > 1600) width = 1600;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const output = await sharp(input)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();
    if (output.length <= maxOutputBytes || quality <= 42) {
      return { buffer: output, mimeType: "image/jpeg" };
    }
    quality -= 8;
    if (attempt >= 3) width = Math.max(900, Math.floor((width || metadata.width || 1600) * 0.86));
  }

  const output = await sharp(input)
    .rotate()
    .resize({ width: 900, withoutEnlargement: true })
    .jpeg({ quality: 42, mozjpeg: true })
    .toBuffer();
  return { buffer: output, mimeType: "image/jpeg" };
}

function isJpeg(input) {
  return input.length > 3 && input[0] === 0xff && input[1] === 0xd8 && input[2] === 0xff;
}

function verifyUploadToken(token) {
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) throw httpError(401, "Invalid upload token");
  const expected = crypto.createHmac("sha256", uploadTokenSecret).update(encodedPayload).digest("base64url");
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    throw httpError(401, "Invalid upload token");
  }
  const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
  if (payload.aud !== "metadata-upload") throw httpError(401, "Invalid upload audience");
  if (!payload.exp || Math.floor(Date.now() / 1000) > Number(payload.exp)) throw httpError(401, "Upload token expired");
  if (payload.project !== "surveyor") throw httpError(403, "Project not allowed");
  if (payload.category !== "photos") throw httpError(403, "Category not allowed");
  if (!["image/jpeg", "image/png", "image/webp"].includes(payload.mimeType)) throw httpError(400, "MIME type not allowed");
  if (!Number.isFinite(payload.maxOriginalBytes) || !Number.isFinite(payload.maxOutputBytes)) {
    throw httpError(400, "Invalid upload limits");
  }
  return payload;
}

function signUploadReceipt(payload) {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", uploadTokenSecret).update(encodedPayload).digest("base64url");
  return `${encodedPayload}.${signature}`;
}

function resolveSafePath(base, ...parts) {
  const resolved = path.resolve(base, ...parts);
  const rootResolved = path.resolve(base);
  if (!resolved.startsWith(rootResolved + path.sep) && resolved !== rootResolved) {
    throw httpError(400, "Invalid path");
  }
  return resolved;
}

function safeSegment(value) {
  if (!/^[a-zA-Z0-9_-]+$/.test(value || "")) throw httpError(400, "Invalid path segment");
  return value;
}

function sanitizeName(value) {
  return String(value || "file").replace(/[^a-zA-Z0-9._-]/g, "-").slice(-120);
}

function extensionForMime(mimeType) {
  if (mimeType === "image/jpeg") return ".jpg";
  if (mimeType === "image/png") return ".png";
  if (mimeType === "image/webp") return ".webp";
  return "";
}

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function hrtimeNow() {
  return process.hrtime.bigint();
}

function elapsedMs(start, end) {
  if (!start || !end) return 0;
  return Number(end - start) / 1_000_000;
}

function logUploadTiming({
  category,
  fieldKey,
  fileName,
  inputBytes,
  maxOutputBytes,
  outputBytes,
  project,
  receiveMs,
  timings,
  totalMs,
}) {
  console.info("[METADATA_UPLOAD_TIMING]", JSON.stringify({
    category,
    compression_ratio: inputBytes > 0 ? Number((outputBytes / inputBytes).toFixed(3)) : null,
    field_key: fieldKey,
    file_name: fileName,
    input_bytes: inputBytes,
    max_output_bytes: maxOutputBytes,
    output_bytes: outputBytes,
    project,
    receive_ms: Math.round(receiveMs),
    total_ms: Math.round(totalMs),
    ...formatTimings(timings),
  }));
}

function camelToSnake(value) {
  return value.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function formatTimings(timings) {
  return Object.fromEntries(Object.entries(timings || {}).map(([key, value]) => [
    camelToSnake(key),
    typeof value === "number" ? Math.round(value) : value,
  ]));
}
