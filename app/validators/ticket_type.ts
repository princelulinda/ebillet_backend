import vine from '@vinejs/vine'

const ticketTypeSchema = vine.object({
  name: vine.string().minLength(3),
  description: vine.string().optional(),
  price: vine.number().min(0), // Allow 0 for free tickets
  currency: vine.string().fixedLength(3),
  availableQuantity: vine.number().positive().min(1),
  maxPerOrder: vine.number().positive().min(1).optional(),
  saleStartDate: vine.date().optional(),
  saleEndDate: vine.date().afterField('saleStartDate').optional(),
})

export const createTicketTypeValidator = vine.compile(ticketTypeSchema)
export const createTicketTypesValidator = vine.compile(vine.array(ticketTypeSchema))

export const updateTicketTypeValidator = vine.compile(
  vine.object({
    name: vine.string().minLength(3).optional(),
    description: vine.string().optional(),
    price: vine.number().positive().optional(),
    availableQuantity: vine.number().positive().min(1).optional(),
    maxPerOrder: vine.number().positive().min(1).optional(),
    saleStartDate: vine.date().optional(),
    saleEndDate: vine.date().afterField('saleStartDate').optional(),
  })
)
