import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'transportation_organization_members'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table
        .integer('transportation_organization_id')
        .unsigned()
        .references('id')
        .inTable('transportation_organizations')
        .onDelete('CASCADE')
      table.string('role').defaultTo('member').notNullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')

      table.unique(['user_id', 'transportation_organization_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
