import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'profiles'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.renameColumn('avatar', 'avatar_url')
      table.string('phone_number').nullable()
      table.string('address').nullable()
      table.string('city').nullable()
      table.string('state').nullable()
      table.string('country').nullable()
      table.string('zip_code').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.renameColumn('avatar_url', 'avatar')
      table.dropColumn('phone_number')
      table.dropColumn('address')
      table.dropColumn('city')
      table.dropColumn('state')
      table.dropColumn('country')
      table.dropColumn('zip_code')
    })
  }
}
