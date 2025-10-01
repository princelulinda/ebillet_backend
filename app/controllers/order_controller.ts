import { HttpContext } from '@adonisjs/core/http'

import TicketType from '#models/ticket_type'
import TransportationTicketType from '#models/transportation_ticket_type'
import Order from '#models/order'

import StripeService from '#services/StripeService'
import PawaPayService from '#services/PawaPayService'
import { purchaseTicketsValidator } from '#validators/purchase_tickets'
import { v4 as uuidv4 } from 'uuid'

export default class OrderController {
  async purchase({ request, auth, response, params }: HttpContext) {
    const user = await auth.getUserOrFail()
    const eventId = params.eventId

    const {
      tickets: ticketsToPurchase,
      paymentMethod,
      paymentDetails,
    } = await request.validateUsing(purchaseTicketsValidator)

    // 1. Fetch ticket types and calculate total amount
    let totalAmount = 0
    let currency = ''

    for (const item of ticketsToPurchase) {
      if (item.type === 'event') {
        const eventTicketType = await TicketType.query()
          .where('id', item.id)
          .where('eventId', eventId)
          .first()

        if (!eventTicketType) {
          return response.badRequest({
            message: `Event ticket type with id ${item.id} not found for this event.`,
          })
        }
        if (eventTicketType.availableQuantity < item.quantity) {
          return response.badRequest({
            message: `Not enough event tickets available for ${eventTicketType.name}.`,
          })
        }
        totalAmount += eventTicketType.price * item.quantity
        if (!currency) {
          currency = eventTicketType.currency
        } else if (currency !== eventTicketType.currency) {
          return response.badRequest({
            message: 'Cannot purchase items with different currencies in one order.',
          })
        }
      } else if (item.type === 'transportation') {
        const transportationTicketType = await TransportationTicketType.query()
          .where('id', item.id)
          .first() // Assuming transportation tickets are not strictly tied to eventId for now

        if (!transportationTicketType) {
          return response.badRequest({
            message: `Transportation ticket type with id ${item.id} not found.`,
          })
        }
        if (transportationTicketType.quantity < item.quantity) {
          return response.badRequest({
            message: `Not enough transportation tickets available for ${transportationTicketType.name}.`,
          })
        }
        totalAmount += transportationTicketType.price * item.quantity
        if (!currency) {
          currency = transportationTicketType.currency
        } else if (currency !== transportationTicketType.currency) {
          return response.badRequest({
            message: 'Cannot purchase items with different currencies in one order.',
          })
        }
      } else {
        return response.badRequest({ message: `Invalid item type: ${item.type}` })
      }
    }

    if (!currency) {
      return response.badRequest({
        message: 'No items to purchase or currency could not be determined.',
      })
    }

    // 2. Create a pending order
    const order = await Order.create({
      userId: user.id,
      eventId,
      totalAmount,
      orderNumber: uuidv4(),
      status: 'pending',
      lineItems: ticketsToPurchase,
    })

    // 3. Handle payment
    switch (paymentMethod) {
      case 'stripe': {
        const amountInCents = Math.round(totalAmount * 100)
        const paymentIntent = await StripeService.createPaymentIntent(amountInCents, currency)

        order.paymentIntentId = paymentIntent.id
        await order.save()

        return response.ok({
          clientSecret: paymentIntent.client_secret,
          orderId: order.id,
        })
      }

      case 'pawapay': {
        if (!paymentDetails?.phoneNumber || !paymentDetails?.provider) {
          return response.badRequest({
            message: 'phoneNumber and provider are required for PawaPay',
          })
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

          console.log(pawaPayResponse)
          if (pawaPayResponse.status === 'ACCEPTED') {
            order.status = 'pending'
            await order.save()

            return response.ok({
              message: 'PawaPay deposit completed successfully',
              orderId: order.id,
              depositId,
              pawaPayResponse,
            })
          } else {
            order.status = 'failed'
            await order.save()

            return response.badRequest({
              message: pawaPayResponse.failureReason.failureMessage,
              details: pawaPayResponse,
            })
          }
        } catch (error) {
          console.error(error)
          order.status = 'failed'
          await order.save()

          return response.internalServerError({
            message: 'Error while initiating PawaPay deposit',
            error: error instanceof Error ? error.message : error,
          })
        }
      }

      default:
        return response.badRequest({ message: 'Invalid payment method' })
    }
  }

  async listMyOrders({ auth, request, response }: HttpContext) {
    const user = await auth.getUserOrFail()
    const { status, paymentIntentId } = request.qs()

    const ordersQuery = Order.query()
      .where('userId', user.id)
      .preload('event')
      .preload('tickets')
      .preload('transportationTickets')

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
    const user = await auth.getUserOrFail()
    const orderId = params.id

    if (!orderId) {
      return response.badRequest({ message: 'Order ID is required.' })
    }

    const order = await Order.query()
      .where('id', orderId)
      .andWhere('userId', user.id)
      .preload('event')
      .preload('tickets')
      .preload('transportationTickets')
      .first()
    if (!order) {
      return response.notFound({ message: 'Order not found' })
    }

    return response.ok(order)
  }
}
