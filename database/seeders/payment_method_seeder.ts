import { BaseSeeder } from '@adonisjs/lucid/seeders'
import PaymentMethod from '#models/payment_method'

export default class extends BaseSeeder {
  async run() {
    await PaymentMethod.updateOrCreate(
      { slug: 'stripe' },
      {
        name: 'Stripe',
        slug: 'stripe',
        description: 'Pay with your card via Stripe.',
        isActive: true,
      }
    )
  }
}
