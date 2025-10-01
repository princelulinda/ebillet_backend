import vine from '@vinejs/vine'

export const createVenueValidator = vine.compile(
  vine.object({
    name: vine.string().minLength(3),
    address: vine.string().optional(),
    city: vine.string().minLength(3),
    country: vine.string().optional(),
    capacity: vine.number().positive().optional(),
    photoUrl: vine.string().optional(),
  })
)
