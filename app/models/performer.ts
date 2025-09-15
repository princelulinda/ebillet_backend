import { DateTime } from 'luxon'
import { BaseModel, column, manyToMany } from '@adonisjs/lucid/orm'
import Event from '#models/event'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'

export default class Performer extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare bio: string | null

  @column()
  declare photoUrl: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @manyToMany(() => Event, {
    pivotTable: 'event_performers',
  })
  declare events: ManyToMany<typeof Event>
}
