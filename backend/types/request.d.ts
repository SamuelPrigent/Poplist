declare module '@adonisjs/core/http' {
  interface Request {
    user?: {
      sub: string
      email: string
      username: string
    }
  }
}

export {}
