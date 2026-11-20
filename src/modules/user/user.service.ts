import bcrypt from 'bcryptjs';
import { User, UserDocument } from '../../models/user.model';

export interface CreateUserParams {
  email: string;
  password: string;
  name: string;
  signupTimezone?: string;
  signupIp?: string;
}

export async function createUser(params: CreateUserParams): Promise<UserDocument> {
  const hashedPassword = await bcrypt.hash(params.password, 12);
  const user = await User.create({
    email: params.email,
    password: hashedPassword,
    name: params.name,
    signupTimezone: params.signupTimezone,
    signupIp: params.signupIp,
  });
  return user;
}

export async function findUserByEmail(email: string): Promise<UserDocument | null> {
  return User.findOne({ email }).exec();
}

export async function validatePassword(user: UserDocument, password: string): Promise<boolean> {
  return bcrypt.compare(password, user.password);
}

const profileFields = 'email name role isEmailVerified signupTimezone avatarUrl';

export async function getProfile(userId: string) {
  return User.findById(userId).select(profileFields).lean();
}

export async function updateProfile(userId: string, data: Partial<{ name: string; avatarUrl: string }>) {
  return User.findByIdAndUpdate(userId, { $set: data }, { new: true }).select(profileFields).lean();
}

export async function setResetToken(userId: string, token: string, expires: Date): Promise<void> {
  await User.findByIdAndUpdate(userId, { resetPasswordToken: token, resetPasswordExpires: expires }).exec();
}

export async function resetPasswordWithToken(token: string, newPassword: string): Promise<boolean> {
  const user = await User.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: new Date() } });
  if (!user) return false;
  user.password = await bcrypt.hash(newPassword, 12);
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;
  await user.save();
  return true;
}

export async function recordLogin(userId: string, data: { ip?: string; userAgent?: string }): Promise<void> {
  await User.findByIdAndUpdate(
    userId,
    {
      lastLoginIp: data.ip,
      lastLoginUserAgent: data.userAgent,
      lastLoginAt: new Date(),
    },
    { new: false }
  ).exec();
}

