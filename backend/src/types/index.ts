export interface AuthUser {
  sub: string
  email: string
  roles: string[]
}

export interface Platform {
  name: string
  logoPath: string
}
