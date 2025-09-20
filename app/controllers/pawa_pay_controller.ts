import { HttpContext } from '@adonisjs/core/http'
import PawaPayService from '#services/PawaPayService'
import Transaction from '#models/transaction'
import { v4 as uuidv4 } from 'uuid'

export default class PawaPayController {
  async getActiveConfiguration({ request, response }: HttpContext) {
    const { country, operationType } = request.qs()
    try {
      const config = await PawaPayService.getActiveConfiguration(country, operationType)
      return response.ok(config)
    } catch (error) {
      return response.internalServerError({ message: 'Failed to get active configuration', error: error.message })
    }
  }

  async createDeposit({ request, response, auth }: HttpContext) {
    const { amount, currency, phoneNumber, provider, orderId } = request.body()

    if (!amount || !currency || !phoneNumber || !provider || !orderId) {
      return response.badRequest({ message: 'Missing required fields' })
    }

    const user = auth.user!
    const depositId = uuidv4()

    const transaction = await Transaction.create({
      userId: user.id,
      orderId,
      amount,
      currency,
      status: 'pending',
      provider: 'pawapay',
      providerTransactionId: depositId,
    })

    try {
      const pawaPayResponse = await PawaPayService.createDeposit(
        depositId,
        amount,
        currency,
        phoneNumber,
        provider
      )

      return response.ok({
        message: 'Deposit initiated successfully',
        transaction,
        pawaPayResponse,
      })
    } catch (error) {
      transaction.status = 'failed'
      await transaction.save()
      return response.internalServerError({ message: 'Failed to create deposit', error: error.message })
    }
  }
}