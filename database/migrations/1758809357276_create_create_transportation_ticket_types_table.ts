import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'transportation_ticket_types'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('schedule_id')
        .unsigned()
        .references('id')
        .inTable('schedules')
        .onDelete('CASCADE')
      table.string('name').notNullable()
      table.text('description').nullable()
      table.decimal('price', 10, 2).notNullable()
      table.integer('quantity').notNullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
