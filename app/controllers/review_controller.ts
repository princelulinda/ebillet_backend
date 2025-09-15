import type { HttpContext } from '@adonisjs/core/http'
import Review from '#models/review'
import Ticket from '#models/ticket'
import { createReviewValidator } from '#validators/create_review'

export default class ReviewController {
  async index({ response, params }: HttpContext) {
    const eventId = params.id
    const reviews = await Review.query()
      .where('eventId', eventId)
      .preload('user', (userQuery) => {
        userQuery.preload('profile')
      })
    return response.ok(reviews)
  }

  async store({ auth, request, response, params }: HttpContext) {
    const user = auth.getUserOrFail()
    const eventId = params.id
    const payload = await request.validateUsing(createReviewValidator)

    // Business logic: Check if user has a ticket for this event
    const hasTicket = await Ticket.query()
      .where('userId', user.id)
      .whereHas('order', (orderQuery) => {
        orderQuery.where('eventId', eventId)
      })
      .first()

    if (!hasTicket) {
      return response.forbidden('You can only review events for which you have a ticket.')
    }

    // Check if user has already reviewed this event
    const existingReview = await Review.query()
      .where('userId', user.id)
      .where('eventId', eventId)
      .first()

    if (existingReview) {
      return response.conflict('You have already reviewed this event.')
    }

    const review = await Review.create({
      ...payload,
      userId: user.id,
      eventId: Number(eventId),
    })

    return response.created(review)
  }
}
