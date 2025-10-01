import vine from '@vinejs/vine'

export const createScheduleValidator = vine.compile(
  vine.object({
    departureTime: vine.date(),
    arrivalTime: vine.date(),
    vehicleInfo: vine.object({}, { allowUnknownProperties: true }).optional(), // Flexible JSON object
  })
)

export const updateScheduleValidator = vine.compile(
  vine.object({
    departureTime: vine.date().optional(),
    arrivalTime: vine.date().optional(),
    vehicleInfo: vine.object({}, { allowUnknownProperties: true }).optional(),
  })
)
