#!/usr/bin/env node
/**
 * Uploads public/assets/** to a Supabase storage bucket.
 *
 * Requires (see .env.example):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY   (server-side only — never expose this publicly)
 *   NEXT_PUBLIC_SUPABASE_BUCKET (defaults to "rastaak-assets")
 *
 * Usage:
 *   pnpm assets:upload
 *
 * The bucket should be created with "Public" access so files are served at:
 *   https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
 */
import { createClient } from "@supabase/supabase-js";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ASSETS_DIR = path.join(ROOT, "public", "assets");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || "rastaak-assets";

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    "Missing env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (see .env.example)."
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function walk(dir, base = "") {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    const rel = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) files.push(...(await walk(full, rel)));
    else files.push({ rel, full });
  }
  return files;
}

const MIME = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".gif": "image/gif",
};

async function main() {
  const files = await walk(ASSETS_DIR);
  console.log(`Uploading ${files.length} files to bucket "${BUCKET}"…`);

  let ok = 0;
  for (const file of files) {
    const ext = path.extname(file.full).toLowerCase();
    const contentType = MIME[ext] || "application/octet-stream";
    const data = await readFile(file.full);
    const { error } = await supabase.storage.from(BUCKET).upload(file.rel, data, {
      contentType,
      upsert: true,
    });
    if (error) {
      console.error(`  ✗ ${file.rel}: ${error.message}`);
    } else {
      ok++;
      console.log(`  ✓ ${file.rel}`);
    }
  }
  console.log(`\nDone: ${ok}/${files.length} uploaded.`);
  if (ok > 0) {
    console.log(
      `Public base URL: ${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/`
    );
    console.log(
      "Set NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_BUCKET in your env and the site will serve images from Supabase."
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
