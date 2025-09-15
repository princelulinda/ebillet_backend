import Stripe from 'stripe'
import stripeConfig from '#config/stripe'

class StripeService {
  private stripe: Stripe

  constructor() {
    this.stripe = new Stripe(stripeConfig.secretKey)
  }

  async createPaymentIntent(amount: number, currency: string) {
    return this.stripe.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: {
        enabled: true,
      },
    })
  }

  constructEvent(payload: Buffer, sig: string, secret: string) {
    return this.stripe.webhooks.constructEvent(payload, sig, secret)
  }
}

export default new StripeService()
