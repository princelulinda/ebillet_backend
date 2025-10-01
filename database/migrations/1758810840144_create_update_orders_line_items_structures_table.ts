import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'orders'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // This migration documents a change in the expected structure of the 'line_items' JSONB column.
      // Previously, line_items contained objects with { ticketTypeId: number, quantity: number }.
      // Now, line_items will contain objects with { type: 'event' | 'transportation', id: number, quantity: number }.
      // No direct database schema change is required for JSONB columns, but this serves as a record.
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      // Reverting the documentation of the line_items structure change.
    })
  }
}
