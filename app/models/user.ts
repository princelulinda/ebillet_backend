import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column, hasMany, hasOne } from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import Organization from '#models/organization'
import Review from '#models/review'
import Order from '#models/order'
import Ticket from '#models/ticket'
import UserInteraction from '#models/user_interaction'
import UserFollow from '#models/user_follow'
import EmailVerificationToken from '#models/email_verification_token'
import type { HasMany, HasOne } from '@adonisjs/lucid/types/relations'
import Profile from '#models/profile'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare fullName: string | null

  @column()
  declare email: string

  @column({ serializeAs: null })
  declare password: string

  @column()
  declare isVerified: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  static accessTokens = DbAccessTokensProvider.forModel(User)

  @hasMany(() => Organization)
  declare organizations: HasMany<typeof Organization>

  @hasMany(() => Review)
  declare reviews: HasMany<typeof Review>

  @hasMany(() => Order)
  declare orders: HasMany<typeof Order>

  @hasMany(() => Ticket)
  declare tickets: HasMany<typeof Ticket>

  @hasMany(() => UserInteraction)
  declare userInteractions: HasMany<typeof UserInteraction>

  @hasMany(() => UserFollow)
  declare userFollows: HasMany<typeof UserFollow>

  @hasOne(() => EmailVerificationToken)
  declare emailVerificationToken: HasOne<typeof EmailVerificationToken>

  @hasOne(() => Profile)
  declare profile: HasOne<typeof Profile>
}
