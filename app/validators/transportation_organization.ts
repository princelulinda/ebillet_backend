import vine from '@vinejs/vine'

export const createTransportationOrganizationValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(3),
    description: vine.string().trim().nullable(),
    mode: vine.enum(['airline', 'bus_company', 'train_company']),
  })
)

export const updateTransportationOrganizationValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(3).optional(),
    description: vine.string().trim().nullable().optional(),
    mode: vine.enum(['airline', 'bus_company', 'train_company']).optional(),
  })
)
