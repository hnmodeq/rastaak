/**
 * Image/asset URL helper.
 *
 * If Supabase storage is configured (NEXT_PUBLIC_SUPABASE_URL +
 * NEXT_PUBLIC_SUPABASE_BUCKET), images are served from the Supabase bucket:
 *   https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
 *
 * Otherwise it falls back to the local /public/assets files, so the site
 * builds and runs everywhere — even before you set up Supabase.
 */
const SUPABASE_URL = (
  process.env.NEXT_PUBLIC_SUPABASE_URL || ""
).replace(/\/$/, "");
const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || "rastaak-assets";

export function assetUrl(path: string): string {
  if (SUPABASE_URL) {
    return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
  }
  return `/assets/${path}`;
}
