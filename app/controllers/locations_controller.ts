import type { HttpContext } from '@adonisjs/core/http'
import Location from '#models/location'
import { createLocationValidator, updateLocationValidator } from '#validators/location'

export default class LocationsController {
  /**
   * Display a list of all locations
   */
  async index({ response }: HttpContext) {
    const locations = await Location.all()
    return response.ok(locations)
  }

  /**
   * Display a single location
   */
  async show({ params, response }: HttpContext) {
    const location = await Location.findOrFail(params.id)
    return response.ok(location)
  }

  /**
   * Create a new location
   */
  async store({ request, response }: HttpContext) {
    const payload = await request.validateUsing(createLocationValidator)
    const location = await Location.create(payload)
    return response.created(location)
  }

  /**
   * Update an existing location
   */
  async update({ params, request, response }: HttpContext) {
    const location = await Location.findOrFail(params.id)
    const payload = await request.validateUsing(updateLocationValidator)
    location.merge(payload)
    await location.save()
    return response.ok(location)
  }

  /**
   * Delete a location
   */
  async destroy({ params, response }: HttpContext) {
    const location = await Location.findOrFail(params.id)
    await location.delete()
    return response.noContent()
  }
}
