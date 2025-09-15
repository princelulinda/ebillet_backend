import vine from '@vinejs/vine'

export const createOrganizationValidator = vine.compile(
  vine.object({
    name: vine.string().minLength(3),
    description: vine.string().optional(),
    logo: vine
      .file({
        size: '2mb',
        extnames: ['jpg', 'png', 'gif'],
      })
      .optional(),
  })
)
