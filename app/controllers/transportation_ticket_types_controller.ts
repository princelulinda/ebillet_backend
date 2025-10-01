import type { HttpContext } from '@adonisjs/core/http'
import TransportationTicketType from '#models/transportation_ticket_type'
import Schedule from '#models/schedule'
import Route from '#models/route'
import TransportationOrganization from '#models/transportation_organization'
import {
  createTransportationTicketTypeValidator,
  updateTransportationTicketTypeValidator,
} from '#validators/transportation_ticket_type'

export default class TransportationTicketTypesController {
  /**
   * Display a list of all transportation ticket types for a given schedule
   */
  async index({ params, response }: HttpContext) {
    const schedule = await Schedule.findOrFail(params.scheduleId)
    const ticketTypes = await schedule.related('transportationTicketTypes').query()
    return response.ok(ticketTypes)
  }

  /**
   * Display a single transportation ticket type
   */
  async show({ params, response }: HttpContext) {
    const ticketType = await TransportationTicketType.query()
      .where('id', params.id)
      .andWhere('scheduleId', params.scheduleId)
      .firstOrFail()
    return response.ok(ticketType)
  }

  /**
   * Create a new transportation ticket type for a schedule
   */
  async store({ params, request, response, auth }: HttpContext) {
    const schedule = await Schedule.findOrFail(params.scheduleId)
    await schedule.load('route')
    const organization = await TransportationOrganization.findOrFail(
      schedule.route.transportationOrganizationId
    )
    if (organization.ownerId !== auth.user!.id) {
      return response.forbidden('You are not authorized to create ticket types for this schedule')
    }
    const payload = await request.validateUsing(createTransportationTicketTypeValidator)
    const ticketType = await schedule.related('transportationTicketTypes').create(payload)
    return response.created(ticketType)
  }

  /**
   * Update an existing transportation ticket type
   */
  async update({ params, request, response, auth }: HttpContext) {
    const schedule = await Schedule.findOrFail(params.scheduleId)
    await schedule.load('route')
    const organization = await TransportationOrganization.findOrFail(
      schedule.route.transportationOrganizationId
    )
    if (organization.ownerId !== auth.user!.id) {
      return response.forbidden('You are not authorized to update ticket types for this schedule')
    }
    const ticketType = await TransportationTicketType.query()
      .where('id', params.id)
      .andWhere('scheduleId', params.scheduleId)
      .firstOrFail()
    const payload = await request.validateUsing(updateTransportationTicketTypeValidator)
    ticketType.merge(payload)
    await ticketType.save()
    return response.ok(ticketType)
  }

  /**
   * Delete a transportation ticket type
   */
  async destroy({ params, response, auth }: HttpContext) {
    const schedule = await Schedule.findOrFail(params.scheduleId)
    await schedule.load('route')
    const organization = await TransportationOrganization.findOrFail(
      schedule.route.transportationOrganizationId
    )
    if (organization.ownerId !== auth.user!.id) {
      return response.forbidden('You are not authorized to delete ticket types for this schedule')
    }
    const ticketType = await TransportationTicketType.query()
      .where('id', params.id)
      .andWhere('scheduleId', params.scheduleId)
      .firstOrFail()
    await ticketType.delete()
    return response.noContent()
  }
}
