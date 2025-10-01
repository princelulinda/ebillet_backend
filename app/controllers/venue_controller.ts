import { HttpContext } from '@adonisjs/core/http'
import Venue from '#models/venue'
import { createVenueValidator } from '#validators/create_venue'
import { updateVenueValidator } from '#validators/update_venue'

export default class VenueController {
  async index({ response }: HttpContext) {
    const venues = await Venue.all()
    return response.ok(venues)
  }

  async show({ params, response }: HttpContext) {
    const venue = await Venue.findOrFail(params.id)
    return response.ok(venue)
  }

  async store({ request, response }: HttpContext) {
    const payload = await request.validateUsing(createVenueValidator)
    const venue = await Venue.create(payload)
    return response.created(venue)
  }

  async update({ params, request, response }: HttpContext) {
    const venue = await Venue.findOrFail(params.id)
    const payload = await request.validateUsing(updateVenueValidator)
    venue.merge(payload)
    await venue.save()
    return response.ok(venue)
  }

  async destroy({ params, response }: HttpContext) {
    const venue = await Venue.findOrFail(params.id)
    await venue.delete()
    return response.noContent()
  }
}
