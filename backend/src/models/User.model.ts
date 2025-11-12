import mongoose, { Schema, Document } from 'mongoose';

export interface RefreshToken {
  tokenHash: string;
  issuedAt: Date;
  userAgent?: string;
}

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  username: string;
  passwordHash?: string;
  googleId?: string;
  language?: string;
  roles: string[];
  refreshTokens: RefreshToken[];
  createdAt: Date;
  updatedAt: Date;
}

const refreshTokenSchema = new Schema<RefreshToken>(
  {
    tokenHash: { type: String, required: true },
    issuedAt: { type: Date, required: true, default: Date.now },
    userAgent: { type: String },
  },
  { _id: false }
);

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String },
    googleId: { type: String, sparse: true, index: true },
    language: {
      type: String,
      default: 'fr',
    },
    roles: {
      type: [String],
      default: ['user'],
    },
    refreshTokens: {
      type: [refreshTokenSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model<IUser>('User', userSchema);
