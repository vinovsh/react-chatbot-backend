import { Request, Response } from 'express';
import * as userService from '../user/user.service';
import * as authService from './auth.service';
import { findUserByEmail } from '../user/user.service';
import { randomUUID } from 'crypto';

export async function signup(req: Request, res: Response) {
  const { email, password, name } = req.body;
  const existing = await findUserByEmail(email);
  if (existing) return res.status(409).json({ success: false, message: req.t("auth.email_already_in_use", { ns: "auth" }) });
  const user = await userService.createUser({ email, password, name });
  const accessToken = authService.signAccessToken(user);
  const refreshToken = authService.signRefreshToken(user);
  return res.status(201).json({ success: true, data: { accessToken, refreshToken } });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  const user = await findUserByEmail(email);
  if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
  const valid = await userService.validatePassword(user, password);
  if (!valid) return res.status(401).json({ success: false, message: 'Invalid credentials' });
  const accessToken = authService.signAccessToken(user);
  const refreshToken = authService.signRefreshToken(user);
  return res.json({ success: true, data: { accessToken, refreshToken } });
}

export async function refresh(req: Request, res: Response) {
  const { refreshToken } = req.body;
  const rotated = authService.rotateRefreshToken(refreshToken);
  if (!rotated) return res.status(401).json({ success: false, message: 'Invalid refresh token' });
  return res.json({ success: true, data: rotated });
}

export async function forgotPassword(req: Request, res: Response) {
  const { email } = req.body;
  const user = await findUserByEmail(email);
  if (!user) return res.json({ success: true });
  const token = randomUUID();
  const expires = new Date(Date.now() + 1000 * 60 * 30);
  await userService.setResetToken(user.id, token, expires);
  // Integrate email service here to send the token link
  return res.json({ success: true });
}

export async function resetPassword(req: Request, res: Response) {
  const { token, password } = req.body;
  const ok = await userService.resetPasswordWithToken(token, password);
  if (!ok) return res.status(400).json({ success: false, message: 'Invalid or expired token' });
  return res.json({ success: true });
}

