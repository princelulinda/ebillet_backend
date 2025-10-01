import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import Route from '#models/route'
import type { HasMany } from '@adonisjs/lucid/types/relations'

export default class Location extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare city: string

  @column()
  declare country: string

  @column()
  declare type: string

  @column()
  declare code: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(() => Route, {
    foreignKey: 'originLocationId',
  })
  declare originRoutes: HasMany<typeof Route>

  @hasMany(() => Route, {
    foreignKey: 'destinationLocationId',
  })
  declare destinationRoutes: HasMany<typeof Route>
}
