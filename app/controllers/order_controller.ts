import { HttpContext } from '@adonisjs/core/http'
import Event from '#models/event'
import TicketType from '#models/ticket_type'
import Order from '#models/order'
import Ticket from '#models/ticket'
import StripeService from '#services/StripeService'
import { purchaseTicketsValidator } from '#validators/purchase_tickets'
import { v4 as uuidv4 } from 'uuid'

export default class OrderController {
  async purchase({ request, auth, response, params }: HttpContext) {
    const user = auth.getUserOrFail()
    const eventId = params.eventId
    const { tickets: ticketsToPurchase } = await request.validateUsing(purchaseTicketsValidator)

    // 1. Fetch ticket types and calculate total amount
    let totalAmount = 0
    const ticketTypeIds = ticketsToPurchase.map((t) => t.ticketTypeId)
    const ticketTypes = await TicketType.query()
      .whereIn('id', ticketTypeIds)
      .where('eventId', eventId)

    // Ensure all requested ticket types were found for the event
    if (ticketTypes.length !== ticketTypeIds.length) {
      return response.badRequest('One or more ticket types are invalid for this event.')
    }

    const ticketTypeMap = new Map(ticketTypes.map((tt) => [tt.id, tt]))

    for (const item of ticketsToPurchase) {
      const ticketType = ticketTypeMap.get(item.ticketTypeId)
      if (!ticketType) {
        // This case is already handled above, but as a safeguard
        return response.badRequest(`Ticket type with id ${item.ticketTypeId} not found.`)
      }
      // Check availability
      if (ticketType.availableQuantity < item.quantity) {
        return response.badRequest(`Not enough tickets available for ${ticketType.name}.`)
      }
      totalAmount += ticketType.price * item.quantity
    }

    // 2. Create a pending order
    const order = await Order.create({
      userId: user.id,
      eventId: eventId,
      totalAmount: totalAmount,
      orderNumber: uuidv4(),
      status: 'pending',
      lineItems: ticketsToPurchase,
    })
    const amountInCents = Math.round(totalAmount * 100)

    const paymentIntent = await StripeService.createPaymentIntent(amountInCents, 'usd')
    order.paymentIntentId = paymentIntent.id
    await order.save()

    return response.ok({
      clientSecret: paymentIntent.client_secret,
      orderId: order.id,
    })
  }

  async listMyOrders({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const { status, paymentIntentId } = request.qs()

    const ordersQuery = Order.query().where('userId', user.id).preload('event').preload('tickets')

    if (paymentIntentId) {
      const order = await ordersQuery.where('paymentIntentId', paymentIntentId).first()
      return order ? response.ok(order) : response.notFound()
    }

    // If not filtering by paymentIntentId, proceed with other filters.
    if (status) {
      ordersQuery.where('status', status)
    }

    const orders = await ordersQuery.orderBy('createdAt', 'desc')

    return response.ok(orders)
  }

  async show({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const orderId = params.id

    const order = await Order.query()
      .where('id', orderId)
      .andWhere('userId', user.id)
      .preload('event')
      .preload('tickets') // Also loading the tickets for this order
      .first()

    if (!order) {
      return response.notFound({ message: 'Order not found' })
    }

    return response.ok(order)
  }
}
