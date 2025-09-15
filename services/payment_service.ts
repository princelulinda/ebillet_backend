import { Stripe } from 'stripe'
import stripe from '@vbusatta/adonis-stripe/services/main'

export default class PaymentService {
  constructor() {
    stripe.onEvent('charge.succeeded', this.chargeSucceeded.bind(this))
  }

  private async chargeSucceeded(event: Stripe.Event) {
    const charge = event.data.object as Stripe.Charge
    console.log(`Charge ${charge.id} was successful`)
  }
}
