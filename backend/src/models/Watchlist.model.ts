import mongoose, { type Document, Schema, type Types } from "mongoose";

export interface Platform {
	name: string;
	logoPath: string;
}

export interface WatchlistItem {
	tmdbId: string;
	title: string;
	posterUrl: string;
	type: "movie" | "tv";
	platformList: Platform[];
	runtime?: number; // Duration in minutes
	numberOfSeasons?: number;
	numberOfEpisodes?: number;
	addedAt: Date;
}

export interface WatchlistCategories {
	genre?: string[];
	watchProvider?: string[];
}

export interface IWatchlist extends Document {
	ownerId: Types.ObjectId;
	name: string;
	description?: string;
	imageUrl?: string; // Custom cover image URL (Cloudinary)
	thumbnailUrl?: string; // Auto-generated 2x2 poster grid thumbnail (Cloudinary)
	isPublic: boolean;
	categories?: WatchlistCategories | string[]; // New format: { genre: [], watchProvider: [] } | Old format: string[] for backward compatibility
	collaborators: Types.ObjectId[];
	items: WatchlistItem[];
	likedBy: Types.ObjectId[]; // Array of user IDs who liked/saved this watchlist
	createdAt: Date;
	updatedAt: Date;
}

const platformSchema = new Schema<Platform>(
	{
		name: { type: String, required: true },
		logoPath: { type: String, default: "" },
	},
	{ _id: false }
);

const watchlistItemSchema = new Schema<WatchlistItem>(
	{
		tmdbId: { type: String, required: true },
		title: { type: String, required: true },
		posterUrl: { type: String, required: true },
		type: { type: String, enum: ["movie", "tv"], required: true },
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
			ref: "User",
			required: true,
			index: true,
		},
		name: { type: String, required: true },
		description: { type: String },
		imageUrl: { type: String },
		thumbnailUrl: { type: String },
		isPublic: { type: Boolean, default: false },
		categories: {
			type: Schema.Types.Mixed, // Accepts both old format (string[]) and new format ({ genre: [], watchProvider: [] })
			default: undefined,
		},
		collaborators: {
			type: [Schema.Types.ObjectId],
			ref: "User",
			default: [],
		},
		items: {
			type: [watchlistItemSchema],
			default: [],
		},
		likedBy: {
			type: [Schema.Types.ObjectId],
			ref: "User",
			default: [],
			index: true, // Index for sorting by popularity (array size)
		},
	},
	{
		timestamps: true,
	}
);

// Compound index for efficient queries
watchlistSchema.index({ ownerId: 1, createdAt: -1 });
watchlistSchema.index({ categories: 1, isPublic: 1 }); // For filtering public watchlists by category (old format - backward compatibility)
watchlistSchema.index({ "categories.genre": 1, isPublic: 1 }); // For filtering public watchlists by genre (new format)
watchlistSchema.index({ "categories.watchProvider": 1, isPublic: 1 }); // For filtering public watchlists by watch provider (new format)
watchlistSchema.index({ isPublic: 1, createdAt: -1 }); // For filtering and sorting public watchlists

export const Watchlist = mongoose.model<IWatchlist>(
	"Watchlist",
	watchlistSchema
);
