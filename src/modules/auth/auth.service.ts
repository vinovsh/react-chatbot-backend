import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { UserDocument } from '../../models/user.model';

const ACCESS_TTL: SignOptions['expiresIn'] =
  (process.env.JWT_ACCESS_TTL || '15m') as SignOptions['expiresIn'];
const REFRESH_TTL: SignOptions['expiresIn'] =
  (process.env.JWT_REFRESH_TTL || '7d') as SignOptions['expiresIn'];

export function signAccessToken(user: UserDocument): string {
  const secret: Secret = process.env.JWT_ACCESS_SECRET as Secret;
  const options: SignOptions = {
    subject: user._id.toString(),
    expiresIn: ACCESS_TTL,
    algorithm: 'HS256'
  };

  return jwt.sign({ type: 'access' }, secret, options);
}

export function signRefreshToken(user: UserDocument): string {
  const secret: Secret = process.env.JWT_REFRESH_SECRET as Secret;
  const options: SignOptions = {
    subject: user._id.toString(),
    expiresIn: REFRESH_TTL
  };

  return jwt.sign({ type: 'refresh' }, secret, options);
}

export function rotateRefreshToken(refreshToken: string): { accessToken: string; refreshToken: string } | null {
  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET as string) as any;
    if (payload.type !== 'refresh') return null;
    const userId = payload.sub as string;

    const accessSecret: Secret = process.env.JWT_ACCESS_SECRET as Secret;
    const accessOptions: SignOptions = {
      subject: userId,
      expiresIn: ACCESS_TTL
    };
    const accessToken = jwt.sign({ type: 'access' }, accessSecret, accessOptions);

    const refreshSecret: Secret = process.env.JWT_REFRESH_SECRET as Secret;
    const refreshOptions: SignOptions = {
      subject: userId,
      expiresIn: REFRESH_TTL
    };
    const newRefresh = jwt.sign({ type: 'refresh' }, refreshSecret, refreshOptions);
    return { accessToken, refreshToken: newRefresh };
  } catch {
    return null;
  }
}

