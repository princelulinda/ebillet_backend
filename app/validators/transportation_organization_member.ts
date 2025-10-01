import vine from '@vinejs/vine'

export const addTransportationOrganizationMemberValidator = vine.compile(
  vine.object({
    email: vine.string().email(),
    role: vine.string().trim().optional(), // e.g., 'member', 'admin', 'driver'
  })
)

export const updateTransportationOrganizationMemberValidator = vine.compile(
  vine.object({
    role: vine.string().trim().optional(),
  })
)
