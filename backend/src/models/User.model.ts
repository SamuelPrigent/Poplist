import mongoose, { type Document, Schema } from "mongoose";

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
	avatarUrl?: string;
	roles: string[];
	refreshTokens: RefreshToken[];
	savedWatchlists: mongoose.Types.ObjectId[]; // References to saved public watchlists
	collaborativeWatchlists: mongoose.Types.ObjectId[]; // Watchlists where user is a collaborator
	watchlistsOrder: mongoose.Types.ObjectId[]; // User's custom ordering for all watchlists
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
			default: "fr",
		},
		avatarUrl: { type: String },
		roles: {
			type: [String],
			default: ["user"],
		},
		refreshTokens: {
			type: [refreshTokenSchema],
			default: [],
		},
		savedWatchlists: {
			type: [Schema.Types.ObjectId],
			ref: "Watchlist",
			default: [],
		},
		collaborativeWatchlists: {
			type: [Schema.Types.ObjectId],
			ref: "Watchlist",
			default: [],
		},
		watchlistsOrder: {
			type: [Schema.Types.ObjectId],
			ref: "Watchlist",
			default: [],
		},
	},
	{
		timestamps: true,
	}
);

export const User = mongoose.model<IUser>("User", userSchema);
