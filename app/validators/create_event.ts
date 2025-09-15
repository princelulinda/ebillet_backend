import vine from '@vinejs/vine'

export const createEventValidator = vine.compile(
  vine.object({
    name: vine.string().minLength(3),
    description: vine.string(),
    startDate: vine.date(),
    endDate: vine.date().afterField('startDate'),
    bannerImageUrl: vine.string().optional(),
    venueId: vine.number().optional(),
    tagNames: vine.array(vine.string()).optional(),
    categoryId: vine.number().optional(),
  })
)
