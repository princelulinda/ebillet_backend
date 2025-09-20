import type { HttpContext } from '@adonisjs/core/http'
import Order from '#models/order'
import Ticket from '#models/ticket'
import TicketType from '#models/ticket_type'
import db from '@adonisjs/lucid/services/db'

export default class PawaPayWebhookController {
  async handleWebhook({ request, response }: HttpContext) {
    const { depositId, status } = request.body()

    if (!depositId || !status) {
      return response.badRequest('Missing depositId or status')
    }

    // Handle the event
    switch (status) {
      case 'COMPLETED':
        await db.transaction(async (trx) => {
          const order = await Order.query({ client: trx })
            .where('depositId', depositId)
            .first()

          if (!order) {
            console.error(`Order not found for depositId: ${depositId}`)
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
      case 'FAILED':
        const orderToUpdate = await Order.findBy('depositId', depositId)
        if (orderToUpdate && orderToUpdate.status === 'pending') {
          orderToUpdate.status = 'failed'
          await orderToUpdate.save()
        }
        break
      default:
        console.log(`Unhandled PawaPay webhook status ${status}`)
    }

    // Return a response to acknowledge receipt of the event
    response.status(200).send({ received: true })
  }
}
