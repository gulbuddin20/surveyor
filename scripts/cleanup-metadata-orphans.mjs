import { createClient } from "@supabase/supabase-js";

const metadataUrl = requiredEnv("METADATA_API_URL").replace(/\/+$/, "");
const metadataKey = requiredEnv("METADATA_API_KEY");
const cfAccessClientId = process.env.METADATA_CF_ACCESS_CLIENT_ID;
const cfAccessClientSecret = process.env.METADATA_CF_ACCESS_CLIENT_SECRET;
const supabaseUrl = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
const supabaseSecretKey = requiredEnv("SUPABASE_SECRET_KEY");
const project = process.env.METADATA_CLEANUP_PROJECT || "surveyor";
const category = process.env.METADATA_CLEANUP_CATEGORY || "photos";
const olderThanHours = Number(process.env.METADATA_CLEANUP_OLDER_THAN_HOURS || 24);
const dryRun = process.env.METADATA_CLEANUP_DRY_RUN !== "false";

const supabase = createClient(supabaseUrl, supabaseSecretKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  db: {
    schema: "surveyor",
  },
});

const knownPaths = await loadKnownPhotoPaths();
const response = await fetch(`${metadataUrl}/maintenance/orphan-uploads/${project}/${category}`, {
  method: "POST",
  headers: buildMetadataHeaders(),
  body: JSON.stringify({
    dryRun,
    knownPaths,
    olderThanHours,
  }),
});

const responseText = await response.text();
const payload = parseJson(responseText);
if (!response.ok || !payload?.ok) {
  console.error(JSON.stringify({
    ok: false,
    status: response.status,
    statusText: response.statusText,
    response: payload ?? responseText.slice(0, 1000),
  }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  deleted: payload.deleted,
  dryRun: payload.dryRun,
  knownPathCount: knownPaths.length,
  olderThanHours: payload.olderThanHours,
  orphanCount: payload.orphanPaths?.length ?? 0,
  orphanPaths: payload.orphanPaths ?? [],
}, null, 2));

async function loadKnownPhotoPaths() {
  const paths = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const to = from + pageSize - 1;
    const { data, error } = await supabase
      .from("survey_photos")
      .select("storage_path")
      .range(from, to);
    if (error) throw error;
    paths.push(...(data ?? []).map((row) => row.storage_path).filter(Boolean));
    if (!data || data.length < pageSize) break;
  }
  return paths;
}

function requiredEnv(key) {
  const value = process.env[key];
  if (!value) {
    console.error(`${key} is required`);
    process.exit(1);
  }
  return value;
}

function buildMetadataHeaders() {
  const headers = {
    "Content-Type": "application/json",
    "x-metadata-key": metadataKey,
  };

  if (cfAccessClientId && cfAccessClientSecret) {
    headers["CF-Access-Client-Id"] = cfAccessClientId;
    headers["CF-Access-Client-Secret"] = cfAccessClientSecret;
  }

  return headers;
}

function parseJson(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}
