import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('users', (table) => {
      table.boolean('is_verified').defaultTo(false).notNullable()
    })

    this.schema.createTable('email_verification_tokens', (table) => {
      table.increments('id')
      table.string('token').notNullable().unique()
      table.timestamp('expires_at').nullable()

      table
        .integer('user_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
        .notNullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.alterTable('users', (table) => {
      table.dropColumn('is_verified')
    })
    this.schema.dropTable('email_verification_tokens')
  }
}
