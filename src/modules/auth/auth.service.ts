import jwt from 'jsonwebtoken';
import { UserDocument } from '../../models/user.model';

const ACCESS_TTL = process.env.JWT_ACCESS_TTL || '15m';
const REFRESH_TTL = process.env.JWT_REFRESH_TTL || '7d';

export function signAccessToken(user: UserDocument): string {
  return jwt.sign({ type: 'access' }, process.env.JWT_ACCESS_SECRET as string, {
    subject: user._id.toString(),
    expiresIn: ACCESS_TTL
  });
}

export function signRefreshToken(user: UserDocument): string {
  return jwt.sign({ type: 'refresh' }, process.env.JWT_REFRESH_SECRET as string, {
    subject: user._id.toString(),
    expiresIn: REFRESH_TTL
  });
}

export function rotateRefreshToken(refreshToken: string): { accessToken: string; refreshToken: string } | null {
  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET as string) as any;
    if (payload.type !== 'refresh') return null;
    const userId = payload.sub as string;
    const accessToken = jwt.sign({ type: 'access' }, process.env.JWT_ACCESS_SECRET as string, {
      subject: userId,
      expiresIn: ACCESS_TTL
    });
    const newRefresh = jwt.sign({ type: 'refresh' }, process.env.JWT_REFRESH_SECRET as string, {
      subject: userId,
      expiresIn: REFRESH_TTL
    });
    return { accessToken, refreshToken: newRefresh };
  } catch {
    return null;
  }
}

