import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'routes'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('transportation_organization_id')
        .unsigned()
        .references('id')
        .inTable('transportation_organizations')
        .onDelete('CASCADE')
      table
        .integer('origin_location_id')
        .unsigned()
        .references('id')
        .inTable('locations')
        .onDelete('CASCADE')
      table
        .integer('destination_location_id')
        .unsigned()
        .references('id')
        .inTable('locations')
        .onDelete('CASCADE')
      table.integer('estimated_duration').comment('Duration in minutes')
      table.decimal('distance').comment('Distance in kilometers')
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
