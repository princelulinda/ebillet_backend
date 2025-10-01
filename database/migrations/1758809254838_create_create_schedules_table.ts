import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'schedules'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('route_id').unsigned().references('id').inTable('routes').onDelete('CASCADE')
      table.dateTime('departure_time').notNullable()
      table.dateTime('arrival_time').notNullable()
      table.jsonb('vehicle_info').nullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
