import vine from '@vinejs/vine'

export const createLocationValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(3),
    city: vine.string().trim().minLength(3),
    country: vine.string().trim().minLength(3),
    type: vine.enum(['airport', 'bus_station', 'train_station']),
    code: vine.string().trim().nullable().optional(),
  })
)

export const updateLocationValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(3).optional(),
    city: vine.string().trim().minLength(3).optional(),
    country: vine.string().trim().minLength(3).optional(),
    type: vine.enum(['airport', 'bus_station', 'train_station']).optional(),
    code: vine.string().trim().nullable().optional(),
  })
)
