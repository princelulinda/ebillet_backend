import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'locations'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('name').notNullable()
      table.string('city').notNullable()
      table.string('country').notNullable()
      table.string('type').notNullable() // 'airport', 'bus_station', 'train_station'
      table.string('code').nullable().unique() // IATA code for airports, etc.
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
