import { User } from "../models/User.model.js";

/**
 * Generate a unique username in the format "user1234"
 * Keeps trying until a unique username is found
 */
export async function generateUniqueUsername(): Promise<string> {
	let attempts = 0;
	const maxAttempts = 100;

	while (attempts < maxAttempts) {
		// Generate random 4-digit number
		const randomNum = Math.floor(1000 + Math.random() * 9000);
		const username = `user${randomNum}`;

		// Check if username already exists
		const existing = await User.findOne({ username });

		if (!existing) {
			return username;
		}

		attempts++;
	}

	// Fallback to timestamp-based username if all attempts fail
	return `user${Date.now()}`;
}
