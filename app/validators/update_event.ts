import vine from '@vinejs/vine'

export const updateEventValidator = vine.compile(
  vine.object({
    name: vine.string().minLength(3).optional(),
    description: vine.string().optional(),
    startDate: vine.date().optional(),
    endDate: vine.date().afterField('startDate').optional(),
    bannerImageUrl: vine.string().url().optional(),
    venueId: vine.number().optional(),
    tagNames: vine.array(vine.string()).optional(),
    categoryId: vine.number().optional(),
    status: vine.enum(['draft', 'published', 'cancelled', 'completed']).optional(),
  })
)
