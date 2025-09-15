import vine from '@vinejs/vine'

export const registerUserValidator = vine.compile(
  vine.object({
    fullName: vine.string().trim().minLength(3),
    email: vine.string().normalizeEmail().email(),
    password: vine.string().minLength(8),
  })
)
