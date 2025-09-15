import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'ticket_types'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('max_per_order').unsigned().nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('max_per_order')
    })
  }
}
