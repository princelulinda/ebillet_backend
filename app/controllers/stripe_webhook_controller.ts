import type { HttpContext } from '@adonisjs/core/http'
import StripeService from '#services/StripeService'
import Order from '#models/order'
import Ticket from '#models/ticket'
import TicketType from '#models/ticket_type'
import stripeConfig from '#config/stripe'
import db from '@adonisjs/lucid/services/db'

export default class StripeWebhookController {
  async handleWebhook({ request, response }: HttpContext) {
    const sig = request.header('stripe-signature')

    // Read the raw body directly from the request stream
    const rawBodyBuffer = await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = []
      request.request.on('data', (chunk: Buffer) => {
        chunks.push(chunk)
      })
      request.request.on('end', () => {
        resolve(Buffer.concat(chunks))
      })
      request.request.on('error', reject)
    })

    if (!sig || !rawBodyBuffer) {
      return response.badRequest('Missing Stripe signature or body')
    }

    let event
    try {
      event = StripeService.constructEvent(rawBodyBuffer, sig, stripeConfig.webhookSecret)
      console.log(`Webhook received: ${event.type}`)
    } catch (err) {
      console.error(`Webhook signature verification failed.`, err.message)
      return response.badRequest(`Webhook Error: ${err.message}`)
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object
        console.log('PaymentIntent was successful!', paymentIntent)

        await db.transaction(async (trx) => {
          const order = await Order.query({ client: trx })
            .where('paymentIntentId', paymentIntent.id)
            .first()

          if (!order) {
            console.error(`Order not found for paymentIntentId: ${paymentIntent.id}`)
            // Return a 200 to Stripe so it doesn't retry, as we can't fix this.
            return
          }

          if (order.status !== 'pending') {
            console.log(`Order ${order.id} is not pending, skipping. Status: ${order.status}`)
            return
          }

          // Update order status
          order.useTransaction(trx)
          order.status = 'completed'
          await order.save()

          if (!order.lineItems) {
            console.error(`Order ${order.id} has no line items.`)
            return
          }

          // Create tickets and update ticket type quantities
          const ticketsToCreate: any[] = []
          for (const item of order.lineItems) {
            const ticketType = await TicketType.findOrFail(item.ticketTypeId, { client: trx })

            // Decrement available quantity
            ticketType.useTransaction(trx)
            ticketType.availableQuantity -= item.quantity
            await ticketType.save()

            // Prepare tickets for creation
            for (let i = 0; i < item.quantity; i++) {
              ticketsToCreate.push({
                orderId: order.id,
                ticketTypeId: item.ticketTypeId,
                userId: order.userId,
                price: ticketType.price,
                qrCodeHash: `qr_code_placeholder_${order.id}_${item.ticketTypeId}_${i}`,
              })
            }
          }

          // Create all tickets at once
          if (ticketsToCreate.length > 0) {
            await Ticket.createMany(ticketsToCreate, { client: trx })
          }
        })

        break
      case 'payment_intent.payment_failed':
        const paymentIntentFailed = event.data.object
        console.log('Payment failed', paymentIntentFailed.last_payment_error?.message)
        const orderToUpdate = await Order.findBy('paymentIntentId', paymentIntentFailed.id)
        if (orderToUpdate && orderToUpdate.status === 'pending') {
          orderToUpdate.status = 'failed'
          await orderToUpdate.save()
        }
        break
      default:
        console.log(`Unhandled event type ${event.type}`)
    }

    // Return a response to acknowledge receipt of the event
    response.status(200).send({ received: true })
  }
}
