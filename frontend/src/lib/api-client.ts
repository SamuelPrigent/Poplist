import type { User } from "@/context/auth-context";

// En production, appelle le backend directement (cookies cross-site avec sameSite=none)
// En dev, utilise localhost
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// Helper to get TMDB image URL through proxy to avoid CORS issues
export function getTMDBImageUrl(logoPath: string): string {
	if (!logoPath || !logoPath.startsWith("/")) {
		return "";
	}
	return `${API_URL}/image-proxy?path=${encodeURIComponent(logoPath)}`;
}

// Helper to get local watch provider logo based on provider name
export function getWatchProviderLogo(providerName: string): string | null {
	const nameMap: Record<string, string | null> = {
		netflix: "/watchProvider/netflix.svg",
		"amazon prime video": "/watchProvider/primeVideo.svg",
		"amazon prime video with ads": "/watchProvider/primeVideo.svg",
		"prime video": "/watchProvider/primeVideo.svg",
		"prime-video": "/watchProvider/primeVideo.svg",
		youtube: "/watchProvider/youtube.svg",
		"apple tv": "/watchProvider/appleTv.svg",
		"apple tv+": "/watchProvider/appleTv.svg",
		"apple tv plus": "/watchProvider/appleTv.svg",
		"apple-tv": "/watchProvider/appleTv.svg",
		"disney plus": "/watchProvider/disneyplus.svg",
		"disney+": "/watchProvider/disneyplus.svg",
		"disney-plus": "/watchProvider/disneyplus.svg",
		crunchyroll: "/watchProvider/Crunchyroll.svg",
		"hbo max": "/watchProvider/hbo.svg",
		"hbo-max": "/watchProvider/hbo.svg",
		hbo: "/watchProvider/hbo.svg",
	};

	const normalized = providerName.toLowerCase().trim();

	// First try exact match
	if (nameMap[normalized]) {
		return nameMap[normalized];
	}

	// Fallback: check if provider name contains any known provider name
	for (const [key, logo] of Object.entries(nameMap)) {
		if (normalized.includes(key) || key.includes(normalized)) {
			return logo;
		}
	}

	return null;
}

interface RequestOptions extends Omit<RequestInit, "body"> {
	body?: unknown;
	_isRetry?: boolean; // Internal flag to prevent infinite retry loops
}

// Callback to notify the app when tokens are invalid (for auto-logout)
let onAuthError: (() => void) | null = null;

export function setAuthErrorHandler(handler: () => void) {
	onAuthError = handler;
}

// Track if a refresh is already in progress to avoid multiple concurrent refreshes
let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
	// If a refresh is already in progress, wait for it
	if (refreshPromise) {
		return refreshPromise;
	}

	refreshPromise = (async () => {
		try {
			const response = await fetch(`${API_URL}/auth/refresh`, {
				method: "POST",
				credentials: "include",
			});

			if (response.ok) {
				console.log("✅ Access token refreshed successfully");
				return true;
			}

			// Silent fail - refresh token expired is expected behavior
			return false;
		} catch {
			// Silent fail - network errors are rare and will be caught elsewhere
			return false;
		} finally {
			// Clear the promise after completion
			refreshPromise = null;
		}
	})();

	return refreshPromise;
}

async function request<T>(
	endpoint: string,
	options: RequestOptions = {},
): Promise<T> {
	const { body, _isRetry, ...restOptions } = options;

	const config: RequestInit = {
		...restOptions,
		credentials: "include",
		headers: {
			"Content-Type": "application/json",
			...options.headers,
		},
	};

	if (body) {
		config.body = JSON.stringify(body);
	}

	const response = await fetch(`${API_URL}${endpoint}`, config);

	// Handle 401 Unauthorized - try to refresh token
	// Exclude /auth/refresh, /auth/logout, and /auth/me from auto-refresh
	// /auth/me is excluded because 401 is expected when not authenticated
	const shouldAttemptRefresh =
		response.status === 401 &&
		!_isRetry &&
		endpoint !== "/auth/refresh" &&
		endpoint !== "/auth/logout" &&
		endpoint !== "/auth/me";

	if (shouldAttemptRefresh) {
		console.log("🔄 Access token expired, attempting refresh...");

		const refreshed = await refreshAccessToken();

		if (refreshed) {
			// Retry the original request with the new access token
			console.log("🔄 Retrying original request with new token...");
			return request<T>(endpoint, { ...options, _isRetry: true });
		}

		// Refresh failed - notify the app to logout (will clean cookies)
		console.log("🚪 Refresh failed, triggering logout...");
		if (onAuthError) {
			onAuthError();
		}
		throw new Error("Session expired. Please log in again.");
	}

	if (!response.ok) {
		const error = await response
			.json()
			.catch(() => ({ error: "Request failed" }));
		throw new Error(error.error || "Request failed");
	}

	return response.json();
}

// Auth API
export const authAPI = {
	signup: (email: string, password: string) =>
		request("/auth/signup", {
			method: "POST",
			body: { email, password },
		}),

	login: (email: string, password: string) =>
		request("/auth/login", {
			method: "POST",
			body: { email, password },
		}),

	logout: () =>
		request("/auth/logout", {
			method: "POST",
		}),

	me: () => request("/auth/me"),

	refresh: () =>
		request("/auth/refresh", {
			method: "POST",
		}),

	updateUsername: (username: string) =>
		request("/auth/profile/username", {
			method: "PUT",
			body: { username },
		}),

	changePassword: (oldPassword: string, newPassword: string) =>
		request("/auth/profile/password", {
			method: "PUT",
			body: { oldPassword, newPassword },
		}),

	updateLanguage: (language: string) =>
		request("/auth/profile/language", {
			method: "PUT",
			body: { language },
		}),

	deleteAccount: (confirmation: string) =>
		request("/auth/profile/account", {
			method: "DELETE",
			body: { confirmation },
		}),
};

// Watchlist API
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
	runtime?: number;
	numberOfSeasons?: number;
	numberOfEpisodes?: number;
	addedAt: string;
}

export interface WatchlistOwner {
	_id?: string;
	email: string;
	username?: string;
	avatarUrl?: string;
	[key: string]: unknown;
}

export interface Collaborator {
	_id: string;
	email: string;
	username: string;
	avatarUrl?: string;
}

export interface UserProfilePublic {
	_id: string;
	username: string;
	avatarUrl?: string;
}

export interface UserProfileResponse {
	user: UserProfilePublic;
	watchlists: Watchlist[];
	totalPublicWatchlists: number;
}

export interface Watchlist {
	_id: string;
	ownerId: string | WatchlistOwner;
	name: string;
	description?: string;
	imageUrl?: string;
	thumbnailUrl?: string; // Auto-generated 2x2 poster grid (Cloudinary)
	isPublic: boolean;
	genres?: string[]; // Genre categories for discoverability
	collaborators: string[] | Collaborator[]; // Can be IDs or populated collaborator objects
	items: WatchlistItem[];
	createdAt: string;
	updatedAt: string;
	followersCount?: number; // Number of users who saved/follow this watchlist
	likedBy: string[]; // Array of user IDs who liked/saved this watchlist
	isSaved?: boolean; // Indicates if this watchlist is followed/saved by the current user
	isOwner?: boolean; // Indicates if the current user is the owner of this watchlist
	isCollaborator?: boolean; // Indicates if the current user is a collaborator of this watchlist
}

export interface FullMediaDetails {
	tmdbId: string;
	title: string;
	overview: string;
	posterUrl: string;
	backdropUrl: string;
	releaseDate: string;
	runtime?: number;
	rating: number;
	voteCount: number;
	genres: string[];
	cast: Array<{
		name: string;
		character: string;
		profileUrl: string;
	}>;
	director?: string;
	type: "movie" | "tv";
	numberOfSeasons?: number;
	numberOfEpisodes?: number;
}

export const watchlistAPI = {
	getMine: (): Promise<{ watchlists: Watchlist[] }> =>
		request("/watchlists/mine"),

	getById: (
		id: string,
	): Promise<{
		watchlist: Watchlist;
		isSaved: boolean;
		isCollaborator: boolean;
	}> => request(`/watchlists/${id}`),

	create: (data: {
		name: string;
		description?: string;
		isPublic?: boolean;
		genres?: string[];
		items?: WatchlistItem[];
		fromLocalStorage?: boolean;
	}): Promise<{ watchlist: Watchlist }> =>
		request("/watchlists", {
			method: "POST",
			body: data,
		}),

	update: (
		id: string,
		data: {
			name?: string;
			description?: string;
			isPublic?: boolean;
			genres?: string[];
			items?: WatchlistItem[];
		},
	): Promise<{ watchlist: Watchlist }> =>
		request(`/watchlists/${id}`, {
			method: "PUT",
			body: data,
		}),

	delete: (id: string): Promise<{ message: string }> =>
		request(`/watchlists/${id}`, {
			method: "DELETE",
		}),

	addCollaborator: (
		id: string,
		username: string,
	): Promise<{ message: string; collaborator: Collaborator }> =>
		request(`/watchlists/${id}/collaborators`, {
			method: "POST",
			body: { username },
		}),

	removeCollaborator: (
		id: string,
		collaboratorId: string,
	): Promise<{ message: string }> =>
		request(`/watchlists/${id}/collaborators/${collaboratorId}`, {
			method: "DELETE",
		}),

	leaveWatchlist: (id: string): Promise<{ message: string }> =>
		request(`/watchlists/${id}/leave`, {
			method: "POST",
		}),

	getPublic: (id: string): Promise<{ watchlist: Watchlist }> =>
		request(`/watchlists/public/${id}`),

	addItem: (
		id: string,
		data: {
			tmdbId: string;
			type: "movie" | "tv";
			language?: string;
			region?: string;
		},
	): Promise<{ watchlist: Watchlist }> =>
		request(`/watchlists/${id}/items`, {
			method: "POST",
			body: data,
		}),

	removeItem: (id: string, tmdbId: string): Promise<{ watchlist: Watchlist }> =>
		request(`/watchlists/${id}/items/${tmdbId}`, {
			method: "DELETE",
		}),

	moveItem: (
		id: string,
		tmdbId: string,
		position: "first" | "last",
	): Promise<{ watchlist: Watchlist }> =>
		request(`/watchlists/${id}/items/${tmdbId}/position`, {
			method: "PUT",
			body: { position },
		}),

	reorderItems: (
		id: string,
		orderedTmdbIds: string[],
	): Promise<{ watchlist: Watchlist }> =>
		request(`/watchlists/${id}/items/reorder`, {
			method: "PUT",
			body: { orderedTmdbIds },
		}),

	reorderWatchlists: (
		orderedWatchlistIds: string[],
	): Promise<{ message: string }> =>
		request(`/watchlists/reorder`, {
			method: "PUT",
			body: { orderedWatchlistIds },
		}),

	uploadCover: (
		id: string,
		imageData: string,
	): Promise<{ watchlist: Watchlist; imageUrl: string }> =>
		request(`/watchlists/${id}/upload-cover`, {
			method: "POST",
			body: { imageData },
		}),

	deleteCover: (
		id: string,
	): Promise<{ message: string; watchlist: Watchlist }> =>
		request(`/watchlists/${id}/cover`, {
			method: "DELETE",
		}),

	fetchTMDBProviders: async (
		tmdbId: string,
		type: "movie" | "tv",
		region: string = "FR",
	): Promise<Platform[]> => {
		try {
			const response = await request(
				`/tmdb/${type}/${tmdbId}/providers?region=${region}`,
			);
			const data = response as {
				results: {
					[countryCode: string]: {
						link: string;
						flatrate?: Array<{
							logo_path: string;
							provider_id: number;
							provider_name: string;
							display_priority: number;
						}>;
						buy?: Array<{
							logo_path: string;
							provider_id: number;
							provider_name: string;
							display_priority: number;
						}>;
						rent?: Array<{
							logo_path: string;
							provider_id: number;
							provider_name: string;
							display_priority: number;
						}>;
					};
				};
			};

			const regionData = data.results[region];
			if (!regionData) {
				return [{ name: "Inconnu", logoPath: "" }];
			}

			// Collect all providers
			const allProviders: Platform[] = [];

			// Priority: flatrate (streaming) > buy > rent
			if (regionData.flatrate) {
				allProviders.push(
					...regionData.flatrate.map((p) => ({
						name: p.provider_name,
						logoPath: p.logo_path,
					})),
				);
			}

			if (regionData.buy) {
				allProviders.push(
					...regionData.buy.map((p) => ({
						name: p.provider_name,
						logoPath: p.logo_path,
					})),
				);
			}

			if (regionData.rent) {
				allProviders.push(
					...regionData.rent.map((p) => ({
						name: p.provider_name,
						logoPath: p.logo_path,
					})),
				);
			}

			// Remove duplicates by provider name
			const uniqueProviders = new Map<string, Platform>();
			for (const provider of allProviders) {
				if (!uniqueProviders.has(provider.name)) {
					uniqueProviders.set(provider.name, provider);
				}
			}

			const result = Array.from(uniqueProviders.values());
			return result.length > 0 ? result : [{ name: "Inconnu", logoPath: "" }];
		} catch (error) {
			console.error("Failed to fetch TMDB providers:", error);
			return [{ name: "Inconnu", logoPath: "" }];
		}
	},

	searchTMDB: (params: {
		query: string;
		language?: string;
		region?: string;
		page?: number;
	}): Promise<{
		results: Array<{
			id: number;
			media_type: "movie" | "tv";
			title?: string;
			name?: string;
			poster_path: string | null;
			release_date?: string;
			first_air_date?: string;
			runtime?: number;
		}>;
		total_pages: number;
		total_results: number;
	}> => {
		const searchParams = new URLSearchParams({
			query: params.query,
			...(params.language && { language: params.language }),
			...(params.region && { region: params.region }),
			...(params.page && { page: params.page.toString() }),
		});
		return request(`/watchlists/search/tmdb?${searchParams.toString()}`);
	},

	getItemDetails: (
		tmdbId: string,
		type: "movie" | "tv",
		language?: string,
	): Promise<{ details: FullMediaDetails }> => {
		const searchParams = new URLSearchParams();
		if (language) searchParams.append("language", language);
		const query = searchParams.toString();
		return request(
			`/watchlists/items/${tmdbId}/${type}/details${query ? `?${query}` : ""}`,
		);
	},

	getPublicWatchlists: (
		limit?: number,
	): Promise<{ watchlists: Watchlist[] }> => {
		const searchParams = new URLSearchParams();
		if (limit) searchParams.append("limit", limit.toString());
		const query = searchParams.toString();
		return request(`/watchlists/public/featured${query ? `?${query}` : ""}`);
	},

	getAllPublicWatchlists: (): Promise<{ watchlists: Watchlist[] }> =>
		request("/watchlists/public/all"),

	getWatchlistsByGenre: (genre: string): Promise<{ watchlists: Watchlist[] }> =>
		request(`/watchlists/by-genre/${genre}`),

	saveWatchlist: (id: string): Promise<{ message: string }> =>
		request(`/watchlists/${id}/like-and-save`, {
			method: "POST",
		}),

	unsaveWatchlist: (id: string): Promise<{ message: string }> =>
		request(`/watchlists/${id}/unlike-and-unsave`, {
			method: "DELETE",
		}),

	duplicateWatchlist: (id: string): Promise<{ watchlist: Watchlist }> =>
		request(`/watchlists/${id}/duplicate`, {
			method: "POST",
		}),
};

// User API
export const userAPI = {
	uploadAvatar: (
		imageData: string,
	): Promise<{ user: User; avatarUrl: string }> =>
		request("/user/upload-avatar", {
			method: "POST",
			body: { imageData },
		}),

	deleteAvatar: (): Promise<{ message: string; user: User }> =>
		request("/user/avatar", {
			method: "DELETE",
		}),

	getProfile: (): Promise<{ user: User }> =>
		request("/user/profile", {
			method: "GET",
		}),

	getUserProfileByUsername: (username: string): Promise<UserProfileResponse> =>
		request(`/user/profile/${username}`, {
			method: "GET",
		}),
};

// TMDB API
export const tmdbAPI = {
	getTrending: (
		timeWindow: "day" | "week" = "day",
		page: number = 1,
	): Promise<{
		results: Array<{
			id: number;
			media_type: "movie" | "tv";
			title?: string;
			name?: string;
			poster_path?: string;
			backdrop_path?: string;
			overview?: string;
			vote_average?: number;
			release_date?: string;
			first_air_date?: string;
		}>;
		page: number;
		total_pages: number;
		total_results: number;
	}> => {
		const searchParams = new URLSearchParams({
			page: page.toString(),
		});
		return request(`/tmdb/trending/${timeWindow}?${searchParams.toString()}`);
	},
};
