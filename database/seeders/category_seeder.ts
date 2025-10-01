import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Category from '#models/category'

export default class extends BaseSeeder {
  async run() {
    await Category.query().delete()
    await Category.createMany([
      { name: 'Music', color: '#FF5733', icon: 'Music' },
      { name: 'Sports', color: '#33FF57', icon: 'Trophy' },
      { name: 'Arts', color: '#3357FF', icon: 'Palette' },
      { name: 'Technology', color: '#FF33A1', icon: 'Cpu' },
      { name: 'Food & Drink', color: '#F3FF33', icon: 'GlassWater' },
      { name: 'Education', color: '#33FFF3', icon: 'BookOpen' },
      { name: 'Community', color: '#A133FF', icon: 'Users' },
    ])
  }
}
