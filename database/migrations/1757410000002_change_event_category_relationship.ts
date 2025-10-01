import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'events' // This migration will alter the events table

  async up() {
    // 1. Drop the event_categories pivot table
    this.schema.dropTable('event_categories')

    // 2. Add category_id to the events table
    this.schema.alterTable(this.tableName, (table) => {
      table
        .integer('category_id')
        .unsigned()
        .references('id')
        .inTable('categories')
        .onDelete('SET NULL')
        .nullable()
      // Using SET NULL and nullable() because existing events might not have a category,
      // or if a category is deleted, events should not be deleted.
      // If category is mandatory, change to .notNullable() and handle existing data.
    })
  }

  async down() {
    // Revert changes in reverse order
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('category_id')
    })

    // Recreate the event_categories pivot table (simplified, without original columns if any)
    this.schema.createTable('event_categories', (table) => {
      table.increments('id')
      table.integer('event_id').unsigned().references('id').inTable('events').onDelete('CASCADE')
      table
        .integer('category_id')
        .unsigned()
        .references('id')
        .inTable('categories')
        .onDelete('CASCADE')
      table.unique(['event_id', 'category_id'])
    })
  }
}
