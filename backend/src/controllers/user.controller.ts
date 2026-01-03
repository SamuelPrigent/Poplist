import { v2 as cloudinary } from "cloudinary";
import type { Request, Response } from "express";
import { User } from "../models/User.model.js";

// Helper to extract public_id from Cloudinary URL
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

// Upload user avatar to Cloudinary
export async function uploadAvatar(req: Request, res: Response): Promise<void> {
	try {
		if (!req.user) {
			res.status(401).json({ error: "Not authenticated" });
			return;
		}
		const userId = req.user.sub;
		const user = await User.findById(userId);
		if (!user) {
			res.status(404).json({ error: "User not found" });
			return;
		}
		// Check if file is provided
		if (!req.body.imageData) {
			console.error("❌ [UPLOAD] No image data provided");
			res.status(400).json({ error: "No image data provided" });
			return;
		}
		// console.log(
		// 	"📊 [UPLOAD] Image data received, length:",
		// 	req.body.imageData.length,
		// );

		// Validate image data format (must be base64 data URL)
		if (!req.body.imageData.startsWith("data:image/")) {
			console.error("❌ [UPLOAD] Invalid image format");
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
			// Delete old avatar from Cloudinary if exists
			if (user.avatarUrl) {
				const oldPublicId = extractPublicIdFromUrl(user.avatarUrl);
				if (oldPublicId) {
					// console.log("🗑️  [CLOUDINARY] Deleting old avatar:", oldPublicId);
					try {
						await cloudinary.uploader.destroy(oldPublicId);
						// console.log("✅ [CLOUDINARY] Old avatar deleted successfully");
					} catch (error) {
						console.warn(
							"⚠️  [CLOUDINARY] Failed to delete old avatar:",
							error
						);
					}
				}
			}

			// console.log("☁️  [CLOUDINARY] Uploading new avatar to Cloudinary...");

			// Upload to Cloudinary
			const result = await cloudinary.uploader.upload(req.body.imageData, {
				folder: "avatars",
				width: 200,
				height: 200,
				crop: "fill",
				gravity: "face",
				resource_type: "image",
			});

			// console.log("✅ [CLOUDINARY] Upload successful:", result.secure_url);

			// Update user with new avatar URL
			user.avatarUrl = result.secure_url;
			await user.save();

			res.json({
				user,
				avatarUrl: result.secure_url,
			});
		} catch (error) {
			console.error("❌ [CLOUDINARY] Upload error:", error);
			res.status(500).json({
				msg: "Failed to upload avatar to Cloudinary",
				error: error || "Unknown error",
			});
			return;
		}
	} catch (error) {
		console.error("❌ [UPLOAD] Error uploading avatar:", error);
		res.status(500).json({
			msg: "Failed to upload avatar",
			error: error || "Unknown error",
		});
	}
}

// Delete user avatar from Cloudinary
export async function deleteAvatar(req: Request, res: Response): Promise<void> {
	try {
		if (!req.user) {
			res.status(401).json({ error: "Not authenticated" });
			return;
		}
		const userId = req.user.sub;

		// console.log("🗑️  [DELETE] Starting avatar deletion for user:", userId);

		const user = await User.findById(userId);

		if (!user) {
			res.status(404).json({ error: "User not found" });
			return;
		}

		// Check if user has an avatar
		if (!user.avatarUrl) {
			res.status(404).json({ error: "No avatar to delete" });
			return;
		}

		// Extract public_id from URL
		const publicId = extractPublicIdFromUrl(user.avatarUrl);

		if (!publicId) {
			console.error(
				"❌ [DELETE] Failed to extract public_id from URL:",
				user.avatarUrl
			);
			res.status(400).json({ error: "Invalid avatar URL format" });
			return;
		}

		try {
			// console.log("☁️  [CLOUDINARY] Deleting avatar:", publicId);

			// Delete from Cloudinary
			const result = await cloudinary.uploader.destroy(publicId);

			console.log("📊 [CLOUDINARY] Delete result:", result);

			// Clear avatar URL from database
			user.avatarUrl = undefined;
			await user.save();

			console.log("✅ [DELETE] Avatar deleted successfully");

			res.json({
				message: "Avatar deleted successfully",
				user,
			});
		} catch (error) {
			console.error("❌ [CLOUDINARY] Delete error:", error);
			res.status(500).json({
				msg: "Failed to delete avatar from Cloudinary",
				error: error || "Unknown error",
			});
		}
	} catch (error) {
		console.error("❌ [DELETE] Error deleting avatar:", error);
		res.status(500).json({
			msg: "Failed to delete avatar",
			error: error || "Unknown error",
		});
	}
}

// Get current user profile
export async function getProfile(req: Request, res: Response): Promise<void> {
	try {
		if (!req.user) {
			res.status(401).json({ error: "Not authenticated" });
			return;
		}
		const userId = req.user.sub;

		const user = await User.findById(userId).select(
			"-passwordHash -refreshTokens"
		);

		if (!user) {
			res.status(404).json({ error: "User not found" });
			return;
		}

		res.json({ user });
	} catch (error) {
		console.error("❌ Error fetching user profile:", error);
		res.status(500).json({
			msg: "Failed to fetch user profile",
			error: error || "Unknown error",
		});
	}
}

// Get public user profile by username with their public watchlists
export async function getUserProfileByUsername(
	req: Request,
	res: Response
): Promise<void> {
	try {
		const { username } = req.params;

		// Find user by username
		const user = await User.findOne({ username }).select(
			"_id username avatarUrl watchlistsOrder"
		);

		if (!user) {
			res.status(404).json({ error: "User not found" });
			return;
		}

		// Import Watchlist model
		const { Watchlist } = await import("../models/Watchlist.model.js");

		// Get all public watchlists owned by this user
		const publicWatchlists = await Watchlist.find({
			ownerId: user._id,
			isPublic: true,
		})
			.populate("ownerId", "username avatarUrl")
			.populate("collaborators", "username avatarUrl")
			.lean();

		// Sort watchlists according to user's watchlistsOrder
		const orderedWatchlists = publicWatchlists.sort((a, b) => {
			const indexA = user.watchlistsOrder.findIndex(
				(id) => id.toString() === a._id.toString()
			);
			const indexB = user.watchlistsOrder.findIndex(
				(id) => id.toString() === b._id.toString()
			);

			// If both are in watchlistsOrder, sort by their order
			if (indexA !== -1 && indexB !== -1) {
				return indexA - indexB;
			}

			// If only A is in watchlistsOrder, A comes first
			if (indexA !== -1) return -1;

			// If only B is in watchlistsOrder, B comes first
			if (indexB !== -1) return 1;

			// If neither is in watchlistsOrder, sort by creation date (newest first)
			return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
		});

		res.json({
			user: {
				_id: user._id,
				username: user.username,
				avatarUrl: user.avatarUrl,
			},
			watchlists: orderedWatchlists,
			totalPublicWatchlists: orderedWatchlists.length,
		});
	} catch (error) {
		console.error("❌ Error fetching user profile by username:", error);
		res.status(500).json({
			error: "Failed to fetch user profile",
		});
	}
}
