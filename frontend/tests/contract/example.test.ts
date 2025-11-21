import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * CONTRACT TESTS
 *
 * Objectif : Tester le contrat réel avec l'API backend
 * - ✅ Appelle une VRAIE instance API de test (pas de mock)
 * - ✅ Utilise une vraie DB de test (séparée de dev/prod)
 * - ✅ Vérifie que le contrat API est respecté
 * - ❌ JAMAIS utiliser l'API de dev/prod
 *
 * Configuration :
 * - URL API de test définie dans .env.test
 * - Instance backend séparée avec DB de test
 */

const TEST_API_URL = process.env.TEST_API_URL || "http://localhost:3001";

// Helper pour faire des appels API réels
async function apiRequest(endpoint: string, options: RequestInit = {}) {
	const response = await fetch(`${TEST_API_URL}${endpoint}`, {
		...options,
		headers: {
			"Content-Type": "application/json",
			...options.headers,
		},
	});

	if (!response.ok) {
		throw new Error(`API Error: ${response.status} ${response.statusText}`);
	}

	return response.json();
}

describe("Contract Tests - Real API Calls", () => {
	let testToken: string;
	let testWatchlistId: string;

	beforeAll(async () => {
		// Setup : Créer un utilisateur de test et obtenir un token
		// Note: Dans un vrai scénario, vous auriez une API de setup de test
		try {
			const registerResponse = await apiRequest("/api/auth/register", {
				method: "POST",
				body: JSON.stringify({
					email: `test-${Date.now()}@example.com`,
					password: "TestPassword123!",
					username: `testuser-${Date.now()}`,
				}),
			});
			testToken = registerResponse.token;
		} catch (error) {
			console.warn("Setup failed - API might not be available:", error);
		}
	});

	afterAll(async () => {
		// Cleanup : Supprimer les données de test
		if (testWatchlistId && testToken) {
			try {
				await apiRequest(`/api/watchlists/${testWatchlistId}`, {
					method: "DELETE",
					headers: {
						Authorization: `Bearer ${testToken}`,
					},
				});
			} catch (error) {
				console.warn("Cleanup failed:", error);
			}
		}
	});

	describe("Watchlist API Contract", () => {
		it("should create a watchlist and return correct schema", async () => {
			// Skip si pas de token (API non disponible)
			if (!testToken) {
				console.warn("Skipping test - API not available");
				return;
			}

			const watchlistData = {
				name: "Test Watchlist",
				description: "Created by contract test",
				isPublic: false,
			};

			const response = await apiRequest("/api/watchlists", {
				method: "POST",
				headers: {
					Authorization: `Bearer ${testToken}`,
				},
				body: JSON.stringify(watchlistData),
			});

			// Vérifier le contrat de l'API
			expect(response).toHaveProperty("watchlist");
			expect(response.watchlist).toHaveProperty("_id");
			expect(response.watchlist).toHaveProperty("name", watchlistData.name);
			expect(response.watchlist).toHaveProperty(
				"description",
				watchlistData.description,
			);
			expect(response.watchlist).toHaveProperty("isPublic", false);
			expect(response.watchlist).toHaveProperty("items");
			expect(Array.isArray(response.watchlist.items)).toBe(true);
			expect(response.watchlist).toHaveProperty("createdAt");
			expect(response.watchlist).toHaveProperty("updatedAt");

			// Sauvegarder l'ID pour les tests suivants et le cleanup
			testWatchlistId = response.watchlist._id;
		});

		it("should retrieve watchlist by ID", async () => {
			if (!testToken || !testWatchlistId) {
				console.warn(
					"Skipping test - API not available or no watchlist created",
				);
				return;
			}

			const response = await apiRequest(`/api/watchlists/${testWatchlistId}`, {
				headers: {
					Authorization: `Bearer ${testToken}`,
				},
			});

			expect(response).toHaveProperty("watchlist");
			expect(response.watchlist._id).toBe(testWatchlistId);
			expect(response.watchlist).toHaveProperty("name");
			expect(response.watchlist).toHaveProperty("items");
		});

		it("should return 404 for non-existent watchlist", async () => {
			if (!testToken) {
				console.warn("Skipping test - API not available");
				return;
			}

			const fakeId = "000000000000000000000000";

			await expect(
				apiRequest(`/api/watchlists/${fakeId}`, {
					headers: {
						Authorization: `Bearer ${testToken}`,
					},
				}),
			).rejects.toThrow();
		});
	});

	describe("Health Check", () => {
		it("should confirm test API is accessible", async () => {
			try {
				const response = await fetch(`${TEST_API_URL}/health`);
				expect(response.ok).toBe(true);
			} catch (error) {
				console.warn(
					"Test API is not accessible. Make sure the test API server is running.",
				);
				throw error;
			}
		});
	});
});
