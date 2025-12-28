import { Request, Response } from 'express';
import * as userService from './user.service';

export async function getMe(req: Request, res: Response) {
  const userId = (req as any).user?.id as string;
  const profile = await userService.getProfile(userId);
  return res.json({ success: true, data: profile });
}

export async function updateMe(req: Request, res: Response) {
  const userId = (req as any).user?.id as string;
  const profile = await userService.updateProfile(userId, { name: req.body.name });
  return res.json({ success: true, data: profile });
}

