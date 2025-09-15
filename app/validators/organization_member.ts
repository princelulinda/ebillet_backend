import vine from '@vinejs/vine'

export const addOrganizationMemberValidator = vine.compile(
  vine.object({
    email: vine.string().email(),
    role: vine.enum(['admin', 'member']),
  })
)

export const updateOrganizationMemberRoleValidator = vine.compile(
  vine.object({
    role: vine.enum(['owner', 'admin', 'member']),
  })
)
