import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import User from '#models/user'
import TransportationOrganization from '#models/transportation_organization'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class TransportationOrganizationMember extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare transportationOrganizationId: number

  @column()
  declare role: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => TransportationOrganization)
  declare transportationOrganization: BelongsTo<typeof TransportationOrganization>
}
