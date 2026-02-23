import { NextFunction, Request, Response, Router } from 'express';
import multer from 'multer';
import path from 'path';
import { authGuard } from '../auth/auth.middleware';
import { uploadImage } from './uploads.controller';

const router = Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(process.cwd(), 'uploads'));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    const unique = `${base}-${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, unique + ext);
  }
});

const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
const MAX_SIZE_BYTES = Number(process.env.UPLOAD_MAX_SIZE_BYTES || 2 * 1024 * 1024);

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error('Invalid file type'));
    }
    cb(null, true);
  }
});

router.post(
  '/uploads/images',
  authGuard,
  upload.single('file'),
  (err: any, _req: Request, res: Response, next: NextFunction) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    return next();
  },
  uploadImage
);

export default router;

