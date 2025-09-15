import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import Event from '#models/event'
import type { HasMany } from '@adonisjs/lucid/types/relations'

export default class Venue extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare address: string | null

  @column()
  declare city: string

  @column()
  declare country: string | null

  @column()
  declare capacity: number | null

  @column()
  declare photoUrl: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @hasMany(() => Event)
  declare events: HasMany<typeof Event>
}
