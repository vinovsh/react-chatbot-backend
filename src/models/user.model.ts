import mongoose, { Document, Schema } from 'mongoose';

export interface UserDocument extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  password: string;
  name: string;
  role: 'user' | 'admin';
  isEmailVerified: boolean;
  resetPasswordToken?: string | null;
  resetPasswordExpires?: Date | null;
  signupTimezone?: string;
  signupIp?: string;
  lastLoginIp?: string;
  lastLoginUserAgent?: string;
  lastLoginAt?: Date;
}

const userSchema = new Schema<UserDocument>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'admin' },
    isEmailVerified: { type: Boolean, default: false },
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
    signupTimezone: { type: String },
    signupIp: { type: String },
    lastLoginIp: { type: String },
    lastLoginUserAgent: { type: String },
    lastLoginAt: { type: Date }
  },
  { timestamps: true }
);

export const User = mongoose.model<UserDocument>('User', userSchema);


