import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env";
import fs from "fs";
import path from "path";

const supabaseUrl = env("SUPABASE_URL");
const serviceRoleKey = env("SUPABASE_SERVICE_ROLE_KEY");
const storageClient = createClient(supabaseUrl, serviceRoleKey);
const BUCKET = "post-media";

const MEDIA_STORE_PATH = path.join(process.cwd(), "data", "media-store.json");

function ensureMediaStore() {
  const dir = path.dirname(MEDIA_STORE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(MEDIA_STORE_PATH)) fs.writeFileSync(MEDIA_STORE_PATH, "{}");
}

function readMediaStore(): Record<string, string[]> {
  ensureMediaStore();
  try {
    return JSON.parse(fs.readFileSync(MEDIA_STORE_PATH, "utf-8"));
  } catch {
    return {};
  }
}

function writeMediaStore(store: Record<string, string[]>) {
  ensureMediaStore();
  fs.writeFileSync(MEDIA_STORE_PATH, JSON.stringify(store, null, 2));
}

export async function uploadFile(
  buffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> {
  const { data, error } = await storageClient.storage
    .from(BUCKET)
    .upload(fileName, buffer, {
      contentType: mimeType,
      upsert: true,
    });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  const { data: publicUrl } = storageClient.storage
    .from(BUCKET)
    .getPublicUrl(data.path);

  return publicUrl.publicUrl;
}

export async function savePostMedia(
  postId: string,
  urls: string[]
): Promise<void> {
  const store = readMediaStore();
  store[postId] = urls;
  writeMediaStore(store);
}

export function getPostMedia(postId: string): string[] {
  const store = readMediaStore();
  return store[postId] || [];
}

export function getAllMedia(postIds: string[]): Record<string, string[]> {
  const store = readMediaStore();
  const result: Record<string, string[]> = {};
  for (const id of postIds) {
    if (store[id]) result[id] = store[id];
  }
  return result;
}

export function deletePostMedia(postId: string): void {
  const store = readMediaStore();
  delete store[postId];
  writeMediaStore(store);
}
