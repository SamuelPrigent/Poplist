/**
 * Types de l'app mobile.
 *
 * Les types API sont des re-exports du SDK généré par Kubb
 * (`shared/src/generated`, dérivé des schémas zod du backend) : plus de
 * duplication manuelle, plus de drift avec le contrat réel.
 *
 * IMPORTANT : `import type` uniquement — résolu par le path `@poplist/shared`
 * du tsconfig, effacé à la compilation. Rien de `shared/` n'entre dans le
 * bundle Metro/EAS.
 */
export type { Content } from './content'
export type { GenreCategory, CategoryInfo } from './categories'

export type {
  User,
  UserProfilePublic,
  Platform,
  WatchlistItem,
  WatchlistOwner,
  Watchlist,
  FullMediaDetails,
} from '@poplist/shared/generated'

import type {
  WatchlistOwner as _WatchlistOwner,
  GetUserProfileByUsernameResponse,
} from '@poplist/shared/generated'

/** Alias sémantique (identique à WatchlistOwner, comme dans shared). */
export type Collaborator = _WatchlistOwner

/** Réponse de GET /user/profile/:username. */
export type UserProfileResponse = GetUserProfileByUsernameResponse
