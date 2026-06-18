import { Router, Request, Response } from "express";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import path from "path";
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

export default router;
