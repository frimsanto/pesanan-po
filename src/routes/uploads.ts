import { Router, type Request, type Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = Router();

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req: Request, _file: any, cb: (error: Error | null, destination: string) => void) => {
    cb(null, uploadDir);
  },
  filename: (_req: Request, file: any, cb: (error: Error | null, filename: string) => void) => {
    const ext = path.extname(file.originalname) || "";
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, "");
    const timestamp = Date.now();
    cb(null, `${base || "image"}-${timestamp}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.post("/image", upload.single("image"), (req: Request, res: Response) => {
  const file = (req as any).file as any;
  if (!file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  const filename = file.filename;
  const urlPath = `/uploads/${filename}`;
  res.status(201).json({ url: urlPath });
});

export default router;
