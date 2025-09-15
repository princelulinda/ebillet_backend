import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'ticket_types'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.renameColumn('quantity', 'available_quantity')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.renameColumn('available_quantity', 'quantity')
    })
  }
}
