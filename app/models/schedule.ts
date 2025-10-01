import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import Route from '#models/route'
import TransportationTicketType from '#models/transportation_ticket_type'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'

export default class Schedule extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare routeId: number

  @column.dateTime()
  declare departureTime: DateTime

  @column.dateTime()
  declare arrivalTime: DateTime

  @column({
    serialize: (value) => (value ? JSON.parse(value) : value),
    prepare: (value) => (value ? JSON.stringify(value) : value),
  })
  declare vehicleInfo: object | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Route)
  declare route: BelongsTo<typeof Route>

  @hasMany(() => TransportationTicketType)
  declare transportationTicketTypes: HasMany<typeof TransportationTicketType>
}
