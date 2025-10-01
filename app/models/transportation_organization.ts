import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import User from '#models/user'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import TransportationOrganizationMember from '#models/transportation_organization_member'
import Route from '#models/route'

export default class TransportationOrganization extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare description: string | null

  @column()
  declare ownerId: number

  @column()
  declare mode: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User, {
    foreignKey: 'ownerId',
  })
  declare owner: BelongsTo<typeof User>

  @hasMany(() => TransportationOrganizationMember)
  declare members: HasMany<typeof TransportationOrganizationMember>

  @hasMany(() => Route)
  declare routes: HasMany<typeof Route>
}
