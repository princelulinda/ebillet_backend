import type { HttpContext } from '@adonisjs/core/http'
import Route from '#models/route'
import TransportationOrganization from '#models/transportation_organization'
import { createRouteValidator, updateRouteValidator } from '#validators/route'

export default class RoutesController {
  /**
   * Display a list of all routes for a given organization
   */
  async index({ params, response }: HttpContext) {
    const organization = await TransportationOrganization.findOrFail(
      params.transportationOrganizationId
    )
    const routes = await organization
      .related('routes')
      .query()
      .preload('originLocation')
      .preload('destinationLocation')
    return response.ok(routes)
  }

  /**
   * Display a single route
   */
  async show({ params, response }: HttpContext) {
    const route = await Route.query()
      .where('id', params.id)
      .andWhere('transportationOrganizationId', params.transportationOrganizationId)
      .preload('originLocation')
      .preload('destinationLocation')
      .firstOrFail()
    return response.ok(route)
  }

  /**
   * Create a new route for an organization
   */
  async store({ params, request, response, auth }: HttpContext) {
    const organization = await TransportationOrganization.findOrFail(
      params.transportationOrganizationId
    )
    if (organization.ownerId !== auth.user!.id) {
      return response.forbidden('You are not authorized to create routes for this organization')
    }
    const payload = await request.validateUsing(createRouteValidator)
    const route = await organization.related('routes').create(payload)
    return response.created(route)
  }

  /**
   * Update an existing route
   */
  async update({ params, request, response, auth }: HttpContext) {
    const organization = await TransportationOrganization.findOrFail(
      params.transportationOrganizationId
    )
    if (organization.ownerId !== auth.user!.id) {
      return response.forbidden('You are not authorized to update routes for this organization')
    }
    const route = await Route.query()
      .where('id', params.id)
      .andWhere('transportationOrganizationId', params.transportationOrganizationId)
      .firstOrFail()
    const payload = await request.validateUsing(updateRouteValidator)
    route.merge(payload)
    await route.save()
    return response.ok(route)
  }

  /**
   * Delete a route
   */
  async destroy({ params, response, auth }: HttpContext) {
    const organization = await TransportationOrganization.findOrFail(
      params.transportationOrganizationId
    )
    if (organization.ownerId !== auth.user!.id) {
      return response.forbidden('You are not authorized to delete routes for this organization')
    }
    const route = await Route.query()
      .where('id', params.id)
      .andWhere('transportationOrganizationId', params.transportationOrganizationId)
      .firstOrFail()
    await route.delete()
    return response.noContent()
  }
}
