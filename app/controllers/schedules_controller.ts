import type { HttpContext } from '@adonisjs/core/http'
import Schedule from '#models/schedule'
import Route from '#models/route'
import TransportationOrganization from '#models/transportation_organization'
import { createScheduleValidator, updateScheduleValidator } from '#validators/schedule'

export default class SchedulesController {
  /**
   * Display a list of all schedules for a given route
   */
  async index({ params, response }: HttpContext) {
    const route = await Route.findOrFail(params.routeId)
    const schedules = await route.related('schedules').query()
    return response.ok(schedules)
  }

  /**
   * Display a single schedule
   */
  async show({ params, response }: HttpContext) {
    const schedule = await Schedule.query()
      .where('id', params.id)
      .andWhere('routeId', params.routeId)
      .firstOrFail()
    return response.ok(schedule)
  }

  /**
   * Create a new schedule for a route
   */
  async store({ params, request, response, auth }: HttpContext) {
    const route = await Route.findOrFail(params.routeId)
    const organization = await TransportationOrganization.findOrFail(
      route.transportationOrganizationId
    )
    if (organization.ownerId !== auth.user!.id) {
      return response.forbidden('You are not authorized to create schedules for this route')
    }
    const payload = await request.validateUsing(createScheduleValidator)
    const schedule = await route.related('schedules').create(payload)
    return response.created(schedule)
  }

  /**
   * Update an existing schedule
   */
  async update({ params, request, response, auth }: HttpContext) {
    const route = await Route.findOrFail(params.routeId)
    const organization = await TransportationOrganization.findOrFail(
      route.transportationOrganizationId
    )
    if (organization.ownerId !== auth.user!.id) {
      return response.forbidden('You are not authorized to update schedules for this route')
    }
    const schedule = await Schedule.query()
      .where('id', params.id)
      .andWhere('routeId', params.routeId)
      .firstOrFail()
    const payload = await request.validateUsing(updateScheduleValidator)
    schedule.merge(payload)
    await schedule.save()
    return response.ok(schedule)
  }

  /**
   * Delete a schedule
   */
  async destroy({ params, response, auth }: HttpContext) {
    const route = await Route.findOrFail(params.routeId)
    const organization = await TransportationOrganization.findOrFail(
      route.transportationOrganizationId
    )
    if (organization.ownerId !== auth.user!.id) {
      return response.forbidden('You are not authorized to delete schedules for this route')
    }
    const schedule = await Schedule.query()
      .where('id', params.id)
      .andWhere('routeId', params.routeId)
      .firstOrFail()
    await schedule.delete()
    return response.noContent()
  }
}
