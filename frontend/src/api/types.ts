import type { InferRequestType, InferResponseType } from "hono/client";
import { client } from "./client";

// ========================================
// Watchlist types — extracted from getPublicWatchlist (returns the canonical FormattedWatchlist)
// ========================================

type GetPublicWatchlistRes = InferResponseType<
	(typeof client.watchlists.public)[":id"]["$get"],
	200
>;

type BaseWatchlist = GetPublicWatchlistRes extends { watchlist: infer W }
	? W
	: never;

// The public Watchlist type that components consume.
// We add the optional flags here because they're added inline by various endpoints
// (getMyWatchlists, getPublicFeatured, getWatchlistById) on top of FormattedWatchlist.
export type Watchlist = BaseWatchlist & {
	isOwner?: boolean;
	isCollaborator?: boolean;
	isSaved?: boolean;
	followersCount?: number;
	libraryPosition?: number;
};

export type WatchlistItem = NonNullable<Watchlist["items"]>[number];
export type Collaborator = NonNullable<Watchlist["collaborators"]>[number];
export type WatchlistOwner = NonNullable<Watchlist["owner"]>;
export type Platform = NonNullable<WatchlistItem["platformList"]>[number];

/**
 * Crée un item placeholder (utilisé pour les updates optimistes côté UI
 * quand on n'a pas encore le retour serveur avec les champs DB générés).
 * Comble les champs DB nullables avec null par défaut.
 */
export function createPlaceholderItem(input: {
	tmdbId: number;
	title?: string | null;
	posterPath?: string | null;
	mediaType: "movie" | "tv";
	platformList?: Platform[];
	runtime?: number | null;
	numberOfSeasons?: number | null;
	numberOfEpisodes?: number | null;
	addedAt?: string | null;
}): WatchlistItem {
	return {
		id: `placeholder-${input.tmdbId}`,
		watchlistId: null,
		position: null,
		tmdbId: input.tmdbId,
		mediaType: input.mediaType,
		title: input.title ?? null,
		posterPath: input.posterPath ?? null,
		backdropPath: null,
		overview: null,
		releaseDate: null,
		voteAverage: null,
		runtime: input.runtime ?? null,
		numberOfSeasons: input.numberOfSeasons ?? null,
		numberOfEpisodes: input.numberOfEpisodes ?? null,
		platformList: input.platformList ?? [],
		addedAt: input.addedAt ?? new Date().toISOString(),
	} as WatchlistItem;
}

// ========================================
// User types — extracted from /auth/me
// ========================================

type MeRes = InferResponseType<typeof client.auth.me.$get, 200>;
export type User = MeRes extends { user: infer U } ? U : never;

// ========================================
// Item details (TMDB enriched)
// ========================================

type GetItemDetailsRes = InferResponseType<
	(typeof client.watchlists.items)[":tmdbId"][":type"]["details"]["$get"],
	200
>;
export type FullMediaDetails = GetItemDetailsRes extends { details: infer D }
	? D
	: never;

// ========================================
// User profile (public)
// ========================================

type UserProfileRes = InferResponseType<
	(typeof client.user.profile)[":username"]["$get"],
	200
>;
export type UserProfileResponse = Extract<UserProfileRes, { user: unknown }>;
export type UserProfilePublic = UserProfileResponse["user"];

// ========================================
// Input types — for POST/PUT bodies (typed via zValidator)
// ========================================

export type CreateWatchlistInput = InferRequestType<
	typeof client.watchlists.$post
>["json"];
export type UpdateWatchlistInput = InferRequestType<
	(typeof client.watchlists)[":id"]["$put"]
>["json"];
export type AddItemInput = InferRequestType<
	(typeof client.watchlists)[":id"]["items"]["$post"]
>["json"];
