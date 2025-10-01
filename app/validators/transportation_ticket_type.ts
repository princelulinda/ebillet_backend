import vine from '@vinejs/vine'

export const createTransportationTicketTypeValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(3),
    description: vine.string().trim().nullable().optional(),
    price: vine.number().positive(),
    quantity: vine.number().positive(),
  })
)

export const updateTransportationTicketTypeValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(3).optional(),
    description: vine.string().trim().nullable().optional(),
    price: vine.number().positive().optional(),
    quantity: vine.number().positive().optional(),
  })
)
