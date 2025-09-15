import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Tag from '#models/tag'

export default class extends BaseSeeder {
  async run() {
    await Tag.createMany([
      { name: 'Live' },
      { name: 'Concert' },
      { name: 'Festival' },
      { name: 'Workshop' },
      { name: 'Conference' },
      { name: 'Exhibition' },
      { name: 'Online' },
      { name: 'Family Friendly' },
    ])
  }
}
