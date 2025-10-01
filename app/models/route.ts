import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import TransportationOrganization from '#models/transportation_organization'
import Location from '#models/location'
import Schedule from '#models/schedule'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'

export default class Route extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare transportationOrganizationId: number

  @column()
  declare originLocationId: number

  @column()
  declare destinationLocationId: number

  @column()
  declare estimatedDuration: number | null

  @column()
  declare distance: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => TransportationOrganization)
  declare transportationOrganization: BelongsTo<typeof TransportationOrganization>

  @belongsTo(() => Location, {
    foreignKey: 'originLocationId',
  })
  declare originLocation: BelongsTo<typeof Location>

  @belongsTo(() => Location, {
    foreignKey: 'destinationLocationId',
  })
  declare destinationLocation: BelongsTo<typeof Location>

  @hasMany(() => Schedule)
  declare schedules: HasMany<typeof Schedule>
}
