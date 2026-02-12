export type { Content } from './content'
export type { GenreCategory, CategoryInfo } from './categories'

export interface User {
  id: string
  email: string
  username: string
  language?: string
  avatarUrl?: string
  roles: string[]
  hasPassword?: boolean
}

export interface Platform {
  name: string
  logoPath: string
}

export interface WatchlistItem {
  tmdbId: number
  title: string
  posterPath: string | null
  mediaType: 'movie' | 'tv'
  platformList: Platform[]
  runtime?: number
  numberOfSeasons?: number
  numberOfEpisodes?: number
  addedAt: string
}

export interface WatchlistOwner {
  id?: string
  email: string
  username?: string
  avatarUrl?: string
  [key: string]: unknown
}

export interface Collaborator {
  id: string
  email: string
  username: string
  avatarUrl?: string
}

export interface UserProfilePublic {
  id: string
  username: string
  avatarUrl?: string
}

export interface UserProfileResponse {
  user: UserProfilePublic
  watchlists: Watchlist[]
  totalPublicWatchlists: number
}

export interface Watchlist {
  id: string
  ownerId: string
  owner?: WatchlistOwner
  name: string
  description?: string
  imageUrl?: string
  thumbnailUrl?: string
  isPublic: boolean
  genres?: string[]
  collaborators: Collaborator[]
  items: WatchlistItem[]
  createdAt: string
  updatedAt: string
  followersCount?: number
  likedBy?: Collaborator[]
  isSaved?: boolean
  isOwner?: boolean
  isCollaborator?: boolean
}

export interface FullMediaDetails {
  tmdbId: string
  title: string
  overview: string
  posterUrl: string
  backdropUrl: string
  releaseDate: string
  runtime?: number
  rating: number
  voteCount: number
  genres: string[]
  cast: Array<{
    name: string
    character: string
    profileUrl: string
  }>
  director?: string
  type: 'movie' | 'tv'
  numberOfSeasons?: number
  numberOfEpisodes?: number
}
