import bcrypt from "bcrypt";
import type { Request, Response } from "express";
import { z } from "zod";
// cookie non http only pour le moment
import {
	clearAuthCookies,
	setAccessTokenCookie,
	setRefreshTokenCookie,
} from "../lib/cookies.js";
import {
	getClientURL,
	getGoogleAuthURL,
	getGoogleUserInfo,
} from "../lib/google.js";
import {
	generateTokenId,
	hashToken,
	signAccessToken,
	signRefreshToken,
	verifyRefreshToken,
} from "../lib/jwt.js";
import { generateUniqueUsername } from "../lib/username.js";
import { User } from "../models/User.model.js";

const signupSchema = z.object({
	email: z.string().email(),
	password: z.string().min(8),
});

const loginSchema = z.object({
	email: z.string().email(),
	password: z.string(),
});

export async function signup(req: Request, res: Response): Promise<void> {
	try {
		const { email, password } = signupSchema.parse(req.body);

		// Check if user exists
		const existingUser = await User.findOne({ email });
		if (existingUser) {
			res.status(409).json({ error: "User already exists" });
			return;
		}

		// Hash password
		const passwordHash = await bcrypt.hash(password, 10);

		// Generate unique username
		const username = await generateUniqueUsername();

		// Create user
		const user = await User.create({
			email,
			username,
			passwordHash,
			roles: ["user"],
		});

		// Generate tokens
		const tokenId = generateTokenId();
		const accessToken = signAccessToken({
			sub: user._id.toString(),
			email: user.email,
			roles: user.roles,
		});
		const refreshToken = signRefreshToken({
			sub: user._id.toString(),
			tokenId,
		});

		// Store refresh token hash
		user.refreshTokens.push({
			tokenHash: hashToken(refreshToken),
			issuedAt: new Date(),
			userAgent: req.headers["user-agent"],
		});
		await user.save();

		// Set cookies
		setAccessTokenCookie(res, accessToken);
		setRefreshTokenCookie(res, refreshToken);

		res.status(201).json({
			user: {
				id: user._id,
				email: user.email,
				username: user.username,
				language: user.language || "fr",
				avatarUrl: user.avatarUrl,
				roles: user.roles,
				hasPassword: !!user.passwordHash,
			},
		});
	} catch (error) {
		if (error instanceof z.ZodError) {
			res.status(400).json({ error: "Invalid input", details: error.errors });
			return;
		}
		throw error;
	}
}

export async function login(req: Request, res: Response): Promise<void> {
	try {
		const { email, password } = loginSchema.parse(req.body);

		// Find user
		const user = await User.findOne({ email });
		if (!user || !user.passwordHash) {
			res.status(401).json({ error: "Invalid credentials" });
			return;
		}

		// Verify password
		const isValid = await bcrypt.compare(password, user.passwordHash);
		if (!isValid) {
			res.status(401).json({ error: "Invalid credentials" });
			return;
		}

		// Generate username if missing (for existing users)
		if (!user.username) {
			user.username = await generateUniqueUsername();
		}

		// Generate tokens
		const tokenId = generateTokenId();
		const accessToken = signAccessToken({
			sub: user._id.toString(),
			email: user.email,
			roles: user.roles,
		});
		const refreshToken = signRefreshToken({
			sub: user._id.toString(),
			tokenId,
		});

		// Store refresh token hash
		user.refreshTokens.push({
			tokenHash: hashToken(refreshToken),
			issuedAt: new Date(),
			userAgent: req.headers["user-agent"],
		});
		await user.save();

		// Set cookies
		setAccessTokenCookie(res, accessToken);
		setRefreshTokenCookie(res, refreshToken);

		res.json({
			user: {
				id: user._id,
				email: user.email,
				username: user.username,
				language: user.language || "fr",
				avatarUrl: user.avatarUrl,
				roles: user.roles,
				hasPassword: !!user.passwordHash,
			},
		});
	} catch (error) {
		if (error instanceof z.ZodError) {
			res.status(400).json({ error: "Invalid input", details: error.errors });
			return;
		}
		throw error;
	}
}

export async function googleAuth(_req: Request, res: Response): Promise<void> {
	console.log("🔵 [Google Auth] Starting OAuth flow...");
	console.log(
		"🔵 [Google Auth] Redirect URI configured:",
		process.env.CLIENT_URL || "http://localhost:5173",
	);
	const authUrl = getGoogleAuthURL();
	console.log("🔵 [Google Auth] Generated auth URL:", authUrl);
	res.redirect(authUrl);
}

export async function googleCallback(
	req: Request,
	res: Response,
): Promise<void> {
	try {
		console.log("🟢 [Google Callback] Received callback from Google");
		console.log("🟢 [Google Callback] Query params:", req.query);

		const { code } = req.query;

		if (!code || typeof code !== "string") {
			console.error(
				"🔴 [Google Callback] Missing or invalid authorization code",
			);
			res.status(400).json({ error: "Missing authorization code" });
			return;
		}

		console.log(
			"🟢 [Google Callback] Authorization code received, fetching user info...",
		);

		// Get user info from Google
		const { googleId, email } = await getGoogleUserInfo(code);
		console.log("🟢 [Google Callback] User info retrieved:", {
			googleId,
			email,
		});

		// Find or create user
		let user = await User.findOne({ $or: [{ googleId }, { email }] });

		if (!user) {
			// Generate unique username for new user
			const username = await generateUniqueUsername();

			user = await User.create({
				email,
				username,
				googleId,
				roles: ["user"],
			});
		} else {
			// Update existing user
			let needsSave = false;

			// Link Google account if not linked
			if (!user.googleId) {
				user.googleId = googleId;
				needsSave = true;
			}

			// Generate username if missing (for existing users)
			if (!user.username) {
				user.username = await generateUniqueUsername();
				needsSave = true;
			}

			if (needsSave) {
				await user.save();
			}
		}

		// Generate tokens
		const tokenId = generateTokenId();
		const accessToken = signAccessToken({
			sub: user._id.toString(),
			email: user.email,
			roles: user.roles,
		});
		const refreshToken = signRefreshToken({
			sub: user._id.toString(),
			tokenId,
		});

		// Store refresh token hash
		user.refreshTokens.push({
			tokenHash: hashToken(refreshToken),
			issuedAt: new Date(),
			userAgent: req.headers["user-agent"],
		});
		await user.save();

		// Set cookies
		setAccessTokenCookie(res, accessToken);
		setRefreshTokenCookie(res, refreshToken);

		// Return popup close page
		const clientURL = getClientURL();
		res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authentication Successful</title>
        </head>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ status: 'success' }, '${clientURL}');
              window.close();
            } else {
              window.location.href = '${clientURL}';
            }
          </script>
          <p>Authentication successful. You can close this window.</p>
        </body>
      </html>
    `);
	} catch (error) {
		console.error("🔴 [Google Callback] Error during OAuth flow:", error);
		console.error("🔴 [Google Callback] Error details:", {
			message: error instanceof Error ? error.message : "Unknown error",
			stack: error instanceof Error ? error.stack : undefined,
		});
		const clientURL = getClientURL();
		res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authentication Failed</title>
        </head>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ status: 'error', message: 'Authentication failed' }, '${clientURL}');
              window.close();
            } else {
              window.location.href = '${clientURL}';
            }
          </script>
          <p>Authentication failed. You can close this window.</p>
        </body>
      </html>
    `);
	}
}

export async function refresh(req: Request, res: Response): Promise<void> {
	try {
		const refreshToken = req.cookies.refreshToken;

		if (!refreshToken) {
			res.status(401).json({ error: "Refresh token required" });
			return;
		}

		// Verify refresh token
		const payload = verifyRefreshToken(refreshToken);
		const tokenHash = hashToken(refreshToken);

		// Find user and verify token exists
		const user = await User.findById(payload.sub);
		if (!user) {
			res.status(401).json({ error: "User not found" });
			return;
		}

		const tokenIndex = user.refreshTokens.findIndex(
			(t) => t.tokenHash === tokenHash,
		);

		if (tokenIndex === -1) {
			res.status(401).json({ error: "Invalid refresh token" });
			return;
		}

		// Remove old refresh token
		user.refreshTokens.splice(tokenIndex, 1);

		// Generate new tokens
		const newTokenId = generateTokenId();
		const newAccessToken = signAccessToken({
			sub: user._id.toString(),
			email: user.email,
			roles: user.roles,
		});
		const newRefreshToken = signRefreshToken({
			sub: user._id.toString(),
			tokenId: newTokenId,
		});

		// Store new refresh token hash
		user.refreshTokens.push({
			tokenHash: hashToken(newRefreshToken),
			issuedAt: new Date(),
			userAgent: req.headers["user-agent"],
		});
		await user.save();

		// Set new cookies
		setAccessTokenCookie(res, newAccessToken);
		setRefreshTokenCookie(res, newRefreshToken);

		res.json({ message: "Tokens refreshed" });
	} catch (error) {
		res
			.status(401)
			.json({ error: `Invalid or expired refresh token : ${error}` });
	}
}

export async function logout(req: Request, res: Response): Promise<void> {
	const refreshToken = req.cookies.refreshToken;

	if (refreshToken) {
		const tokenHash = hashToken(refreshToken);

		try {
			const payload = verifyRefreshToken(refreshToken);
			const user = await User.findById(payload.sub);

			if (user) {
				// Remove this refresh token
				user.refreshTokens = user.refreshTokens.filter(
					(t) => t.tokenHash !== tokenHash,
				);
				await user.save();
			}
		} catch (error) {
			// Token invalid or expired, continue with logout
			res
				.status(401)
				.json({ error: `Invalid or expired refresh token : ${error}` });
		}
	}

	clearAuthCookies(res);
	res.json({ message: "Logged out successfully" });
}

export async function me(req: Request, res: Response): Promise<void> {
	if (!req.user) {
		res.status(401).json({ error: "Not authenticated" });
		return;
	}

	const user = await User.findById(req.user.sub).select("-refreshTokens");

	if (!user) {
		res.status(404).json({ error: "User not found" });
		return;
	}

	res.json({
		user: {
			id: user._id,
			email: user.email,
			username: user.username,
			language: user.language || "fr",
			avatarUrl: user.avatarUrl,
			roles: user.roles,
			createdAt: user.createdAt,
			hasPassword: !!user.passwordHash,
		},
	});
}

const updateUsernameSchema = z.object({
	username: z
		.string()
		.min(3)
		.max(20)
		.regex(
			/^[a-zA-Z0-9_]+$/,
			"Username can only contain letters, numbers, and underscores",
		),
});

export async function updateUsername(
	req: Request,
	res: Response,
): Promise<void> {
	try {
		if (!req.user) {
			res.status(401).json({ error: "Not authenticated" });
			return;
		}

		const { username } = updateUsernameSchema.parse(req.body);

		const user = await User.findById(req.user.sub);
		if (!user) {
			res.status(404).json({ error: "User not found" });
			return;
		}

		// Check if username is already taken
		const existingUser = await User.findOne({ username });
		if (existingUser && existingUser._id.toString() !== user._id.toString()) {
			res.status(409).json({ error: "Username already taken" });
			return;
		}

		user.username = username;
		await user.save();

		res.json({
			user: {
				id: user._id,
				email: user.email,
				username: user.username,
				language: user.language || "fr",
				avatarUrl: user.avatarUrl,
				roles: user.roles,
				hasPassword: !!user.passwordHash,
			},
		});
	} catch (error) {
		if (error instanceof z.ZodError) {
			res.status(400).json({ error: "Invalid input", details: error.errors });
			return;
		}
		throw error;
	}
}

const updateLanguageSchema = z.object({
	language: z.enum(["fr", "en", "de", "es", "it", "pt"]),
});

export async function updateLanguage(
	req: Request,
	res: Response,
): Promise<void> {
	try {
		if (!req.user) {
			res.status(401).json({ error: "Not authenticated" });
			return;
		}

		const { language } = updateLanguageSchema.parse(req.body);

		const user = await User.findById(req.user.sub);
		if (!user) {
			res.status(404).json({ error: "User not found" });
			return;
		}

		user.language = language;
		await user.save();

		res.json({
			user: {
				id: user._id,
				email: user.email,
				username: user.username,
				language: user.language,
				avatarUrl: user.avatarUrl,
				roles: user.roles,
				hasPassword: !!user.passwordHash,
			},
		});
	} catch (error) {
		if (error instanceof z.ZodError) {
			res.status(400).json({ error: "Invalid input", details: error.errors });
			return;
		}
		throw error;
	}
}

const changePasswordSchema = z.object({
	oldPassword: z.string(),
	newPassword: z.string().min(8),
});

export async function changePassword(
	req: Request,
	res: Response,
): Promise<void> {
	try {
		if (!req.user) {
			res.status(401).json({ error: "Not authenticated" });
			return;
		}

		const { oldPassword, newPassword } = changePasswordSchema.parse(req.body);

		const user = await User.findById(req.user.sub);
		if (!user) {
			res.status(404).json({ error: "User not found" });
			return;
		}

		// Check if user has a password (OAuth users don't)
		if (!user.passwordHash) {
			res
				.status(400)
				.json({ error: "Cannot change password for OAuth accounts" });
			return;
		}

		// Verify old password
		const isValid = await bcrypt.compare(oldPassword, user.passwordHash);
		if (!isValid) {
			res.status(401).json({ error: "Invalid old password" });
			return;
		}

		// Hash new password
		user.passwordHash = await bcrypt.hash(newPassword, 10);
		await user.save();

		res.json({ message: "Password changed successfully" });
	} catch (error) {
		if (error instanceof z.ZodError) {
			res.status(400).json({ error: "Invalid input", details: error.errors });
			return;
		}
		throw error;
	}
}

const deleteAccountSchema = z.object({
	confirmation: z.literal("confirmer"),
});

export async function deleteAccount(
	req: Request,
	res: Response,
): Promise<void> {
	try {
		const { confirmation } = deleteAccountSchema.parse(req.body);

		if (!req.user?.sub) {
			res.status(401).json({ error: "Not authenticated" });
			return;
		}

		const userId = req.user.sub;

		// Import Watchlist model dynamically to avoid circular dependency
		const { Watchlist } = await import("../models/Watchlist.model.js");

		// Remove user from all watchlists' likedBy arrays
		await Watchlist.updateMany(
			{ likedBy: userId },
			{
				$pull: { likedBy: userId },
				$inc: { followersCount: -1 },
			},
		);

		// Remove this user's watchlists from other users' savedWatchlists arrays
		const userWatchlists = await Watchlist.find({ ownerId: userId }).select(
			"_id",
		);
		const watchlistIds = userWatchlists.map((w) => w._id);

		await User.updateMany(
			{ savedWatchlists: { $in: watchlistIds } },
			{ $pull: { savedWatchlists: { $in: watchlistIds } } },
		);

		// Delete all user's watchlists
		await Watchlist.deleteMany({ ownerId: userId });

		// Clear auth cookies before deleting user
		clearAuthCookies(res);

		// Delete user account
		await User.findByIdAndDelete(userId);

		res.json({
			message: `Account deleted successfully, result : ${confirmation}`,
		});
	} catch (error) {
		if (error instanceof z.ZodError) {
			res.status(400).json({ error: "Invalid confirmation text" });
			return;
		}
		throw error;
	}
}

export async function checkUsernameAvailability(
	req: Request,
	res: Response,
): Promise<void> {
	const { username } = req.params;

	// Validate username format
	if (!username || username.length < 3 || username.length > 20) {
		res
			.status(400)
			.json({ error: "Username must be between 3 and 20 characters" });
		return;
	}

	if (!/^[a-zA-Z0-9_]+$/.test(username)) {
		res.status(400).json({
			error: "Username can only contain letters, numbers, and underscores",
		});
		return;
	}

	// Check if username exists
	const existingUser = await User.findOne({ username });

	res.json({
		available: !existingUser,
		username,
	});
}
