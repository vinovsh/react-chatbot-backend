import { Request, Response } from 'express';
import Joi from 'joi';
import * as userService from './user.service';

const profileUpdate = Joi.object({
  name: Joi.string().trim().min(1).max(100),
  avatarUrl: Joi.string().max(120_000).pattern(/^data:image\/(?:jpeg|png|webp);base64,[a-z0-9+/]+={0,2}$/i),
}).min(1).required();

export async function getMe(req: Request, res: Response) {
  const profile = await userService.getProfile(req.user!.id);
  if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });
  return res.json({ success: true, data: profile });
}

export async function updateMe(req: Request, res: Response) {
  const { error, value } = profileUpdate.validate(req.body);
  if (error) return res.status(422).json({ success: false, message: error.message });

  const profile = await userService.updateProfile(req.user!.id, value);
  if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });
  return res.json({ success: true, data: profile });
}
