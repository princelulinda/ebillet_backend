import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'events'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('name').notNullable()
      table.text('description').notNullable()
      table.timestamp('start_date').notNullable()
      table.timestamp('end_date').notNullable()
      table.string('banner_image_url').nullable()
      table.enum('status', ['draft', 'published', 'cancelled', 'completed']).defaultTo('draft')

      table
        .integer('organization_id')
        .unsigned()
        .references('id')
        .inTable('organizations')
        .onDelete('CASCADE') // An event cannot exist without an organization
        .notNullable()

      table
        .integer('venue_id')
        .unsigned()
        .references('id')
        .inTable('venues')
        .onDelete('SET NULL') // An event can exist without a specific venue
        .nullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
