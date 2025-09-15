import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import User from '#models/user'
import Ticket from '#models/ticket'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Event from '#models/event'

export type LineItem = {
  ticketTypeId: number
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
}
