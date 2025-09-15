import vine from '@vinejs/vine'

export const purchaseTicketsValidator = vine.compile(
  vine.object({
    tickets: vine.array(
      vine.object({
        ticketTypeId: vine.number().positive(),
        quantity: vine.number().positive().min(1),
      })
    ),
  })
)
