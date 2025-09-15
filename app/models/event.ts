import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import Organization from '#models/organization'
import Venue from '#models/venue'
import Review from '#models/review'
import TicketType from '#models/ticket_type'
import Category from '#models/category'
import Performer from '#models/performer'
import Tag from '#models/tag'
import UserInteraction from '#models/user_interaction'

export default class Event extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare description: string

  @column.dateTime()
  declare startDate: DateTime

  @column.dateTime()
  declare endDate: DateTime

  @column()
  declare bannerImageUrl: string | null

  @column()
  declare status: 'draft' | 'published' | 'cancelled' | 'completed'

  @column()
  declare organizationId: number

  @column()
  declare venueId: number | null

  @column()
  declare categoryId: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Organization)
  declare organization: BelongsTo<typeof Organization>

  @belongsTo(() => Venue)
  declare venue: BelongsTo<typeof Venue>

  @belongsTo(() => Category)
  declare category: BelongsTo<typeof Category>

  @manyToMany(() => Tag, {
    pivotTable: 'event_tags',
  })
  declare tags: ManyToMany<typeof Tag>

  @manyToMany(() => Performer, {
    pivotTable: 'event_performers',
  })
  declare performers: ManyToMany<typeof Performer>

  @hasMany(() => Review)
  declare reviews: HasMany<typeof Review>

  @hasMany(() => TicketType)
  declare ticketTypes: HasMany<typeof TicketType>

  @hasMany(() => UserInteraction)
  declare userInteractions: HasMany<typeof UserInteraction>
}
