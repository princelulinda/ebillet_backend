import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import Event from '#models/event'
import Ticket from '#models/ticket'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'

export default class TicketType extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare description: string | null

  @column()
  declare price: number

  @column()
  declare availableQuantity: number

  @column()
  declare maxPerOrder: number | null

  @column.dateTime()
  declare saleStartDate: DateTime | null

  @column.dateTime()
  declare saleEndDate: DateTime | null

  @column()
  declare eventId: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Event)
  declare event: BelongsTo<typeof Event>

  @hasMany(() => Ticket)
  declare tickets: HasMany<typeof Ticket>
}
