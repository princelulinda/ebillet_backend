import vine from '@vinejs/vine'

export const updateProfileValidator = vine.compile(
  vine.object({
    bio: vine.string().optional(),
    avatarUrl: vine.string().url().optional(),
    phoneNumber: vine.string().optional(),
    address: vine.string().optional(),
    city: vine.string().optional(),
    state: vine.string().optional(),
    country: vine.string().optional(),
    zipCode: vine.string().optional(),
  })
)
