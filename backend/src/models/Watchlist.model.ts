import mongoose, { Schema, Document, Types } from 'mongoose';

export interface Platform {
  name: string;
  logoPath: string;
}

export interface WatchlistItem {
  tmdbId: string;
  title: string;
  posterUrl: string;
  type: 'movie' | 'tv';
  platformList: Platform[];
  runtime?: number; // Duration in minutes
  numberOfSeasons?: number;
  numberOfEpisodes?: number;
  addedAt: Date;
}

export interface IWatchlist extends Document {
  ownerId: Types.ObjectId;
  name: string;
  description?: string;
  imageUrl?: string; // Custom cover image URL (Cloudinary)
  isPublic: boolean;
  collaborators: Types.ObjectId[];
  items: WatchlistItem[];
  displayOrder?: number; // Custom order for sorting watchlists
  createdAt: Date;
  updatedAt: Date;
}

const platformSchema = new Schema<Platform>(
  {
    name: { type: String, required: true },
    logoPath: { type: String, default: '' },
  },
  { _id: false }
);

const watchlistItemSchema = new Schema<WatchlistItem>(
  {
    tmdbId: { type: String, required: true },
    title: { type: String, required: true },
    posterUrl: { type: String, required: true },
    type: { type: String, enum: ['movie', 'tv'], required: true },
    platformList: { type: [platformSchema], default: [] },
    runtime: { type: Number },
    numberOfSeasons: { type: Number },
    numberOfEpisodes: { type: Number },
    addedAt: { type: Date, default: Date.now, required: true },
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
    imageUrl: { type: String },
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
    displayOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
watchlistSchema.index({ ownerId: 1, createdAt: -1 });

export const Watchlist = mongoose.model<IWatchlist>('Watchlist', watchlistSchema);
