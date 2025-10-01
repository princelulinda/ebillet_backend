import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'transportation_tickets'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.enum('status', ['valid', 'checked_in', 'cancelled']).defaultTo('valid')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('status')
    })
  }
}
