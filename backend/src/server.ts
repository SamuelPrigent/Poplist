import { v2 as cloudinary } from "cloudinary";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express, { type Request, type Response } from "express";
import mongoose from "mongoose";
import { errorHandler } from "./middleware/errors.js";
import authRoutes from "./routes/auth.routes.js";
import tmdbRoutes from "./routes/tmdb.routes.js";
import userRoutes from "./routes/user.routes.js";
import watchlistRoutes from "./routes/watchlist.routes.js";

dotenv.config();

// Configure Cloudinary
if (process.env.CLOUDINARY_URL) {
	// Parse CLOUDINARY_URL and configure explicitly
	// Format: cloudinary://api_key:api_secret@cloud_name
	const match = process.env.CLOUDINARY_URL.match(
		/cloudinary:\/\/([^:]+):([^@]+)@(.+)/
	);

	if (match) {
		cloudinary.config({
			cloud_name: match[3],
			api_key: match[1],
			api_secret: match[2],
		});
		console.log("✅ Cloudinary configured:", match[3]);
	} else {
		console.error("❌ Invalid CLOUDINARY_URL format");
	}
} else {
	console.warn("⚠️  CLOUDINARY_URL not found in environment variables");
}

// Debug: Log environment variables
console.log("🔍 [ENV DEBUG] Loading environment variables...");
console.log(
	"🔍 [ENV DEBUG] GOOGLE_CLIENT_ID:",
	process.env.GOOGLE_CLIENT_ID ? "✅ Loaded" : "❌ Missing"
);
console.log(
	"🔍 [ENV DEBUG] GOOGLE_CLIENT_SECRET:",
	process.env.GOOGLE_CLIENT_SECRET ? "✅ Loaded" : "❌ Missing"
);
console.log("🔍 [ENV DEBUG] PORT:", process.env.PORT || "using default 3000");
console.log(
	"🔍 [ENV DEBUG] CLIENT_URL:",
	process.env.CLIENT_URL || "using default"
);

const app = express();
const PORT = process.env.PORT || 3000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const MONGO_URL =
	process.env.MONGO_URL || "mongodb://localhost:27017/watchlisthub";

// Middleware
app.use(
	cors({
		origin: CLIENT_URL,
		credentials: true,
	})
);
app.use(express.json({ limit: "10mb" })); // Increased limit for base64 image uploads
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Routes
app.get("/health", (res: Response) => {
	res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Image proxy endpoint (public, no auth required)
app.get("/image-proxy", async (req: Request, res: Response) => {
	try {
		const imagePath = req.query.path as string;

		if (!imagePath || !imagePath.startsWith("/")) {
			res.status(400).json({ error: "Invalid image path" });
			return;
		}

		// Fetch image from TMDB
		const imageUrl = `https://image.tmdb.org/t/p/original${imagePath}`;
		const response = await fetch(imageUrl);

		if (!response.ok) {
			res.status(404).json({ error: "Image not found" });
			return;
		}

		// Get the image buffer
		const buffer = await response.arrayBuffer();

		// Set appropriate headers
		const contentType = response.headers.get("content-type") || "image/jpeg";
		res.setHeader("Content-Type", contentType);
		res.setHeader("Cache-Control", "public, max-age=86400"); // Cache for 24 hours
		res.setHeader("Access-Control-Allow-Origin", "*"); // Allow CORS

		// Send the image
		res.send(Buffer.from(buffer));
	} catch (error) {
		console.error("Error proxying TMDB image:", error);
		res.status(500).json({ error: "Failed to proxy image" });
	}
});

// Health check endpoint for Render
app.get("/", (_req: Request, res: Response) => {
	res.json({
		status: "ok",
		message: "WatchlistHub API is running",
		timestamp: new Date().toISOString(),
	});
});

app.use("/auth", authRoutes);
app.use("/watchlists", watchlistRoutes);
app.use("/tmdb", tmdbRoutes);
app.use("/user", userRoutes);

// Error handler (must be last)
app.use(errorHandler);

// Database connection
async function connectDB() {
	try {
		await mongoose.connect(MONGO_URL);
		console.log("✅ Connected to MongoDB");
	} catch (error) {
		console.error("❌ MongoDB connection error:", error);
		process.exit(1);
	}
}

// Start server
async function startServer() {
	await connectDB();

	app.listen(PORT, () => {
		console.log(`🚀 Server running on http://localhost:${PORT}`);
		console.log(`📱 Client URL: ${CLIENT_URL}`);
	});
}

startServer();
