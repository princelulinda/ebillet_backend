import vine from '@vinejs/vine'

export const confirmEmailValidator = vine.compile(
  vine.object({
    email: vine.string().normalizeEmail().email(),
    token: vine.string().uuid(),
  })
)
