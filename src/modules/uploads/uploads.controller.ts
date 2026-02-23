import { Request, Response } from 'express';
import path from 'path';

export async function uploadImage(req: Request, res: Response) {
  const file = (req as any).file as Express.Multer.File | undefined;

  if (!file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  const baseUrl = process.env.UPLOADS_BASE_URL || '';
  const url = baseUrl
    ? `${baseUrl.replace(/\/$/, '')}/${file.filename}`
    : `/uploads/${file.filename}`;

  return res.status(201).json({
    success: true,
    data: {
      url,
      mimeType: file.mimetype,
      size: file.size,
      originalName: file.originalname,
      filename: file.filename
    }
  });
}

