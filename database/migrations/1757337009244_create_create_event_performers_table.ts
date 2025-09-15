import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'event_performers'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.integer('event_id').unsigned().references('id').inTable('events').onDelete('CASCADE')

      table
        .integer('performer_id')
        .unsigned()
        .references('id')
        .inTable('performers')
        .onDelete('CASCADE')

      table.primary(['event_id', 'performer_id'])

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
