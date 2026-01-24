import vine from '@vinejs/vine'

export const signupValidator = vine.compile(
  vine.object({
    email: vine.string().email().maxLength(255),
    password: vine.string().minLength(8).maxLength(100),
  })
)

export const loginValidator = vine.compile(
  vine.object({
    email: vine.string().email(),
    password: vine.string(),
  })
)

export const updateUsernameValidator = vine.compile(
  vine.object({
    username: vine
      .string()
      .minLength(3)
      .maxLength(20)
      .regex(/^[a-zA-Z0-9_]+$/),
  })
)

export const updateLanguageValidator = vine.compile(
  vine.object({
    language: vine.enum(['fr', 'en', 'de', 'es', 'it', 'pt']),
  })
)

export const changePasswordValidator = vine.compile(
  vine.object({
    oldPassword: vine.string(),
    newPassword: vine.string().minLength(8).maxLength(100),
  })
)

export const deleteAccountValidator = vine.compile(
  vine.object({
    confirmation: vine.literal('confirmer'),
  })
)

export const setTokensValidator = vine.compile(
  vine.object({
    accessToken: vine.string(),
    refreshToken: vine.string(),
  })
)
