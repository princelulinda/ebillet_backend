import { HttpContext } from '@adonisjs/core/http'

import TicketType from '#models/ticket_type'
import Order from '#models/order'

import StripeService from '#services/StripeService'
import PawaPayService from '#services/PawaPayService'
import { purchaseTicketsValidator } from '#validators/purchase_tickets'
import { v4 as uuidv4 } from 'uuid'

export default class OrderController {
  async purchase({ request, auth, response, params }: HttpContext) {
    const user = auth.getUserOrFail()
    const eventId = params.eventId
    const { tickets: ticketsToPurchase, paymentMethod, paymentDetails } = await request.validateUsing(purchaseTicketsValidator)

    // 1. Fetch ticket types and calculate total amount
    let totalAmount = 0
    let currency = ''
    const ticketTypeIds = ticketsToPurchase.map((t) => t.ticketTypeId)
    const ticketTypes = await TicketType.query()
      .whereIn('id', ticketTypeIds)
      .where('eventId', eventId)

    if (ticketTypes.length !== ticketTypeIds.length) {
      return response.badRequest('One or more ticket types are invalid for this event.')
    }

    const ticketTypeMap = new Map(ticketTypes.map((tt) => [tt.id, tt]))

    for (const item of ticketsToPurchase) {
      const ticketType = ticketTypeMap.get(item.ticketTypeId)
      if (!ticketType) {
        return response.badRequest(`Ticket type with id ${item.ticketTypeId} not found.`)
      }
      if (ticketType.availableQuantity < item.quantity) {
        return response.badRequest(`Not enough tickets available for ${ticketType.name}.`)
      }
      totalAmount += ticketType.price * item.quantity
      if (!currency) {
        currency = ticketType.currency
      }
    }

    // 2. Create a pending order
    const order = await Order.create({
      userId: user?.id,
      eventId: eventId,
      totalAmount: totalAmount,
      orderNumber: uuidv4(),
      status: 'pending',
      lineItems: ticketsToPurchase,
    })

    // 3. Handle payment based on the selected payment method
    switch (paymentMethod) {
      case 'stripe':
        const amountInCents = Math.round(totalAmount * 100)
        const paymentIntent = await StripeService.createPaymentIntent(amountInCents, currency)
        order.paymentIntentId = paymentIntent.id
        await order.save()
        return response.ok({
          clientSecret: paymentIntent.client_secret,
          orderId: order.id,
        })

      case 'pawapay':
        if (!paymentDetails?.phoneNumber || !paymentDetails?.provider) {
          return response.badRequest('phoneNumber and provider are required for PawaPay')
        }

        const depositId = uuidv4()
        order.depositId = depositId
        await order.save()

        try {
          const pawaPayResponse = await PawaPayService.createDeposit(
            depositId,
            totalAmount.toString(),
            currency,
            paymentDetails.phoneNumber,
            paymentDetails.provider
          )

          return response.ok({
            message: 'PawaPay deposit initiated successfully',
            orderId: order.id,
            depositId: depositId,
            pawaPayResponse,
          })
        } catch (error) {
          order.status = 'failed'
          await order.save()
          return response.internalServerError({ message: 'Failed to initiate PawaPay deposit', error: error.message })
        }

      default:
        return response.badRequest('Invalid payment method')
    }
  }

  async listMyOrders({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const { status, paymentIntentId } = request.qs()

    const ordersQuery = Order.query().where('userId', user?.id).preload('event').preload('tickets')

    if (paymentIntentId) {
      const order = await ordersQuery.where('paymentIntentId', paymentIntentId).first()
      return order ? response.ok(order) : response.notFound()
    }

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
      .andWhere('userId', user?.id)
      .preload('event')
      .preload('tickets')
      .first()

    if (!order) {
      return response.notFound({ message: 'Order not found' })
    }

    return response.ok(order)
  }
}