import vine from '@vinejs/vine'

export const validateTicketValidator = vine.compile(
  vine.object({
    qrCodeHash: vine.string().trim().minLength(1),
    contextType: vine.enum(['event', 'transportation']),
    contextId: vine.number().positive(),
  })
)
