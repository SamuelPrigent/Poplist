import { client, unwrap } from "./client";

// Re-exports — composants importent tout depuis '@/api'
export { client, unwrap, setAuthErrorHandler } from "./client";
export type * from "./types";
export { createPlaceholderItem } from "./types";
export { fetchTMDBProviders, getWatchProviderLogo, type ProviderLogo } from "./tmdb-helpers";

// ========================================
// honoAPI — couche méthodes (wrappers RPC + unwrap)
// Structure mirroir des routes backend
// ========================================

export const honoAPI = {
	// ============== AUTH ==============
	auth: {
		signup: async (email: string, password: string) =>
			unwrap(await client.auth.signup.$post({ json: { email, password } })),

		login: async (email: string, password: string) =>
			unwrap(await client.auth.login.$post({ json: { email, password } })),

		logout: async () => unwrap(await client.auth.logout.$post()),

		me: async () => unwrap(await client.auth.me.$get()),

		refresh: async () => unwrap(await client.auth.refresh.$post()),

		checkUsername: async (username: string) =>
			unwrap(
				await client.auth.username.check[":username"].$get({
					param: { username },
				}),
			),

		updateUsername: async (username: string) =>
			unwrap(
				await client.auth.profile.username.$put({ json: { username } }),
			),

		changePassword: async (oldPassword: string, newPassword: string) =>
			unwrap(
				await client.auth.profile.password.$put({
					json: { oldPassword, newPassword },
				}),
			),

		updateLanguage: async (language: "fr" | "en" | "de" | "es" | "it" | "pt") =>
			unwrap(await client.auth.profile.language.$put({ json: { language } })),

		deleteAccount: async (confirmation: "confirmer") =>
			unwrap(
				await client.auth.profile.account.$delete({ json: { confirmation } }),
			),
	},

	// ============== WATCHLISTS ==============
	watchlists: {
		// Public
		getPublicFeatured: async (limit?: number) =>
			unwrap(
				await client.watchlists.public.featured.$get({
					query: limit ? { limit: String(limit) } : {},
				}),
			),

		getPublic: async (id: string) =>
			unwrap(
				await client.watchlists.public[":id"].$get({ param: { id } }),
			),

		getByGenre: async (genre: string) =>
			unwrap(
				await client.watchlists["by-genre"][":genre"].$get({
					param: { genre },
				}),
			),

		getCountByGenre: async (genre: string) =>
			unwrap(
				await client.watchlists["count-by-genre"][":genre"].$get({
					param: { genre },
				}),
			),

		searchTMDB: async (params: {
			query: string;
			language?: string;
			region?: string;
			page?: string;
		}) =>
			unwrap(
				await client.watchlists.search.tmdb.$get({ query: params }),
			),

		getItemDetails: async (
			tmdbId: string,
			type: "movie" | "tv",
			language?: string,
		) =>
			unwrap(
				await client.watchlists.items[":tmdbId"][":type"].details.$get({
					param: { tmdbId, type },
					query: language ? { language } : {},
				}),
			),

		// Protected
		getMine: async () => unwrap(await client.watchlists.mine.$get()),

		getById: async (id: string) =>
			unwrap(await client.watchlists[":id"].$get({ param: { id } })),

		create: async (data: {
			name: string;
			description?: string;
			isPublic?: boolean;
			genres?: string[];
			items?: Array<{
				tmdbId: number;
				title: string;
				posterPath?: string | null;
				mediaType: "movie" | "tv";
				platformList?: Array<{ name: string; logoPath?: string }>;
				runtime?: number;
				numberOfSeasons?: number;
				numberOfEpisodes?: number;
				addedAt?: string;
			}>;
			fromLocalStorage?: boolean;
		}) => unwrap(await client.watchlists.$post({ json: data })),

		update: async (
			id: string,
			data: {
				name?: string;
				description?: string;
				isPublic?: boolean;
				genres?: string[];
				items?: Array<{
					tmdbId: number;
					title: string;
					posterPath?: string | null;
					mediaType: "movie" | "tv";
					platformList?: Array<{ name: string; logoPath?: string }>;
					runtime?: number;
					numberOfSeasons?: number;
					numberOfEpisodes?: number;
					addedAt?: string;
				}>;
			},
		) =>
			unwrap(
				await client.watchlists[":id"].$put({
					param: { id },
					json: data,
				}),
			),

		delete: async (id: string) =>
			unwrap(await client.watchlists[":id"].$delete({ param: { id } })),

		reorderWatchlists: async (orderedWatchlistIds: string[]) =>
			unwrap(
				await client.watchlists.reorder.$put({
					json: { orderedWatchlistIds },
				}),
			),

		// Collaborators
		addCollaborator: async (id: string, username: string) =>
			unwrap(
				await client.watchlists[":id"].collaborators.$post({
					param: { id },
					json: { username },
				}),
			),

		removeCollaborator: async (id: string, collaboratorId: string) =>
			unwrap(
				await client.watchlists[":id"].collaborators[
					":collaboratorId"
				].$delete({ param: { id, collaboratorId } }),
			),

		leave: async (id: string) =>
			unwrap(
				await client.watchlists[":id"].leave.$post({ param: { id } }),
			),

		// Items
		addItem: async (
			id: string,
			data: {
				tmdbId: string;
				mediaType: "movie" | "tv";
				language?: string;
				region?: string;
			},
		) =>
			unwrap(
				await client.watchlists[":id"].items.$post({
					param: { id },
					json: data,
				}),
			),

		removeItem: async (id: string, tmdbId: string) =>
			unwrap(
				await client.watchlists[":id"].items[":tmdbId"].$delete({
					param: { id, tmdbId },
				}),
			),

		moveItem: async (
			id: string,
			tmdbId: string,
			position: "first" | "last",
		) =>
			unwrap(
				await client.watchlists[":id"].items[":tmdbId"].position.$put({
					param: { id, tmdbId },
					json: { position },
				}),
			),

		reorderItems: async (id: string, orderedTmdbIds: string[]) =>
			unwrap(
				await client.watchlists[":id"].items.reorder.$put({
					param: { id },
					json: { orderedTmdbIds },
				}),
			),

		// Cover
		uploadCover: async (id: string, imageData: string) =>
			unwrap(
				await client.watchlists[":id"]["upload-cover"].$post({
					param: { id },
					json: { imageData },
				}),
			),

		deleteCover: async (id: string) =>
			unwrap(
				await client.watchlists[":id"].cover.$delete({ param: { id } }),
			),

		// Thumbnail
		generateThumbnail: async (id: string) =>
			unwrap(
				await client.watchlists[":id"]["generate-thumbnail"].$post({
					param: { id },
				}),
			),

		// Save / Unsave / Duplicate
		save: async (id: string) =>
			unwrap(
				await client.watchlists[":id"]["like-and-save"].$post({
					param: { id },
				}),
			),

		unsave: async (id: string) =>
			unwrap(
				await client.watchlists[":id"]["unlike-and-unsave"].$delete({
					param: { id },
				}),
			),

		duplicate: async (id: string) =>
			unwrap(
				await client.watchlists[":id"].duplicate.$post({ param: { id } }),
			),
	},

	// ============== USERS ==============
	users: {
		getProfile: async () => unwrap(await client.user.profile.$get()),

		getByUsername: async (username: string) =>
			unwrap(
				await client.user.profile[":username"].$get({ param: { username } }),
			),

		uploadAvatar: async (imageData: string) =>
			unwrap(
				await client.user["upload-avatar"].$post({ json: { imageData } }),
			),

		deleteAvatar: async () => unwrap(await client.user.avatar.$delete()),
	},

	// ============== TMDB ==============
	tmdb: {
		getTrending: async (timeWindow: "day" | "week", page?: string) =>
			unwrap(
				await client.tmdb.trending[":timeWindow"].$get({
					param: { timeWindow },
					query: page ? { page } : {},
				}),
			),

		discover: async (
			type: "movie" | "tv",
			options: {
				page?: number | string;
				language?: string;
				region?: string;
				sortBy?: string;
				voteCountGte?: number | string;
				voteAverageGte?: number | string;
				releaseDateGte?: string;
				releaseDateLte?: string;
			} = {},
		) => {
			const dateField =
				type === "movie" ? "primary_release_date" : "first_air_date";
			const stringQuery: Record<string, string> = {};
			if (options.page !== undefined) stringQuery.page = String(options.page);
			if (options.language) stringQuery.language = options.language;
			if (options.region) stringQuery.region = options.region;
			if (options.sortBy) stringQuery.sort_by = options.sortBy;
			if (options.voteCountGte !== undefined)
				stringQuery["vote_count.gte"] = String(options.voteCountGte);
			if (options.voteAverageGte !== undefined)
				stringQuery["vote_average.gte"] = String(options.voteAverageGte);
			if (options.releaseDateGte)
				stringQuery[`${dateField}.gte`] = options.releaseDateGte;
			if (options.releaseDateLte)
				stringQuery[`${dateField}.lte`] = options.releaseDateLte;
			return unwrap(
				await client.tmdb.discover[":type"].$get({
					param: { type },
					query: stringQuery,
				}),
			);
		},

		getGenres: async (type: "movie" | "tv", language?: string) =>
			unwrap(
				await client.tmdb.genre[":type"].list.$get({
					param: { type },
					query: language ? { language } : {},
				}),
			),

		getPopular: async (type: "movie" | "tv", page?: string) =>
			unwrap(
				await client.tmdb[":type"].popular.$get({
					param: { type },
					query: page ? { page } : {},
				}),
			),

		getTopRated: async (type: "movie" | "tv", page?: string) =>
			unwrap(
				await client.tmdb[":type"].top_rated.$get({
					param: { type },
					query: page ? { page } : {},
				}),
			),

		getSimilar: async (type: "movie" | "tv", id: string) =>
			unwrap(
				await client.tmdb[":type"][":id"].similar.$get({
					param: { type, id },
					query: {},
				}),
			),
	},
};
