import vine from '@vinejs/vine'

export const createReviewValidator = vine.compile(
  vine.object({
    rating: vine.number().min(1).max(5),
    comment: vine.string().optional(),
  })
)
