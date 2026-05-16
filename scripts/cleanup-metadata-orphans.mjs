import { createClient } from "@supabase/supabase-js";

const metadataUrl = requiredEnv("METADATA_API_URL").replace(/\/+$/, "");
const metadataKey = requiredEnv("METADATA_API_KEY");
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
  headers: {
    "Content-Type": "application/json",
    "x-metadata-key": metadataKey,
  },
  body: JSON.stringify({
    dryRun,
    knownPaths,
    olderThanHours,
  }),
});

const payload = await response.json().catch(() => null);
if (!response.ok || !payload?.ok) {
  console.error(payload ?? await response.text().catch(() => "Cleanup failed"));
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
