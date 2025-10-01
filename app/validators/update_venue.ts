import vine from '@vinejs/vine'

export const updateVenueValidator = vine.compile(
  vine.object({
    name: vine.string().minLength(3).optional(),
    address: vine.string().optional(),
    city: vine.string().minLength(3).optional(),
    country: vine.string().optional(),
    capacity: vine.number().positive().optional(),
    photoUrl: vine.string().optional(),
  })
)
