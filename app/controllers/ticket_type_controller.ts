import { HttpContext } from '@adonisjs/core/http'
import TicketType from '#models/ticket_type'
import Event from '#models/event'
import OrganizationMember from '#models/organization_member'
import { createTicketTypesValidator, updateTicketTypeValidator } from '#validators/ticket_type'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

export default class TicketTypeController {
  async index({ response, params }: HttpContext) {
    const eventId = params.eventId
    const ticketTypes = await TicketType.query().where('eventId', eventId)
    return response.ok(ticketTypes)
  }

  async show({ response, params }: HttpContext) {
    const eventId = params.eventId
    const ticketTypeId = params.id
    const ticketType = await TicketType.query()
      .where('eventId', eventId)
      .where('id', ticketTypeId)
      .firstOrFail()
    return response.ok(ticketType)
  }

  async create({ request, auth, response, params }: HttpContext) {
    const user = auth.getUserOrFail()
    const eventId = params.eventId

    const event = await Event.findOrFail(eventId)
    const authUserMembership = await OrganizationMember.query()
      .where('userId', user?.id)
      .where('organizationId', event.organizationId)
      .firstOrFail()

    if (!['owner', 'admin'].includes(authUserMembership.role)) {
      return response.forbidden('You are not authorized to create ticket types for this event.')
    }

    const payload = await createTicketTypesValidator.validate(request.body())

    const createdTicketTypes: TicketType[] = []

    await db.transaction(async (trx) => {
      for (const ticketTypeData of payload) {
        const { saleStartDate, saleEndDate, ...restOfPayload } = ticketTypeData

        const ticketType = new TicketType()
        ticketType.useTransaction(trx)
        ticketType.fill({
          ...restOfPayload,
          eventId: eventId,
          saleStartDate: saleStartDate ? DateTime.fromJSDate(saleStartDate) : null,
          saleEndDate: saleEndDate ? DateTime.fromJSDate(saleEndDate) : null,
        })
        await ticketType.save()
        createdTicketTypes.push(ticketType)
      }
    })

    return response.created(createdTicketTypes)
  }

  async update({ request, auth, response, params }: HttpContext) {
    const user = auth.getUserOrFail()
    const eventId = params.eventId
    const ticketTypeId = params.id

    const event = await Event.findOrFail(eventId)
    const authUserMembership = await OrganizationMember.query()
      .where('userId', user?.id)
      .where('organizationId', event.organizationId)
      .firstOrFail()

    if (!['owner', 'admin'].includes(authUserMembership.role)) {
      return response.forbidden('You are not authorized to update ticket types for this event.')
    }

    const ticketType = await TicketType.query()
      .where('eventId', eventId)
      .where('id', ticketTypeId)
      .firstOrFail()

    const payload = await request.validateUsing(updateTicketTypeValidator)
    const { saleStartDate, saleEndDate, ...restOfPayload } = payload // Add sale dates

    ticketType.merge({
      ...restOfPayload,
      saleStartDate:
        saleStartDate !== undefined ? DateTime.fromJSDate(saleStartDate) : ticketType.saleStartDate,
      saleEndDate:
        saleEndDate !== undefined ? DateTime.fromJSDate(saleEndDate) : ticketType.saleEndDate,
    })
    await ticketType.save()

    return response.ok(ticketType)
  }

  async destroy({ auth, response, params }: HttpContext) {
    const user = auth.getUserOrFail()
    const eventId = params.eventId
    const ticketTypeId = params.id

    // Check if the authenticated user is an owner or admin of the organization that owns the event
    const event = await Event.findOrFail(eventId)
    const authUserMembership = await OrganizationMember.query()
      .where('userId', user?.id)
      .where('organizationId', event.organizationId)
      .firstOrFail()

    if (!['owner', 'admin'].includes(authUserMembership.role)) {
      return response.forbidden('You are not authorized to delete ticket types for this event.')
    }

    const ticketType = await TicketType.query()
      .where('eventId', eventId)
      .where('id', ticketTypeId)
      .firstOrFail()

    await ticketType.delete()

    return response.noContent()
  }

  async getPredefinedTypes({ response }: HttpContext) {
    const predefinedTypes = [
      'Standard',
      'VIP',
      'VVIP',
      'Early Bird',
      'Late Bird',
      'Student',
      'Child',
      'Adult',
      'Senior',
      'Group',
      'Family',
    ]
    return response.ok(predefinedTypes)
  }
}
