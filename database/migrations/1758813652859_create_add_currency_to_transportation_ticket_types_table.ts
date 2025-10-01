import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'transportation_ticket_types'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('currency').notNullable().defaultTo('XOF') // Default to XOF, adjust as needed
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('currency')
    })
  }
}
