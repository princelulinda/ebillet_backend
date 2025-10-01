import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import User from '#models/user'
import Ticket from '#models/ticket'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Event from '#models/event'
import db from '@adonisjs/lucid/services/db'
import TicketType from '#models/ticket_type'
import TransportationTicket from '#models/transportation_ticket' // New import
import TransportationTicketType from '#models/transportation_ticket_type' // New import
import { json } from 'stream/consumers'

export type LineItem = {
  type: 'event' | 'transportation'
  id: number
  quantity: number
}

export default class Order extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare totalAmount: number

  @column()
  declare orderNumber: string

  @column()
  declare status: 'pending' | 'completed' | 'failed' | 'refunded'

  @column()
  declare paymentIntentId: string | null

  @column()
  declare depositId: string | null

  @column({
    prepare: (value) => {
      if (value) {
        return JSON.stringify(value)
      }
      return value
    },
  })
  declare lineItems: LineItem[] | null

  @column()
  declare userId: number

  @column()
  declare eventId: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Event)
  declare event: BelongsTo<typeof Event>

  @hasMany(() => Ticket)
  declare tickets: HasMany<typeof Ticket>

  @hasMany(() => TransportationTicket)
  declare transportationTickets: HasMany<typeof TransportationTicket>

  static async processPawaPayUpdate(depositId: string, status: string | string[]) {
    let actualStatus: string;

    if (Array.isArray(status)) {
      actualStatus = status[0];
    } else {
      actualStatus = status;
    }

    switch (actualStatus) {
      case 'COMPLETED':
        console.log(actualStatus, 'PPPPPPPPPPP')
        await db.transaction(async (trx) => {
          const order = await Order.query({ client: trx }).where('depositId', depositId).first()

          if (!order) {
            console.error(`Order not found for depositId: ${depositId}`)
            return
          }

          if (order.status !== 'pending') {
            console.log(`Order ${order.id} is not pending, skipping. Status: ${order.status}`, order.status)
            return
          }

          // Update order status
          order.useTransaction(trx)
          order.status = 'completed'
          console.log('update status completed', order.status)
          await order.save()

          if (!order.lineItems) {
            console.error(`Order ${order.id} has no line items.`)
            return
          }

          const eventTicketsToCreate: any[] = []
          const transportationTicketsToCreate: any[] = []

          for (const item of order.lineItems) {
            if (item.type === 'event') {
              const ticketType = await TicketType.findOrFail(item.id, { client: trx })

              // Decrement available quantity
              ticketType.useTransaction(trx)
              ticketType.availableQuantity -= item.quantity
              await ticketType.save()

              // Prepare tickets for creation
              for (let i = 0; i < item.quantity; i++) {
                eventTicketsToCreate.push({
                  orderId: order.id,
                  ticketTypeId: item.id,
                  userId: order.userId,
                  price: ticketType.price,
                  qrCodeHash: `qr_code_placeholder_event_${order.id}_${item.id}_${i}`,
                })
              }
            } else if (item.type === 'transportation') {
              const transportationTicketType = await TransportationTicketType.findOrFail(item.id, {
                client: trx,
              })

              // Decrement available quantity
              transportationTicketType.useTransaction(trx)
              transportationTicketType.quantity -= item.quantity
              await transportationTicketType.save()

              // Prepare tickets for creation
              for (let i = 0; i < item.quantity; i++) {
                transportationTicketsToCreate.push({
                  orderId: order.id,
                  transportationTicketTypeId: item.id,
                  userId: order.userId,
                  price: transportationTicketType.price,
                  qrCodeHash: `qr_code_placeholder_transport_${order.id}_${item.id}_${i}`,
                })
              }
            } else {
              console.error(`Unknown line item type: ${item.type} for order ${order.id}`)
            }
          }

          // Create all tickets at once
          if (eventTicketsToCreate.length > 0) {
            await Ticket.createMany(eventTicketsToCreate, { client: trx })
            console.log(await Ticket.all())
          }
          if (transportationTicketsToCreate.length > 0) {
            await TransportationTicket.createMany(transportationTicketsToCreate, { client: trx })
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
        console.log(`Unhandled PawaPay webhook status ${status}`, status === 'COMPLETED', "le status qui vient>>>", status )
    }
  }
}
