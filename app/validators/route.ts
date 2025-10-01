import vine from '@vinejs/vine'

export const createRouteValidator = vine.compile(
  vine.object({
    originLocationId: vine.number().positive(),
    destinationLocationId: vine.number().positive(),
    estimatedDuration: vine.number().positive().optional(), // in minutes
    distance: vine.number().positive().optional(), // in kilometers
  })
)

export const updateRouteValidator = vine.compile(
  vine.object({
    originLocationId: vine.number().positive().optional(),
    destinationLocationId: vine.number().positive().optional(),
    estimatedDuration: vine.number().positive().optional(),
    distance: vine.number().positive().optional(),
  })
)
