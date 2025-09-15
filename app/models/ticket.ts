import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import Order from '#models/order'
import TicketType from '#models/ticket_type'
import User from '#models/user'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class Ticket extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare qrCodeHash: string

  @column()
  declare status: 'valid' | 'checked_in' | 'cancelled'

  @column()
  declare price: number

  @column()
  declare orderId: number

  @column()
  declare ticketTypeId: number

  @column()
  declare userId: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Order)
  declare order: BelongsTo<typeof Order>

  @belongsTo(() => TicketType)
  declare ticketType: BelongsTo<typeof TicketType>

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}
