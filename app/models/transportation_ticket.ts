import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import Order from '#models/order'
import TransportationTicketType from '#models/transportation_ticket_type'
import User from '#models/user'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class TransportationTicket extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare orderId: number

  @column()
  declare transportationTicketTypeId: number

  @column()
  declare userId: number

  @column()
  declare seatNumber: string | null

  @column()
  declare qrCodeHash: string | null

  @column()
  declare status: 'valid' | 'checked_in' | 'cancelled'

  @column()
  declare price: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Order)
  declare order: BelongsTo<typeof Order>

  @belongsTo(() => TransportationTicketType)
  declare transportationTicketType: BelongsTo<typeof TransportationTicketType>

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}
