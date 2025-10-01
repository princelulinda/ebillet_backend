import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import Schedule from '#models/schedule'
import TransportationTicket from '#models/transportation_ticket'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'

export default class TransportationTicketType extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare scheduleId: number

  @column()
  declare name: string

  @column()
  declare description: string | null

  @column()
  declare price: number

  @column()
  declare quantity: number

  @column()
  declare currency: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Schedule)
  declare schedule: BelongsTo<typeof Schedule>

  @hasMany(() => TransportationTicket)
  declare transportationTickets: HasMany<typeof TransportationTicket>
}
