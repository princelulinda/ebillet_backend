import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'tickets'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('qr_code_hash').notNullable().unique()
      table.enum('status', ['valid', 'checked_in', 'cancelled']).defaultTo('valid')

      table
        .integer('order_id')
        .unsigned()
        .references('id')
        .inTable('orders')
        .onDelete('CASCADE')
        .notNullable()

      table
        .integer('ticket_type_id')
        .unsigned()
        .references('id')
        .inTable('ticket_types')
        .onDelete('RESTRICT') // Prevent deleting a ticket type if tickets have been sold
        .notNullable()

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
    this.schema.dropTable(this.tableName)
  }
}
