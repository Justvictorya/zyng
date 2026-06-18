import { Router, Request, Response } from "express";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";
import { uploadFile } from "../lib/storage";

const router = Router();
const FIFTY_MB = 50 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: FIFTY_MB },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "image/jpeg", "image/png", "image/gif", "image/webp",
      "video/mp4", "video/quicktime", "video/x-msvideo",
      "video/x-matroska", "video/webm", "video/mpeg",
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file type"));
    }
  },
});

// Permissive multer for chunk uploads (client already validates types)
const chunkUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: FIFTY_MB },
});

function getChunkDir(fileId: string) {
  const dir = path.join("/tmp", "uploads", fileId);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

// Simple upload for files <= 50MB
router.post("/", upload.array("files", 20), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, error: "No files provided" });
    }

    const urls: string[] = [];

    for (const file of files) {
      const ext = path.extname(file.originalname) || ".bin";
      const uniqueName = `${uuidv4()}${ext}`;
      const url = await uploadFile(file.buffer, uniqueName, file.mimetype);
      urls.push(url);
    }

    return res.json({ success: true, urls });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Upload a single chunk
router.post("/chunk", chunkUpload.single("file"), async (req: Request, res: Response) => {
  try {
    const file = req.file as Express.Multer.File | undefined;
    if (!file) return res.status(400).json({ success: false, error: "No chunk file provided" });

    const { fileId, chunkIndex, totalChunks, originalName, mimeType } = req.body;

    if (!fileId || chunkIndex === undefined || !totalChunks) {
      return res.status(400).json({ success: false, error: "Missing chunk metadata" });
    }

    const chunkDir = getChunkDir(fileId);
    const chunkPath = path.join(chunkDir, `chunk_${chunkIndex}`);

    // Save metadata on first chunk
    if (Number(chunkIndex) === 0) {
      fs.writeFileSync(
        path.join(chunkDir, "meta.json"),
        JSON.stringify({ originalName: originalName || "file", mimeType: mimeType || "application/octet-stream", totalChunks: Number(totalChunks) })
      );
    }

    fs.writeFileSync(chunkPath, file.buffer);
    return res.json({ success: true, chunkIndex: Number(chunkIndex) });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Reassemble chunks and upload to Supabase Storage
router.post("/complete", async (req: Request, res: Response) => {
  try {
    const { fileId } = req.body;
    if (!fileId) return res.status(400).json({ success: false, error: "fileId required" });

    const chunkDir = getChunkDir(fileId);
    const metaPath = path.join(chunkDir, "meta.json");

    if (!fs.existsSync(metaPath)) {
      return res.status(400).json({ success: false, error: "No upload session found for this fileId" });
    }

    const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
    const { originalName, mimeType, totalChunks } = meta;

    // Check all chunks present
    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = path.join(chunkDir, `chunk_${i}`);
      if (!fs.existsSync(chunkPath)) {
        return res.status(400).json({ success: false, error: `Missing chunk ${i}` });
      }
    }

    // Concatenate chunks
    const chunks: Buffer[] = [];
    for (let i = 0; i < totalChunks; i++) {
      chunks.push(fs.readFileSync(path.join(chunkDir, `chunk_${i}`)));
    }
    const fullBuffer = Buffer.concat(chunks);

    // Upload to Supabase Storage
    const ext = path.extname(originalName) || ".bin";
    const uniqueName = `${uuidv4()}${ext}`;
    const url = await uploadFile(fullBuffer, uniqueName, mimeType);

    // Clean up temp files
    fs.rmSync(chunkDir, { recursive: true, force: true });

    return res.json({ success: true, url });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
