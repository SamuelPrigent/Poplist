import { v2 as cloudinary } from "cloudinary";
import type { Request, Response } from "express";
import { type Document, Types } from "mongoose";
import { z } from "zod";
import { saveToCache } from "../middleware/cache.middleware.js";
import { User } from "../models/User.model.js";
import {
	type IWatchlist,
	type Platform,
	Watchlist,
} from "../models/Watchlist.model.js";
import {
	deleteThumbnailFromCloudinary,
	generateThumbnail,
	regenerateThumbnail,
	uploadThumbnailToCloudinary,
} from "../services/thumbnail.service.js";
import {
	enrichMediaData,
	getFullMediaDetails,
	searchMedia,
} from "../services/tmdb.service.js";

/**
 * Type for Watchlist.toObject() result with custom flags added by controller
 */
interface WatchlistObject extends Omit<IWatchlist, keyof Document> {
	_id: Types.ObjectId;
}

/**
 * Watchlist object enriched with user-specific flags
 */
interface WatchlistWithFlags extends WatchlistObject {
	isOwner: boolean;
	isCollaborator: boolean;
	isSaved: boolean;
}

/**
 * Validate if an ID is a valid MongoDB ObjectId
 * Returns false for offline IDs or invalid ObjectIds
 */
function isValidWatchlistId(id: string): boolean {
	return !id.startsWith("offline-") && Types.ObjectId.isValid(id);
}

/**
 * Extract Cloudinary public_id from a Cloudinary URL
 * Example: https://res.cloudinary.com/dxqyjaa91/image/upload/v1762789942/watchlists/abc123.jpg
 * Returns: watchlists/abc123
 */
function extractPublicIdFromUrl(imageUrl: string): string | null {
	try {
		// Match pattern: /upload/[version]/[public_id].[extension]
		const match = imageUrl.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/);
		return match ? match[1] : null;
	} catch (error) {
		console.error("Failed to extract public_id from URL:", error);
		return null;
	}
}

const platformSchema = z.object({
	name: z.string(),
	logoPath: z.string().default(""),
});

const watchlistItemSchema = z.object({
	tmdbId: z.string(),
	title: z.string(),
	posterUrl: z.string(),
	type: z.enum(["movie", "tv"]),
	platformList: z.array(platformSchema).default([]),
	runtime: z.number().optional(),
	numberOfSeasons: z.number().optional(),
	numberOfEpisodes: z.number().optional(),
	addedAt: z.string().or(z.date()).optional(),
});

const createWatchlistSchema = z.object({
	name: z.string().min(1).max(100),
	description: z.string().max(500).optional(),
	isPublic: z.boolean().default(false),
	categories: z.array(z.string()).optional(),
	items: z.array(watchlistItemSchema).default([]),
	fromLocalStorage: z.boolean().optional(),
});

const updateWatchlistSchema = z.object({
	name: z.string().min(1).max(100).optional(),
	description: z.string().max(500).optional(),
	isPublic: z.boolean().optional(),
	categories: z.array(z.string()).optional(),
	items: z.array(watchlistItemSchema).optional(),
});

const addCollaboratorSchema = z.object({
	username: z.string().min(3).max(20),
});

const addItemSchema = z.object({
	tmdbId: z.string(),
	type: z.enum(["movie", "tv"]),
	language: z.string().default("fr-FR"),
	region: z.string().default("FR"),
});

const moveItemSchema = z.object({
	position: z.enum(["first", "last"]),
});

const reorderItemsSchema = z.object({
	orderedTmdbIds: z.array(z.string()),
});

const reorderWatchlistsSchema = z.object({
	orderedWatchlistIds: z.array(z.string()),
});

export async function getMyWatchlists(
	req: Request,
	res: Response,
): Promise<void> {
	try {
		if (!req.user) {
			res.status(401).json({ error: "Not authenticated" });
			return;
		}
		const userId = req.user.sub;

		// Get user to access savedWatchlists and watchlistsOrder
		const user = await User.findById(userId);
		if (!user) {
			res.status(404).json({ error: "User not found" });
			return;
		}

		// Find all watchlists where user is owner or collaborator
		const ownedOrCollaborated = await Watchlist.find({
			$or: [{ ownerId: userId }, { collaborators: userId }],
		})
			.populate("ownerId", "email username avatarUrl")
			.populate("collaborators", "email username avatarUrl");

		// Find all saved watchlists
		const saved =
			user.savedWatchlists.length > 0
				? await Watchlist.find({
						_id: { $in: user.savedWatchlists },
					})
						.populate("ownerId", "email username avatarUrl")
						.populate("collaborators", "email username avatarUrl")
				: [];

		// Merge and deduplicate (prioritize owned/collaborated watchlists over saved)
		const watchlistsMap = new Map<string, WatchlistWithFlags>();
		const savedIds = new Set(
			saved.map((w) => (w._id as Types.ObjectId).toString()),
		);

		// Add owned/collaborated first (higher priority)
		ownedOrCollaborated.forEach((w) => {
			const idStr = (w._id as Types.ObjectId).toString();
			const baseObj = w.toObject() as WatchlistObject;
			// Check if user is the owner (handle populated ownerId)
			const ownerId =
				w.ownerId?._id?.toString() || (w.ownerId as Types.ObjectId).toString();
			const isOwner = ownerId === userId;
			// Check if user is a collaborator (handle populated collaborators)
			const isCollaborator = w.collaborators.some((collab) => {
				const collabId = collab?._id?.toString() || collab?.toString();
				return collabId === userId;
			});

			const watchlistObj: WatchlistWithFlags = {
				...baseObj,
				isOwner,
				isCollaborator,
				isSaved: savedIds.has(idStr),
			};

			//   console.log(`📊 [getMine] Watchlist "${w.name}":`, {
			//     isOwner,
			//     isCollaborator,
			//     isSaved: savedIds.has(idStr),
			//     collaboratorsCount: w.collaborators.length,
			//   });

			watchlistsMap.set(idStr, watchlistObj);
		});

		// Add saved watchlists (won't override if already exists)
		saved.forEach((w) => {
			const idStr = (w._id as Types.ObjectId).toString();
			if (!watchlistsMap.has(idStr)) {
				const baseObj = w.toObject() as WatchlistObject;
				const watchlistObj: WatchlistWithFlags = {
					...baseObj,
					isOwner: false, // User is not owner (it's a followed watchlist)
					isCollaborator: false,
					isSaved: true,
				};

				// console.log(`📊 [getMine] Saved watchlist "${w.name}":`, {
				//   isOwner: false,
				//   isCollaborator: false,
				//   isSaved: true,
				// });

				watchlistsMap.set(idStr, watchlistObj);
			}
		});

		// console.log(`📊 [getMine] Summary:`, {
		//   userId,
		//   ownedOrCollaboratedCount: ownedOrCollaborated.length,
		//   savedCount: saved.length,
		//   totalUniqueWatchlists: watchlistsMap.size,
		// });

		// Auto-repair logic: Ensure all watchlists are in watchlistsOrder
		const allWatchlistIds = Array.from(watchlistsMap.keys());
		const currentOrder = user.watchlistsOrder.map((id) => id.toString());
		let needsSave = false;

		// Find missing watchlists (exist but not in order)
		const missingIds = allWatchlistIds.filter(
			(id) => !currentOrder.includes(id),
		);
		if (missingIds.length > 0) {
			// Add missing watchlists to the end
			user.watchlistsOrder.push(
				...missingIds.map((id) => new Types.ObjectId(id)),
			);
			needsSave = true;
		}

		// Find invalid IDs (in order but don't exist)
		const validOrderIds = user.watchlistsOrder.filter((id) => {
			const idStr = id.toString();
			return allWatchlistIds.includes(idStr);
		});

		if (validOrderIds.length !== user.watchlistsOrder.length) {
			user.watchlistsOrder = validOrderIds;
			needsSave = true;
		}

		// Save user if modifications were made
		if (needsSave) {
			await user.save();
		}

		// Sort watchlists by user's custom order
		const orderMap = new Map<string, number>();
		user.watchlistsOrder.forEach((id, index) => {
			orderMap.set(id.toString(), index);
		});

		const watchlists = Array.from(watchlistsMap.values()).sort((a, b) => {
			const orderA = orderMap.get(a._id.toString()) ?? Number.MAX_SAFE_INTEGER;
			const orderB = orderMap.get(b._id.toString()) ?? Number.MAX_SAFE_INTEGER;
			return orderA - orderB;
		});

		res.json({ watchlists });
	} catch (error) {
		console.log(error);
		return;
	}
}

export async function createWatchlist(
	req: Request,
	res: Response,
): Promise<void> {
	try {
		if (!req.user) {
			res.status(401).json({ error: "Not authenticated" });
			return;
		}
		const userId = req.user.sub;
		const data = createWatchlistSchema.parse(req.body);

		// Check if watchlist with same name exists (for local storage merge)
		if (data.fromLocalStorage) {
			const existing = await Watchlist.findOne({
				ownerId: userId,
				name: data.name,
			});

			if (existing) {
				// Append "(local)" to the name
				data.name = `${data.name} (local)`;
			}
		}

		const watchlist = await Watchlist.create({
			ownerId: userId,
			name: data.name,
			description: data.description,
			isPublic: data.isPublic,
			categories: data.categories,
			items: data.items,
		});

		// Add watchlist to owner's watchlistsOrder
		const owner = await User.findById(userId);
		if (owner) {
			owner.watchlistsOrder.push(watchlist._id as Types.ObjectId);
			await owner.save();
		}

		// Regenerate thumbnail in background if watchlist has items (don't wait for it)
		if (watchlist.items.length > 0) {
			const posterUrls = watchlist.items
				.slice(0, 4)
				.filter((item) => item.posterUrl)
				.map((item) => item.posterUrl);

			if (posterUrls.length > 0) {
				regenerateThumbnail(String(watchlist._id), posterUrls)
					.then((thumbnailUrl) => {
						if (thumbnailUrl) {
							watchlist.thumbnailUrl = thumbnailUrl;
							watchlist
								.save()
								.catch((err) =>
									console.error("Failed to save thumbnail URL:", err),
								);
						}
					})
					.catch((err) =>
						console.error("Failed to regenerate thumbnail:", err),
					);
			}
		}

		res.status(201).json({ watchlist });
	} catch (error) {
		if (error instanceof z.ZodError) {
			res.status(400).json({ error: "Invalid input", details: error.errors });
			return;
		}
		throw error;
	}
}

export async function updateWatchlist(
	req: Request,
	res: Response,
): Promise<void> {
	try {
		if (!req.user) {
			res.status(401).json({ error: "Not authenticated" });
			return;
		}
		const userId = req.user.sub;
		const { id } = req.params;
		const data = updateWatchlistSchema.parse(req.body);

		if (!isValidWatchlistId(id)) {
			res.status(404).json({ error: "Watchlist not found" });
			return;
		}

		const watchlist = await Watchlist.findById(id);

		if (!watchlist) {
			res.status(404).json({ error: "Watchlist not found" });
			return;
		}

		// Check if user is owner or collaborator
		const isOwner = watchlist.ownerId.toString() === userId;
		const isCollaborator = watchlist.collaborators.some(
			(c) => c.toString() === userId,
		);

		if (!isOwner && !isCollaborator) {
			res.status(403).json({ error: "Forbidden" });
			return;
		}

		// Update fields
		if (data.name) watchlist.name = data.name;
		if (data.description !== undefined)
			watchlist.description = data.description;
		if (data.isPublic !== undefined) watchlist.isPublic = data.isPublic;
		if (data.categories !== undefined) watchlist.categories = data.categories;
		if (data.items) {
			// Transform items to ensure addedAt is a Date and platformList is properly formatted
			watchlist.items = data.items.map((item) => {
				// Clean up platformList to ensure it's in the correct format
				const cleanedPlatformList = (item.platformList || [])
					.filter((p) => p !== null && p !== undefined)
					.map((p: unknown) => {
						if (typeof p === "string") {
							return p.trim() ? { name: p, logoPath: "" } : null;
						}
						if (
							p &&
							typeof p === "object" &&
							"name" in p &&
							typeof (p as { name: unknown }).name === "string" &&
							(p as { name: string }).name.trim()
						) {
							const platform = p as { name: string; logoPath?: unknown };
							return {
								name: platform.name,
								logoPath:
									typeof platform.logoPath === "string"
										? platform.logoPath
										: "",
							};
						}
						return null;
					})
					.filter((p): p is { name: string; logoPath: string } => p !== null);

				return {
					tmdbId: item.tmdbId,
					title: item.title,
					posterUrl: item.posterUrl,
					type: item.type,
					runtime: item.runtime,
					numberOfSeasons: item.numberOfSeasons,
					numberOfEpisodes: item.numberOfEpisodes,
					platformList:
						cleanedPlatformList.length > 0
							? cleanedPlatformList
							: [{ name: "Inconnu", logoPath: "" }],
					addedAt: item.addedAt
						? item.addedAt instanceof Date
							? item.addedAt
							: new Date(item.addedAt)
						: new Date(),
				};
			});
		}

		await watchlist.save();

		res.json({ watchlist });
	} catch (error) {
		if (error instanceof z.ZodError) {
			res.status(400).json({ error: "Invalid input", details: error.errors });
			return;
		}
		throw error;
	}
}

export async function deleteWatchlist(
	req: Request,
	res: Response,
): Promise<void> {
	try {
		if (!req.user) {
			res.status(401).json({ error: "Not authenticated" });
			return;
		}
		const userId = req.user.sub;
		const { id } = req.params;

		if (!isValidWatchlistId(id)) {
			res.status(404).json({ error: "Watchlist not found" });
			return;
		}

		const watchlist = await Watchlist.findById(id);

		if (!watchlist) {
			res.status(404).json({ error: "Watchlist not found" });
			return;
		}

		// Only owner can delete
		if (watchlist.ownerId.toString() !== userId) {
			res.status(403).json({ error: "Only owner can delete watchlist" });
			return;
		}

		// Delete thumbnail from Cloudinary if it exists
		if (watchlist.thumbnailUrl) {
			await deleteThumbnailFromCloudinary(id);
		}

		// Remove watchlist from all affected users' watchlistsOrder
		const watchlistObjectId = new Types.ObjectId(id);

		// Get all users who need to have this watchlist removed from their order
		const affectedUserIds = [
			watchlist.ownerId, // Owner
			...watchlist.collaborators, // Collaborators
			...watchlist.likedBy, // Followers
		];

		// Remove watchlist from each user's watchlistsOrder
		await User.updateMany(
			{ _id: { $in: affectedUserIds } },
			{ $pull: { watchlistsOrder: watchlistObjectId } },
		);

		await Watchlist.findByIdAndDelete(id);

		res.json({ message: "Watchlist deleted successfully" });
	} catch (error) {
		console.log(error);
		return;
	}
}

export async function getPublicWatchlist(
	req: Request,
	res: Response,
): Promise<void> {
	try {
		const { id } = req.params;

		if (!isValidWatchlistId(id)) {
			res.status(404).json({ error: "Watchlist not found" });
			return;
		}

		const watchlist = await Watchlist.findById(id)
			.populate("ownerId", "email username avatarUrl")
			.populate("collaborators", "email username avatarUrl");

		if (!watchlist) {
			res.status(404).json({ error: "Watchlist not found" });
			return;
		}

		if (!watchlist.isPublic) {
			res.status(403).json({ error: "This watchlist is private" });
			return;
		}

		res.json({ watchlist });
	} catch (error) {
		console.log(error);
		return;
	}
}

// Get featured/community public watchlists (for homepage)
export async function getPublicWatchlists(
	req: Request,
	res: Response,
): Promise<void> {
	try {
		const limit = Math.min(parseInt(req.query.limit as string, 10) || 6, 1000); // Max 1000 for community page
		const userId = req.user?.sub; // Optional: user may not be authenticated

		const watchlists = await Watchlist.find({
			isPublic: true,
		})
			.populate("ownerId", "email username avatarUrl")
			.populate("collaborators", "email username avatarUrl")
			.sort({ followersCount: -1, createdAt: -1 }) // Sort by followers (desc), then by date (desc)
			.limit(limit)
			.select(
				"_id name description imageUrl thumbnailUrl items ownerId collaborators createdAt followersCount likedBy",
			);

		// If user is authenticated, add isOwner, isCollaborator, and isSaved flags
		if (userId) {
			const user = await User.findById(userId);
			const savedIds = new Set(
				(user?.savedWatchlists || []).map((id) => id.toString()),
			);

			const watchlistsWithFlags = watchlists.map((w) => {
				const baseObj = w.toObject() as WatchlistObject;
				const ownerId = w.ownerId?._id?.toString() || w.ownerId?.toString();
				const isOwner = ownerId === userId;
				// Check if user is a collaborator
				const isCollaborator = w.collaborators.some((collab) => {
					const collabId = collab?._id?.toString() || collab?.toString();
					return collabId === userId;
				});
				const isSaved = savedIds.has((w._id as Types.ObjectId).toString());

				const watchlistObj: WatchlistWithFlags = {
					...baseObj,
					isOwner,
					isCollaborator,
					isSaved,
				};

				console.log(`📊 [getPublicWatchlists] Watchlist "${w.name}":`, {
					isOwner,
					isCollaborator,
					isSaved,
					collaboratorsCount: w.collaborators.length,
				});

				return watchlistObj;
			});

			console.log(`📊 [getPublicWatchlists] Summary:`, {
				userId,
				totalPublicWatchlists: watchlists.length,
				savedWatchlistsCount: user?.savedWatchlists.length || 0,
			});

			res.json({ watchlists: watchlistsWithFlags });
		} else {
			// User not authenticated: return without flags
			res.json({ watchlists });
		}
	} catch (error) {
		console.log(error);
		return;
	}
}

// Get public watchlists by category
export async function getWatchlistsByCategory(
	req: Request,
	res: Response,
): Promise<void> {
	try {
		const { category } = req.params;

		if (!category || category.trim().length === 0) {
			res.status(400).json({ error: "Category parameter is required" });
			return;
		}

		const watchlists = await Watchlist.find({
			isPublic: true,
			categories: category,
		})
			.populate("ownerId", "email username avatarUrl")
			.populate("collaborators", "email username avatarUrl")
			.sort({ createdAt: -1 })
			.select(
				"_id name description imageUrl thumbnailUrl items categories ownerId collaborators createdAt",
			);

		res.json({ watchlists });
	} catch (error) {
		console.log(error);
		return;
	}
}

// Get count of public watchlists by category
export async function getWatchlistCountByCategory(
	req: Request,
	res: Response,
): Promise<void> {
	try {
		const { category } = req.params;

		if (!category || category.trim().length === 0) {
			res.status(400).json({ error: "Category parameter is required" });
			return;
		}

		const count = await Watchlist.countDocuments({
			isPublic: true,
			categories: category,
		});

		res.json({ category, count });
	} catch (error) {
		console.log(error);
		return;
	}
}

// Get a single watchlist by ID (with permission check)
export async function getWatchlistById(
	req: Request,
	res: Response,
): Promise<void> {
	try {
		if (!req.user) {
			res.status(401).json({ error: "Not authenticated" });
			return;
		}
		const userId = req.user.sub;
		const { id } = req.params;

		if (!isValidWatchlistId(id)) {
			res.status(404).json({ error: "Watchlist not found" });
			return;
		}

		const watchlist = await Watchlist.findById(id)
			.populate("ownerId", "email username avatarUrl")
			.populate("collaborators", "email username avatarUrl");

		if (!watchlist) {
			res.status(404).json({ error: "Watchlist not found" });
			return;
		}

		// Check if user has access (owner, collaborator, or public)
		const isOwner = watchlist.ownerId._id.toString() === userId;
		const isCollaborator = watchlist.collaborators.some(
			(c) => c._id.toString() === userId,
		);
		const isPublic = watchlist.isPublic;

		if (!isOwner && !isCollaborator && !isPublic) {
			res.status(403).json({ error: "Access denied" });
			return;
		}

		// Check if watchlist is saved by the user
		const user = await User.findById(userId);
		const isSaved =
			user?.savedWatchlists?.some(
				(savedId) => (savedId as Types.ObjectId).toString() === id,
			) || false;

		res.json({ watchlist, isSaved, isOwner, isCollaborator });
	} catch (error) {
		console.log(error);
		return;
	}
}

// Add an item to a watchlist (enriched with TMDB data)
export async function addItemToWatchlist(
	req: Request,
	res: Response,
): Promise<void> {
	try {
		if (!req.user) {
			res.status(401).json({ error: "Not authenticated" });
			return;
		}
		const userId = req.user.sub;
		const { id } = req.params;
		const data = addItemSchema.parse(req.body);

		if (!isValidWatchlistId(id)) {
			res.status(404).json({ error: "Watchlist not found" });
			return;
		}

		const watchlist = await Watchlist.findById(id);

		if (!watchlist) {
			res.status(404).json({ error: "Watchlist not found" });
			return;
		}

		// Check if user is owner or collaborator
		const isOwner = watchlist.ownerId.toString() === userId;
		const isCollaborator = watchlist.collaborators.some(
			(c) => c.toString() === userId,
		);

		if (!isOwner && !isCollaborator) {
			res.status(403).json({ error: "Forbidden" });
			return;
		}

		// Check if item already exists
		const itemExists = watchlist.items.some(
			(item) => item.tmdbId === data.tmdbId,
		);
		if (itemExists) {
			res.status(400).json({ error: "Item already exists in watchlist" });
			return;
		}

		// Enrich media data with TMDB
		const enrichedData = await enrichMediaData(
			data.tmdbId,
			data.type,
			data.language,
			data.region,
		);

		if (!enrichedData) {
			res
				.status(500)
				.json({ error: "Failed to fetch media details from TMDB" });
			return;
		}

		// Add item to watchlist
		watchlist.items.push({
			tmdbId: enrichedData.tmdbId,
			title: enrichedData.title,
			posterUrl: enrichedData.posterUrl,
			type: enrichedData.type,
			platformList: enrichedData.platformList,
			runtime: enrichedData.runtime,
			numberOfSeasons: enrichedData.numberOfSeasons,
			numberOfEpisodes: enrichedData.numberOfEpisodes,
			addedAt: new Date(),
		});

		await watchlist.save();

		// Regenerate thumbnail in background (don't wait for it)
		const posterUrls = watchlist.items
			.slice(0, 4)
			.filter((item) => item.posterUrl)
			.map((item) => item.posterUrl);

		regenerateThumbnail(id, posterUrls)
			.then((thumbnailUrl) => {
				if (thumbnailUrl) {
					watchlist.thumbnailUrl = thumbnailUrl;
					watchlist
						.save()
						.catch((err) =>
							console.error("Failed to save thumbnail URL:", err),
						);
				}
			})
			.catch((err) => console.error("Failed to regenerate thumbnail:", err));

		res.json({ watchlist });
	} catch (error) {
		if (error instanceof z.ZodError) {
			res.status(400).json({ error: "Invalid input", details: error.errors });
			return;
		}
		throw error;
	}
}

// Remove an item from a watchlist
export async function removeItemFromWatchlist(
	req: Request,
	res: Response,
): Promise<void> {
	try {
		if (!req.user) {
			res.status(401).json({ error: "Not authenticated" });
			return;
		}
		const userId = req.user.sub;
		const { id, tmdbId } = req.params;

		const watchlist = await Watchlist.findById(id);

		if (!watchlist) {
			res.status(404).json({ error: "Watchlist not found" });
			return;
		}

		// Check if user is owner or collaborator
		const isOwner = watchlist.ownerId.toString() === userId;
		const isCollaborator = watchlist.collaborators.some(
			(c) => c.toString() === userId,
		);

		if (!isOwner && !isCollaborator) {
			res.status(403).json({ error: "Forbidden" });
			return;
		}

		// Remove item
		const initialLength = watchlist.items.length;
		watchlist.items = watchlist.items.filter((item) => item.tmdbId !== tmdbId);

		if (watchlist.items.length === initialLength) {
			res.status(404).json({ error: "Item not found in watchlist" });
			return;
		}

		await watchlist.save();

		// Regenerate thumbnail in background (don't wait for it)
		const posterUrls = watchlist.items
			.slice(0, 4)
			.filter((item) => item.posterUrl)
			.map((item) => item.posterUrl);

		regenerateThumbnail(id, posterUrls)
			.then((thumbnailUrl) => {
				if (thumbnailUrl) {
					watchlist.thumbnailUrl = thumbnailUrl;
					watchlist
						.save()
						.catch((err) =>
							console.error("Failed to save thumbnail URL:", err),
						);
				} else if (posterUrls.length === 0) {
					// Clear thumbnail if no items left
					watchlist.thumbnailUrl = undefined;
					watchlist
						.save()
						.catch((err) =>
							console.error("Failed to clear thumbnail URL:", err),
						);
				}
			})
			.catch((err) => console.error("Failed to regenerate thumbnail:", err));

		res.json({ watchlist });
	} catch (error) {
		console.log(error);
		return;
	}
}

// Move an item to first or last position
export async function moveItemPosition(
	req: Request,
	res: Response,
): Promise<void> {
	try {
		if (!req.user) {
			res.status(401).json({ error: "Not authenticated" });
			return;
		}
		const userId = req.user.sub;
		const { id, tmdbId } = req.params;
		const { position } = moveItemSchema.parse(req.body);

		const watchlist = await Watchlist.findById(id);

		if (!watchlist) {
			res.status(404).json({ error: "Watchlist not found" });
			return;
		}

		// Check if user is owner or collaborator
		const isOwner = watchlist.ownerId.toString() === userId;
		const isCollaborator = watchlist.collaborators.some(
			(c) => c.toString() === userId,
		);

		if (!isOwner && !isCollaborator) {
			res.status(403).json({ error: "Forbidden" });
			return;
		}

		// Find the item
		const itemIndex = watchlist.items.findIndex(
			(item) => item.tmdbId === tmdbId,
		);
		if (itemIndex === -1) {
			res.status(404).json({ error: "Item not found in watchlist" });
			return;
		}

		// Remove item from current position
		const [item] = watchlist.items.splice(itemIndex, 1);

		// Insert at new position
		if (position === "first") {
			watchlist.items.unshift(item);
		} else {
			watchlist.items.push(item);
		}

		await watchlist.save();

		res.json({ watchlist });
	} catch (error) {
		if (error instanceof z.ZodError) {
			res.status(400).json({ error: "Invalid input", details: error.errors });
			return;
		}
		throw error;
	}
}

// Reorder items in watchlist (for drag and drop)
export async function reorderItems(req: Request, res: Response): Promise<void> {
	try {
		if (!req.user) {
			res.status(401).json({ error: "Not authenticated" });
			return;
		}
		const userId = req.user.sub;
		const { id } = req.params;
		const { orderedTmdbIds } = reorderItemsSchema.parse(req.body);

		if (!isValidWatchlistId(id)) {
			res.status(404).json({ error: "Watchlist not found" });
			return;
		}

		const watchlist = await Watchlist.findById(id);

		if (!watchlist) {
			res.status(404).json({ error: "Watchlist not found" });
			return;
		}

		// Check if user is owner or collaborator
		const isOwner = watchlist.ownerId.toString() === userId;
		const isCollaborator = watchlist.collaborators.some(
			(c) => c.toString() === userId,
		);

		if (!isOwner && !isCollaborator) {
			res.status(403).json({ error: "Forbidden" });
			return;
		}

		// Create a map of items by tmdbId for quick lookup
		const itemsMap = new Map(
			watchlist.items.map((item) => [item.tmdbId, item]),
		);

		// Reorder items based on orderedTmdbIds and clean up data
		const reorderedItems = orderedTmdbIds
			.map((tmdbId) => {
				const item = itemsMap.get(tmdbId);
				if (!item) return undefined;

				// Clean up platformList to ensure it's in the correct format
				const cleanedPlatformList = (item.platformList || [])
					.filter((p: unknown) => p !== null && p !== undefined)
					.map((p: unknown) => {
						if (typeof p === "string") {
							return p.trim() ? { name: p, logoPath: "" } : null;
						}
						if (p && typeof p === "object" && "name" in p) {
							const platform = p as { name: unknown; logoPath?: unknown };
							if (typeof platform.name === "string" && platform.name.trim()) {
								return {
									name: platform.name,
									logoPath:
										typeof platform.logoPath === "string"
											? platform.logoPath
											: "",
								};
							}
						}
						return null;
					})
					.filter((p: unknown): p is Platform => p !== null);

				return {
					tmdbId: item.tmdbId,
					title: item.title,
					posterUrl: item.posterUrl,
					type: item.type,
					runtime: item.runtime,
					numberOfSeasons: item.numberOfSeasons,
					numberOfEpisodes: item.numberOfEpisodes,
					addedAt: item.addedAt,
					platformList:
						cleanedPlatformList.length > 0
							? cleanedPlatformList
							: [{ name: "Inconnu", logoPath: "" }],
				};
			})
			.filter((item) => item !== undefined);

		// Ensure all items are present
		if (reorderedItems.length !== watchlist.items.length) {
			res
				.status(400)
				.json({ error: "Invalid item order: missing or extra items" });
			return;
		}

		watchlist.items = reorderedItems;
		await watchlist.save();

		// Regenerate thumbnail in background (don't wait for it)
		const posterUrls = watchlist.items
			.slice(0, 4)
			.filter((item) => item.posterUrl)
			.map((item) => item.posterUrl);

		regenerateThumbnail(id, posterUrls)
			.then((thumbnailUrl) => {
				if (thumbnailUrl) {
					watchlist.thumbnailUrl = thumbnailUrl;
					watchlist
						.save()
						.catch((err) =>
							console.error("Failed to save thumbnail URL:", err),
						);
				}
			})
			.catch((err) => console.error("Failed to regenerate thumbnail:", err));

		res.json({ watchlist });
	} catch (error) {
		if (error instanceof z.ZodError) {
			res.status(400).json({ error: "Invalid input", details: error.errors });
			return;
		}
		throw error;
	}
}

// Upload custom cover image to Cloudinary
export async function uploadCover(req: Request, res: Response): Promise<void> {
	try {
		if (!req.user) {
			res.status(401).json({ error: "Not authenticated" });
			return;
		}
		const userId = req.user.sub;
		const { id } = req.params;

		console.log("📸 [UPLOAD] Starting image upload for watchlist:", id);

		if (!isValidWatchlistId(id)) {
			res.status(404).json({ error: "Watchlist not found" });
			return;
		}

		const watchlist = await Watchlist.findById(id);

		if (!watchlist) {
			res.status(404).json({ error: "Watchlist not found" });
			return;
		}

		// Only owner can upload cover
		if (watchlist.ownerId.toString() !== userId) {
			res.status(403).json({ error: "Only owner can upload cover" });
			return;
		}

		// Check if file is provided
		if (!req.body.imageData) {
			console.error("❌ [UPLOAD] No image data provided");
			res.status(400).json({ error: "No image data provided" });
			return;
		}

		console.log(
			"📊 [UPLOAD] Image data received, length:",
			req.body.imageData.length,
		);
		console.log(
			"📊 [UPLOAD] Image data prefix:",
			req.body.imageData.substring(0, 50),
		);

		// Validate image data format (must be base64 data URL)
		if (!req.body.imageData.startsWith("data:image/")) {
			console.error(
				"❌ [UPLOAD] Invalid image format:",
				req.body.imageData.substring(0, 100),
			);
			res
				.status(400)
				.json({ error: "Invalid image format. Must be a base64 data URL." });
			return;
		}

		// Extract image type
		const imageType = req.body.imageData.match(/data:image\/([^;]+);/)?.[1];
		console.log("📊 [UPLOAD] Image type:", imageType);

		// Check Cloudinary configuration
		const cloudinaryConfig = cloudinary.config();
		console.log("☁️  [CLOUDINARY] Config check:", {
			cloud_name: cloudinaryConfig.cloud_name,
			api_key: cloudinaryConfig.api_key ? "✅ Set" : "❌ Missing",
			api_secret: cloudinaryConfig.api_secret ? "✅ Set" : "❌ Missing",
		});

		if (
			!cloudinaryConfig.cloud_name ||
			!cloudinaryConfig.api_key ||
			!cloudinaryConfig.api_secret
		) {
			console.error("❌ [CLOUDINARY] Configuration incomplete!");
			res.status(500).json({
				error: "Cloudinary not properly configured",
				details: "Missing cloud_name, api_key, or api_secret",
			});
			return;
		}

		try {
			// Delete old image from Cloudinary if exists
			if (watchlist.imageUrl) {
				const oldPublicId = extractPublicIdFromUrl(watchlist.imageUrl);
				if (oldPublicId) {
					console.log("🗑️  [CLOUDINARY] Deleting old image:", oldPublicId);
					try {
						await cloudinary.uploader.destroy(oldPublicId);
						console.log("✅ [CLOUDINARY] Old image deleted successfully");
					} catch (error) {
						// Log but don't fail - old image might already be deleted manually
						console.warn("⚠️  [CLOUDINARY] Failed to delete old image:", error);
					}
				}
			}

			console.log("☁️  [CLOUDINARY] Uploading new image to Cloudinary...");

			// Upload to Cloudinary
			const result = await cloudinary.uploader.upload(req.body.imageData, {
				folder: "watchlists",
				width: 500,
				height: 500,
				crop: "fill",
				resource_type: "image",
			});

			console.log("✅ [CLOUDINARY] Upload successful:", result.secure_url);
			console.log("📊 [CLOUDINARY] Upload result:", {
				public_id: result.public_id,
				format: result.format,
				width: result.width,
				height: result.height,
				bytes: result.bytes,
			});

			// Update watchlist with new image URL
			watchlist.imageUrl = result.secure_url;
			await watchlist.save();

			res.json({
				watchlist,
				imageUrl: result.secure_url,
			});
		} catch (error) {
			console.error("❌ [CLOUDINARY] Upload error:", error);
			res.status(500).json({
				msg: "Failed to upload image to Cloudinar",
				error: error,
			});
			return;
		}
	} catch (error) {
		console.error("❌ [UPLOAD] Error uploading cover:", error);
		res.status(500).json({
			msg: "Failed to upload cover image",
			error: error || "Unknown error",
		});
	}
}

// Delete cover image from Cloudinary
export async function deleteCover(req: Request, res: Response): Promise<void> {
	try {
		if (!req.user) {
			res.status(401).json({ error: "Not authenticated" });
			return;
		}
		const userId = req.user.sub;
		const { id } = req.params;

		console.log("🗑️  [DELETE] Starting image deletion for watchlist:", id);

		if (!isValidWatchlistId(id)) {
			res.status(404).json({ error: "Watchlist not found" });
			return;
		}

		const watchlist = await Watchlist.findById(id);

		if (!watchlist) {
			res.status(404).json({ error: "Watchlist not found" });
			return;
		}

		// Only owner can delete cover
		if (watchlist.ownerId.toString() !== userId) {
			res.status(403).json({ error: "Only owner can delete cover" });
			return;
		}

		// Check if watchlist has an image
		if (!watchlist.imageUrl) {
			res.status(404).json({ error: "No cover image to delete" });
			return;
		}

		// Extract public_id from URL
		const publicId = extractPublicIdFromUrl(watchlist.imageUrl);

		if (!publicId) {
			console.error(
				"❌ [DELETE] Failed to extract public_id from URL:",
				watchlist.imageUrl,
			);
			res.status(400).json({ error: "Invalid image URL format" });
			return;
		}

		try {
			console.log("☁️  [CLOUDINARY] Deleting image:", publicId);

			// Delete from Cloudinary
			const result = await cloudinary.uploader.destroy(publicId);

			console.log("📊 [CLOUDINARY] Delete result:", result);

			// Clear image URL from database
			watchlist.imageUrl = undefined;
			await watchlist.save();

			console.log("✅ [DELETE] Image deleted successfully");

			res.json({
				message: "Cover image deleted successfully",
				watchlist,
			});
		} catch (error) {
			console.error("❌ [CLOUDINARY] Delete error:", error);
			res.status(500).json({
				msg: "Failed to delete image from Cloudinary",
				error: error || "Unknown Cloudinary error",
			});
			return;
		}
	} catch (error) {
		console.error("❌ [DELETE] Error deleting cover:", error);
		res.status(500).json({
			msg: "Failed to delete cover image",
			error: error || "Unknown error",
		});
	}
}

// Reorder user's watchlists (for drag and drop)
export async function reorderWatchlists(
	req: Request,
	res: Response,
): Promise<void> {
	try {
		if (!req.user) {
			res.status(401).json({ error: "Not authenticated" });
			return;
		}
		const userId = req.user.sub;
		const { orderedWatchlistIds } = reorderWatchlistsSchema.parse(req.body);

		// Get user
		const user = await User.findById(userId);
		if (!user) {
			res.status(404).json({ error: "User not found" });
			return;
		}

		// Update user's watchlistsOrder with the new order
		user.watchlistsOrder = orderedWatchlistIds.map(
			(id) => new Types.ObjectId(id),
		);
		await user.save();

		console.log("✅ [REORDER] Watchlists reordered successfully");

		res.json({ message: "Watchlists reordered successfully" });
	} catch (error) {
		if (error instanceof z.ZodError) {
			res.status(400).json({ error: "Invalid input", details: error.errors });
			return;
		}
		throw error;
	}
}

// Search movies and TV shows via TMDB
export async function searchTMDB(req: Request, res: Response): Promise<void> {
	try {
		const query = req.query.query as string;
		const language = (req.query.language as string) || "fr-FR";
		// const region = (req.query.region as string) || "FR";
		const page = parseInt(req.query.page as string, 10) || 1;

		if (!query || query.trim().length === 0) {
			res.status(400).json({ error: "Query parameter is required" });
			return;
		}

		const results = await searchMedia(query, language, page);

		// Sauvegarder en cache si l'URL est fournie par le middleware
		if (res.locals.cacheKey) {
			await saveToCache(
				res.locals.cacheKey,
				results,
				res.locals.cacheDurationDays,
			);
		}

		res.json(results);
	} catch (error) {
		console.error("Error searching TMDB:", error);
		res.status(500).json({ error: "Failed to search media" });
	}
}

// Get full details for a specific media item (movie or TV show)
export async function getItemDetails(
	req: Request,
	res: Response,
): Promise<void> {
	try {
		const { tmdbId, type } = req.params;
		const language = (req.query.language as string) || "fr-FR";

		if (!tmdbId || !type) {
			res.status(400).json({ error: "tmdbId and type are required" });
			return;
		}

		if (type !== "movie" && type !== "tv") {
			res.status(400).json({ error: 'type must be either "movie" or "tv"' });
			return;
		}

		// console.log(`🔍 [ITEM DETAILS] Fetching details for ${type} ${tmdbId}`);

		const details = await getFullMediaDetails(tmdbId, type, language);

		if (!details) {
			res.status(404).json({ error: "Media details not found" });
			return;
		}

		const responseData = { details };

		// Sauvegarder en cache si l'URL est fournie par le middleware
		if (res.locals.cacheKey) {
			await saveToCache(
				res.locals.cacheKey,
				responseData,
				res.locals.cacheDurationDays,
			);
		}

		res.json(responseData);
	} catch (error) {
		console.error("Error fetching item details:", error);
		res.status(500).json({ error: "Failed to fetch media details" });
	}
}

// Save a public watchlist to user's library
export async function saveWatchlist(
	req: Request,
	res: Response,
): Promise<Response> {
	try {
		if (!req.user) {
			return res.status(401).json({ error: "Not authenticated" });
		}
		const userId = req.user.sub;
		const { id } = req.params;

		if (!isValidWatchlistId(id)) {
			return res.status(404).json({ error: "Watchlist not found" });
		}

		const watchlist = await Watchlist.findById(id);

		if (!watchlist) {
			return res.status(404).json({ error: "Watchlist not found" });
		}

		// Can only save public watchlists
		if (!watchlist.isPublic) {
			return res.status(403).json({ error: "Can only save public watchlists" });
		}

		// Cannot save your own watchlist
		if (watchlist.ownerId.toString() === userId) {
			return res.status(400).json({ error: "Cannot save your own watchlist" });
		}

		// Add to user's savedWatchlists
		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		// Check if already saved
		if (user.savedWatchlists.some((w) => w.toString() === id)) {
			return res.status(400).json({ error: "Watchlist already saved" });
		}

		user.savedWatchlists.push(new Types.ObjectId(id));

		// Add to watchlistsOrder
		if (!user.watchlistsOrder.some((w) => w.toString() === id)) {
			user.watchlistsOrder.push(new Types.ObjectId(id));
		}

		await user.save();

		// Add user to likedBy array (avoid duplicates)
		const userObjectId = new Types.ObjectId(userId);
		if (!watchlist.likedBy.some((id) => id.toString() === userId)) {
			watchlist.likedBy.push(userObjectId);
		}

		// Increment followersCount
		watchlist.followersCount = (watchlist.followersCount || 0) + 1;
		await watchlist.save();

		return res.json({ message: "Watchlist saved successfully" });
	} catch (error) {
		return res.status(500).json({ msg: "Internal server error", error: error });
	}
}

// Unsave a watchlist from user's library
export async function unsaveWatchlist(
	req: Request,
	res: Response,
): Promise<Response> {
	try {
		if (!req.user) {
			return res.status(401).json({ error: "Not authenticated" });
		}
		const userId = req.user.sub;
		const { id } = req.params;

		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		// Remove from savedWatchlists
		const initialLength = user.savedWatchlists.length;
		user.savedWatchlists = user.savedWatchlists.filter(
			(w) => w.toString() !== id,
		);

		if (user.savedWatchlists.length === initialLength) {
			return res.status(404).json({ error: "Watchlist not in saved list" });
		}

		// Remove from watchlistsOrder
		user.watchlistsOrder = user.watchlistsOrder.filter(
			(w) => w.toString() !== id,
		);

		await user.save();

		// Remove user from likedBy array and decrement followersCount
		if (isValidWatchlistId(id)) {
			const watchlist = await Watchlist.findById(id);
			if (watchlist) {
				// Remove from likedBy array
				watchlist.likedBy = watchlist.likedBy.filter(
					(likedUserId) => likedUserId.toString() !== userId,
				);
				watchlist.followersCount = Math.max(
					0,
					(watchlist.followersCount || 0) - 1,
				);
				await watchlist.save();
			}
		}

		return res.json({ message: "Watchlist removed from library" });
	} catch (error) {
		return res.status(500).json(error);
	}
}

// Duplicate a public watchlist to user's personal space
export async function duplicateWatchlist(
	req: Request,
	res: Response,
): Promise<void> {
	try {
		if (!req.user) {
			res.status(401).json({ error: "Not authenticated" });
			return;
		}
		const userId = req.user.sub;
		const { id } = req.params;

		if (!isValidWatchlistId(id)) {
			res.status(404).json({ error: "Watchlist not found" });
			return;
		}

		const originalWatchlist = await Watchlist.findById(id);

		if (!originalWatchlist) {
			res.status(404).json({ error: "Watchlist not found" });
			return;
		}

		// Can only duplicate public watchlists or ones you have access to
		const isOwner = originalWatchlist.ownerId.toString() === userId;
		const isCollaborator = originalWatchlist.collaborators.some(
			(c) => c.toString() === userId,
		);

		if (!originalWatchlist.isPublic && !isOwner && !isCollaborator) {
			res.status(403).json({ error: "Access denied" });
			return;
		}

		// Cannot duplicate your own watchlist if you're the owner
		if (isOwner) {
			res.status(400).json({ error: "Cannot duplicate your own watchlist" });
			return;
		}

		// Create a copy with temporary thumbnail from original (for instant UX)
		const duplicatedWatchlist = await Watchlist.create({
			ownerId: userId,
			name: `${originalWatchlist.name} (copy)`,
			description: originalWatchlist.description,
			isPublic: false, // Duplicates are private by default
			categories: originalWatchlist.categories,
			items: originalWatchlist.items,
			thumbnailUrl: originalWatchlist.thumbnailUrl, // Temporary - use original's thumbnail for instant display
			// Don't copy imageUrl - custom images should not be duplicated
		});

		// Regenerate fresh thumbnail asynchronously (will replace the temporary one)
		const posterUrls = duplicatedWatchlist.items
			.slice(0, 4)
			.map((item) => item.posterUrl)
			.filter((url) => url);

		if (posterUrls.length > 0) {
			regenerateThumbnail(String(duplicatedWatchlist._id), posterUrls)
				.then((thumbnailUrl) => {
					if (thumbnailUrl) {
						duplicatedWatchlist.thumbnailUrl = thumbnailUrl; // Replace with new dedicated thumbnail
						duplicatedWatchlist
							.save()
							.catch((err) =>
								console.error("Failed to save thumbnail URL:", err),
							);
					}
				})
				.catch((err) => console.error("Failed to regenerate thumbnail:", err));
		}

		res.status(201).json({ watchlist: duplicatedWatchlist });
	} catch (error) {
		console.log(error);
		return;
	}
}

/**
 * POST /api/watchlists/:id/generate-thumbnail
 * Generate and upload a 2x2 thumbnail grid for a watchlist
 */
export async function generateWatchlistThumbnail(
	req: Request,
	res: Response,
): Promise<void> {
	try {
		const { id } = req.params;
		const userId = req.user?.sub;

		if (!userId) {
			res.status(401).json({ error: "Unauthorized" });
			return;
		}

		if (!isValidWatchlistId(id)) {
			res.status(400).json({ error: "Invalid watchlist ID" });
			return;
		}

		const watchlist = await Watchlist.findById(id);

		if (!watchlist) {
			res.status(404).json({ error: "Watchlist not found" });
			return;
		}

		// Check if user is owner or collaborator
		const isOwner = watchlist.ownerId.toString() === userId;
		const isCollaborator = watchlist.collaborators.some(
			(collaboratorId) => collaboratorId.toString() === userId,
		);

		if (!isOwner && !isCollaborator) {
			res.status(403).json({ error: "Forbidden" });
			return;
		}

		// Get first 4 posters
		const posterUrls = watchlist.items
			.slice(0, 4)
			.filter((item) => item.posterUrl)
			.map((item) => item.posterUrl);

		if (posterUrls.length === 0) {
			res
				.status(400)
				.json({ error: "No posters available to generate thumbnail" });
			return;
		}

		// Generate thumbnail
		const thumbnailBuffer = await generateThumbnail(posterUrls);

		// Upload to Cloudinary
		const thumbnailUrl = await uploadThumbnailToCloudinary(thumbnailBuffer, id);

		// Update watchlist
		watchlist.thumbnailUrl = thumbnailUrl;
		await watchlist.save();

		res.json({ thumbnailUrl });
	} catch (error) {
		console.error("Error generating thumbnail:", error);
		res.status(500).json({ error: "Failed to generate thumbnail" });
	}
}

/**
 * Add a collaborator to a watchlist
 */
export async function addCollaborator(
	req: Request,
	res: Response,
): Promise<void> {
	try {
		if (!req.user) {
			res.status(401).json({ error: "Not authenticated" });
			return;
		}
		const userId = req.user.sub;
		const { id } = req.params;

		// Validate request body
		const validation = addCollaboratorSchema.safeParse(req.body);
		if (!validation.success) {
			res
				.status(400)
				.json({ error: "Invalid request data", details: validation.error });
			return;
		}

		const { username } = validation.data;

		if (!isValidWatchlistId(id)) {
			res.status(400).json({ error: "Invalid watchlist ID" });
			return;
		}

		// Find watchlist
		const watchlist = await Watchlist.findById(id);
		if (!watchlist) {
			res.status(404).json({ error: "Watchlist not found" });
			return;
		}

		// Check if user is owner
		if (watchlist.ownerId.toString() !== userId) {
			res.status(403).json({ error: "Only the owner can add collaborators" });
			return;
		}

		// Find collaborator by username
		const collaborator = await User.findOne({ username });
		if (!collaborator) {
			res.status(404).json({ error: "User not found" });
			return;
		}

		const collaboratorId = collaborator._id;

		// Check if user is trying to add themselves
		if (collaboratorId.toString() === userId) {
			res.status(400).json({ error: "Cannot add yourself as a collaborator" });
			return;
		}

		// Check if already a collaborator
		if (
			watchlist.collaborators.some(
				(id) => id.toString() === collaboratorId.toString(),
			)
		) {
			res.status(400).json({ error: "User is already a collaborator" });
			return;
		}

		// Track if we need to save the collaborator
		let needsCollaboratorSave = false;

		// Remove like/save if user was following this watchlist
		// (becoming a collaborator makes following redundant)
		const wasFollowing = watchlist.likedBy.some(
			(id) => id.toString() === collaboratorId.toString(),
		);
		if (wasFollowing) {
			watchlist.likedBy = watchlist.likedBy.filter(
				(id) => id.toString() !== collaboratorId.toString(),
			);

			// Remove from user's saved watchlists
			if (
				collaborator.savedWatchlists.some(
					(id) =>
						id.toString() === (watchlist._id as Types.ObjectId).toString(),
				)
			) {
				collaborator.savedWatchlists = collaborator.savedWatchlists.filter(
					(id) =>
						id.toString() !== (watchlist._id as Types.ObjectId).toString(),
				);
				needsCollaboratorSave = true;
			}
		}

		// Add collaborator to watchlist
		watchlist.collaborators.push(collaboratorId);
		await watchlist.save();

		// Add watchlist to user's collaborativeWatchlists
		if (
			!collaborator.collaborativeWatchlists.includes(
				watchlist._id as Types.ObjectId,
			)
		) {
			collaborator.collaborativeWatchlists.push(
				watchlist._id as Types.ObjectId,
			);
			needsCollaboratorSave = true;
		}

		// Add to watchlistsOrder if not already present
		const watchlistIdStr = (watchlist._id as Types.ObjectId).toString();
		if (
			!collaborator.watchlistsOrder.some(
				(id) => id.toString() === watchlistIdStr,
			)
		) {
			collaborator.watchlistsOrder.push(watchlist._id as Types.ObjectId);
			needsCollaboratorSave = true;
		}

		// Save collaborator if any changes were made
		if (needsCollaboratorSave) {
			await collaborator.save();
		}

		res.json({
			message: "Collaborator added successfully",
			collaborator: {
				_id: collaborator._id,
				username: collaborator.username,
				email: collaborator.email,
			},
		});
	} catch (error) {
		console.error("Error adding collaborator:", error);
		res.status(500).json({ error: "Failed to add collaborator" });
	}
}

/**
 * Remove a collaborator from a watchlist
 */
export async function removeCollaborator(
	req: Request,
	res: Response,
): Promise<void> {
	try {
		if (!req.user) {
			res.status(401).json({ error: "Not authenticated" });
			return;
		}
		const userId = req.user.sub;
		const { id, collaboratorId } = req.params;

		if (!isValidWatchlistId(id)) {
			res.status(400).json({ error: "Invalid watchlist ID" });
			return;
		}

		// Find watchlist
		const watchlist = await Watchlist.findById(id);
		if (!watchlist) {
			res.status(404).json({ error: "Watchlist not found" });
			return;
		}

		// Check if user is owner
		if (watchlist.ownerId.toString() !== userId) {
			res
				.status(403)
				.json({ error: "Only the owner can remove collaborators" });
			return;
		}

		// Check if collaboratorId is valid
		if (!Types.ObjectId.isValid(collaboratorId)) {
			res.status(400).json({ error: "Invalid collaborator ID" });
			return;
		}

		// Check if user is actually a collaborator
		const collaboratorIndex = watchlist.collaborators.findIndex(
			(id) => id.toString() === collaboratorId,
		);

		if (collaboratorIndex === -1) {
			res.status(404).json({ error: "Collaborator not found" });
			return;
		}

		// Remove collaborator from watchlist
		watchlist.collaborators.splice(collaboratorIndex, 1);
		await watchlist.save();

		// Remove watchlist from user's collaborativeWatchlists
		const collaborator = await User.findById(collaboratorId);
		if (collaborator) {
			collaborator.collaborativeWatchlists =
				collaborator.collaborativeWatchlists.filter(
					(wId) => wId.toString() !== id,
				);

			// Remove from watchlistsOrder
			collaborator.watchlistsOrder = collaborator.watchlistsOrder.filter(
				(wId) => wId.toString() !== id,
			);

			await collaborator.save();
		}

		res.json({ message: "Collaborator removed successfully" });
	} catch (error) {
		console.error("Error removing collaborator:", error);
		res.status(500).json({ error: "Failed to remove collaborator" });
	}
}

/**
 * Leave a watchlist as a collaborator
 */
export async function leaveWatchlist(
	req: Request,
	res: Response,
): Promise<void> {
	try {
		if (!req.user) {
			res.status(401).json({ error: "Not authenticated" });
			return;
		}
		const userId = req.user.sub;
		const { id } = req.params;

		if (!isValidWatchlistId(id)) {
			res.status(400).json({ error: "Invalid watchlist ID" });
			return;
		}

		// Find watchlist
		const watchlist = await Watchlist.findById(id);
		if (!watchlist) {
			res.status(404).json({ error: "Watchlist not found" });
			return;
		}

		// Check if user is a collaborator
		const collaboratorIndex = watchlist.collaborators.findIndex(
			(id) => id.toString() === userId,
		);

		if (collaboratorIndex === -1) {
			res
				.status(403)
				.json({ error: "You are not a collaborator of this watchlist" });
			return;
		}

		// Remove user from watchlist collaborators
		watchlist.collaborators.splice(collaboratorIndex, 1);
		await watchlist.save();

		// Remove watchlist from user's collaborativeWatchlists
		const user = await User.findById(userId);
		if (user) {
			user.collaborativeWatchlists = user.collaborativeWatchlists.filter(
				(wId) => wId.toString() !== id,
			);

			// Remove from watchlistsOrder
			user.watchlistsOrder = user.watchlistsOrder.filter(
				(wId) => wId.toString() !== id,
			);

			await user.save();
		}

		res.json({ message: "Left watchlist successfully" });
	} catch (error) {
		console.error("Error leaving watchlist:", error);
		res.status(500).json({ error: "Failed to leave watchlist" });
	}
}
