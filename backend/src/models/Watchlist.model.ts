import mongoose, { Schema, Document, Types } from 'mongoose';

export interface WatchlistItem {
  tmdbId: string;
  title: string;
  posterUrl: string;
  type: 'movie' | 'tv';
  platformList: string[];
}

export interface IWatchlist extends Document {
  ownerId: Types.ObjectId;
  name: string;
  description?: string;
  isPublic: boolean;
  collaborators: Types.ObjectId[];
  items: WatchlistItem[];
  createdAt: Date;
  updatedAt: Date;
}

const watchlistItemSchema = new Schema<WatchlistItem>(
  {
    tmdbId: { type: String, required: true },
    title: { type: String, required: true },
    posterUrl: { type: String, required: true },
    type: { type: String, enum: ['movie', 'tv'], required: true },
    platformList: { type: [String], default: [] },
  },
  { _id: false }
);

const watchlistSchema = new Schema<IWatchlist>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: { type: String, required: true },
    description: { type: String },
    isPublic: { type: Boolean, default: false },
    collaborators: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },
    items: {
      type: [watchlistItemSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
watchlistSchema.index({ ownerId: 1, createdAt: -1 });

export const Watchlist = mongoose.model<IWatchlist>('Watchlist', watchlistSchema);
