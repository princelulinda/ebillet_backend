import { HttpContext } from '@adonisjs/core/http'
import Event from '#models/event'
import OrganizationMember from '#models/organization_member'
import { createEventValidator } from '#validators/create_event'
import { updateEventValidator } from '#validators/update_event'
import Ticket from '#models/ticket'
import { DateTime } from 'luxon'
import Tag from '#models/tag'

export default class EventController {
  async index({ auth, response, params }: HttpContext) {
    const user = auth.getUserOrFail()
    const { organizationId } = params

    // 1. Authorize user
    const authUserMembership = await OrganizationMember.query()
      .where('userId', user.id)
      .where('organizationId', organizationId)
      .firstOrFail()

    if (!['owner', 'admin'].includes(authUserMembership.role)) {
      return response.forbidden('You are not authorized to list events for this organization.')
    }

    const events = await Event.query()
      .select('*')
      .where('organizationId', organizationId)
      .preload('organization')
      .preload('venue')
      .preload('category')
      .preload('tags')
      .preload('performers')
      .preload('ticketTypes')

    if (events.length === 0) {
      return response.ok([])
    }

    // 3. Get stats for all events in an efficient way
    const eventIds = events.map((event) => event.id)
    const tickets = await Ticket.query()
      .join('orders', 'tickets.order_id', '=', 'orders.id')
      .whereIn('orders.event_id', eventIds)
      .where('orders.status', 'completed') // Only count tickets from completed orders
      .select('tickets.*', 'orders.event_id as eventId') // Select tickets.* and the event_id from orders

    const statsByEventId = new Map<number, { totalRevenue: number; ticketsSold: number }>()

    for (const ticket of tickets) {
      const stats = statsByEventId.get((ticket as any).eventId) || { totalRevenue: 0, ticketsSold: 0 }
      stats.totalRevenue += ticket.price
      stats.ticketsSold += 1
      statsByEventId.set((ticket as any).eventId, stats)
    }

    // 4. Augment event objects with their stats
    const augmentedEvents = events.map((event) => {
      const stats = statsByEventId.get(event.id) || { totalRevenue: 0, ticketsSold: 0 }
      return {
        ...event.serialize(),
        stats,
      }
    })

    return response.ok(augmentedEvents)
  }

  async show({ auth, response, params }: HttpContext) {
    const user = auth.getUserOrFail()
    const { organizationId, id: eventId } = params

    // 1. Authorize user
    const authUserMembership = await OrganizationMember.query()
      .where('userId', user.id)
      .where('organizationId', organizationId)
      .firstOrFail()

    if (!['owner', 'admin'].includes(authUserMembership.role)) {
      return response.forbidden("You are not authorized to view this event's details.")
    }

    // 2. Get the event and preload relationships
    const event = await Event.query()
      .where('organizationId', organizationId)
      .where('id', eventId)
      .preload('organization')
      .preload('venue')
      .preload('ticketTypes')
      .preload('category')
      .preload('tags')
      .preload('performers')
      .firstOrFail()

    // 3. Get all tickets for the event, preloading related data
    const tickets = await Ticket.query()
      .join('orders', 'tickets.order_id', '=', 'orders.id')
      .where('orders.event_id', eventId)
      .preload('ticketType')
      .select('tickets.*') // Select all columns from the tickets table

    // 4. Calculate stats
    let totalRevenue = 0
    let checkInCount = 0
    const salesByTicketType: { [key: string]: number } = {}

    for (const ticket of tickets) {
      totalRevenue += ticket.price
      if (ticket.status === 'checked_in') {
        checkInCount++
      }
      const typeName = ticket.ticketType.name
      salesByTicketType[typeName] = (salesByTicketType[typeName] || 0) + 1
    }

    const stats = {
      totalRevenue,
      ticketsSold: tickets.length,
      checkInCount,
      salesByTicketType,
    }

    // 5. Combine and return data
    return response.ok({
      event,
      stats,
      tickets,
    })
  }

  async create({ request, auth, response, params }: HttpContext) {
    const user = auth.getUserOrFail()
    const organizationId = params.organizationId

    // Check if the authenticated user is an owner or admin of the organization
    const authUserMembership = await OrganizationMember.query()
      .where('userId', user.id)
      .where('organizationId', organizationId)
      .firstOrFail()

    if (!['owner', 'admin'].includes(authUserMembership.role)) {
      return response.forbidden('You are not authorized to create events for this organization.')
    }

    const payload = await request.validateUsing(createEventValidator)
    const { startDate, endDate, tagNames, categoryId, ...restOfPayload } = payload

    const event = await Event.create({
      ...restOfPayload,
      startDate: DateTime.fromJSDate(startDate),
      endDate: DateTime.fromJSDate(endDate),
      organizationId: organizationId,
      categoryId: categoryId,
    })

    // Handle tags
    if (tagNames && tagNames.length > 0) {
      const tags = await Promise.all(
        tagNames.map((tagName) => Tag.firstOrCreate({ name: tagName }, { name: tagName }))
      )
      const tagIds = tags.map((tag) => tag.id)
      await event.related('tags').sync(tagIds)
    }

    return response.created(event)
  }

  async update({ request, auth, response, params }: HttpContext) {
    const user = auth.getUserOrFail()
    const organizationId = params.organizationId
    const eventId = params.id

    const authUserMembership = await OrganizationMember.query()
      .where('userId', user.id)
      .where('organizationId', organizationId)
      .firstOrFail()

    if (!['owner', 'admin'].includes(authUserMembership.role)) {
      return response.forbidden('You are not authorized to update events for this organization.')
    }

    const event = await Event.query()
      .where('organizationId', organizationId)
      .where('id', eventId)
      .firstOrFail()

    const payload = await request.validateUsing(updateEventValidator)
    const { startDate, endDate, tagNames, categoryId, ...restOfPayload } = payload
    console.log(payload, request.body())

    event.merge({
      ...restOfPayload,
      startDate: startDate ? DateTime.fromJSDate(startDate) : event.startDate,
      endDate: endDate ? DateTime.fromJSDate(endDate) : event.endDate,
      categoryId: categoryId,
    })
    await event.save()

    if (tagNames !== undefined) {
      const tags = await Promise.all(
        tagNames.map((tagName) => Tag.firstOrCreate({ name: tagName }, { name: tagName }))
      )
      const tagIds = tags.map((tag) => tag.id)
      await event.related('tags').sync(tagIds)
    }

    return response.ok(event)
  }

  async destroy({ auth, response, params }: HttpContext) {
    const user = auth.getUserOrFail()
    const organizationId = params.organizationId
    const eventId = params.id

    // Check if the authenticated user is an owner or admin of the organization
    const authUserMembership = await OrganizationMember.query()
      .where('userId', user.id)
      .where('organizationId', organizationId)
      .firstOrFail()

    if (!['owner', 'admin'].includes(authUserMembership.role)) {
      return response.forbidden('You are not authorized to delete events for this organization.')
    }

    const event = await Event.query()
      .where('organizationId', organizationId)
      .where('id', eventId)
      .firstOrFail()

    await event.delete()

    return response.noContent()
  }

  async listAttendees({ auth, response, params }: HttpContext) {
    const user = auth.getUserOrFail()
    const { organizationId, id: eventId } = params

    // 1. Authorize
    const authUserMembership = await OrganizationMember.query()
      .where('userId', user.id)
      .where('organizationId', organizationId)
      .firstOrFail()

    if (!['owner', 'admin'].includes(authUserMembership.role)) {
      return response.forbidden('You are not authorized to view attendees for this event.')
    }

    // 2. Verify event belongs to the organization
    await Event.query().where('id', eventId).where('organizationId', organizationId).firstOrFail()

    // 3. Get Tickets and preload user data via order
    const tickets = await Ticket.query()
      .join('orders', 'tickets.order_id', '=', 'orders.id')
      .where('orders.event_id', eventId)
      .preload('order', (orderQuery) => {
        orderQuery.preload('user', (userQuery) => {
          userQuery.preload('profile')
        })
      })
      .select('tickets.*') // Select all columns from the tickets table

    // 4. Deduplicate and format attendees
    const attendees = new Map()
    for (const ticket of tickets) {
      if (ticket.order && ticket.order.user) {
        const attendeeUser = ticket.order.user
        if (!attendees.has(attendeeUser.id)) {
          attendees.set(attendeeUser.id, {
            id: attendeeUser.id,
            fullName: attendeeUser.fullName,
            email: attendeeUser.email,
            profile: attendeeUser.profile,
          })
        }
      }
    }

    return response.ok(Array.from(attendees.values()))
  }

  async publicIndex({ request, response }: HttpContext) {
    const { name, date_from, date_to, category, tag, city, state, country } = request.qs()

    const query = Event.query()
      .where('status', 'published')
      .preload('organization')
      .preload('venue')
      .preload('category')
      .preload('ticketTypes')

    if (name) {
      query.where('name', 'like', `%${name}%`)
    }

    if (date_from && date_to) {
      query.whereBetween('startDate', [date_from, date_to])
    }

    if (category) {
      query.whereHas('category', (categoryQuery) => {
        categoryQuery.where('name', category)
      })
    }

    if (tag) {
      query.whereHas('tags', (tagQuery) => {
        tagQuery.where('name', tag)
      })
    }

    if (city || state || country) {
      query.whereHas('venue', (venueQuery) => {
        if (city) {
          venueQuery.where('city', 'like', `%${city}%`)
        }
        if (state) {
          venueQuery.where('state', 'like', `%${state}%`)
        }
        if (country) {
          venueQuery.where('country', 'like', `%${country}%`)
        }
      })
    }

    const events = await query.paginate(request.input('page', 1), 10)

    return response.ok(events)
  }

  async publicShow({ response, params }: HttpContext) {
    const event = await Event.query()
      .where('id', params.id)
      .where('status', 'published')
      .preload('organization')
      .preload('venue')
      .preload('ticketTypes')
      .preload('category')
      .preload('tags')
      .preload('performers')
      .firstOrFail()

    return response.ok(event)
  }
}