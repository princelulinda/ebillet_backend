import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'ticket_types'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('currency', 3).notNullable().alter()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('currency', 3).notNullable().defaultTo('RWF').alter()
    })
  }
}