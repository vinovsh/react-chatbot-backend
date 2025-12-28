import bcrypt from 'bcryptjs';
import { User, UserDocument } from '../../models/user.model';

export async function createUser(params: { email: string; password: string; name: string }): Promise<UserDocument> {
  const hashedPassword = await bcrypt.hash(params.password, 12);
  const user = await User.create({ email: params.email, password: hashedPassword, name: params.name });
  return user;
}

export async function findUserByEmail(email: string): Promise<UserDocument | null> {
  return User.findOne({ email }).exec();
}

export async function validatePassword(user: UserDocument, password: string): Promise<boolean> {
  return bcrypt.compare(password, user.password);
}

export async function getProfile(userId: string): Promise<Pick<UserDocument, 'email' | 'name' | 'role'> | null> {
  const user = await User.findById(userId).select('email name role').lean();
  return (user as any) || null;
}

export async function updateProfile(userId: string, data: Partial<{ name: string }>) {
  return User.findByIdAndUpdate(userId, data, { new: true }).select('email name role').lean();
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

