import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IOneTimeInvite extends Document {
  watchlistId: Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  used: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
}

const oneTimeInviteSchema = new Schema<IOneTimeInvite>(
  {
    watchlistId: {
      type: Schema.Types.ObjectId,
      ref: 'Watchlist',
      required: true,
      index: true,
    },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    used: { type: Boolean, default: false },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Automatically remove expired invites (TTL index)
oneTimeInviteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OneTimeInvite = mongoose.model<IOneTimeInvite>(
  'OneTimeInvite',
  oneTimeInviteSchema
);
