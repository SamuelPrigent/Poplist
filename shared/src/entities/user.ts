/**
 * User entity — shape JSON renvoyé par les endpoints `/auth/me`, `/auth/login`, etc.
 * Les dates sont des strings ISO (sérialisées par c.json() côté backend).
 */
export interface User {
  id: string;
  email: string;
  username: string | null;
  language: string | null;
  avatarUrl: string | null;
  hasPassword?: boolean;
  createdAt?: string | null;
}

/**
 * Profil public d'un user (vu sur /user/[username]) — sous-ensemble exposé.
 */
export interface UserProfilePublic {
  id: string;
  username: string | null;
  avatarUrl: string | null;
}
