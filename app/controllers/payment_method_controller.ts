import { HttpContext } from '@adonisjs/core/http'
import PaymentMethod from '#models/payment_method'

export default class PaymentMethodController {
  async index({ response }: HttpContext) {
    const paymentMethods = await PaymentMethod.query().where('isActive', true)
    return response.ok(paymentMethods)
  }
}
