import type { HttpContext } from '@adonisjs/core/http'
import Order from '#models/order'

export default class PawaPayWebhookController {
  async handleWebhook({ request, response }: HttpContext) {
    const { depositId, status } = request.body()

    if (!depositId || !status) {
      return response.badRequest('Missing depositId or status')
    }

    await Order.processPawaPayUpdate(depositId, status)

    // Return a response to acknowledge receipt of the event
    response.status(200).send({ received: true })
  }
}
