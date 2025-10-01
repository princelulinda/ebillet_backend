import { HttpContext } from '@adonisjs/core/http'
import PawaPayService from '#services/PawaPayService'
import Transaction from '#models/transaction'
import { v4 as uuidv4 } from 'uuid'
import Order from '#models/order'

export default class PawaPayController {
  async getActiveConfiguration({ request, response }: HttpContext) {
    const { country, operationType } = request.qs()
    try {
      const config = await PawaPayService.getActiveConfiguration(country, operationType)
      return response.ok(config)
    } catch (error) {
      console.log(error.response)
      return response.internalServerError({
        message: 'Failed to get active configuration',
        error: error.message,
      })
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
      userId: user?.id,
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
      console.log(pawaPayResponse)

      return response.ok({
        message: 'Deposit initiated successfully',
        transaction,
        pawaPayResponse,
      })
    } catch (error) {
      console.log(error, 'YYYYYYYYYYYYYYYYYY')
      await transaction.delete()
      transaction.status = 'failed'
      await transaction.save()
      return response.internalServerError({
        message: 'Failed to create deposit',
        error: error.message,
      })
    }
  }

  async verifyDeposit({ params, response }: HttpContext) {
    const { depositId } = params

    if (!depositId) {
      return response.badRequest({ message: 'Missing depositId' })
    }

    try {
      const pawaPayDeposit = await PawaPayService.getDepositStatus(depositId)
      console.log(pawaPayDeposit)

      const status = pawaPayDeposit.map(
        (deposit) => deposit.depositId === depositId && deposit.status
      )

      if (!status) {
        console.log(pawaPayDeposit, status, 'status')
        return response.badRequest({ message: 'Could not retrieve status from PawaPay' })
      }

      // Use the centralized logic to process the update
      await Order.processPawaPayUpdate(depositId, status)

      // Fetch the updated order to return it
      const updatedOrder = await Order.findBy('depositId', depositId)

      return response.ok({
        message: `Verification processed. Status is now: ${updatedOrder?.status}`,
        order: updatedOrder,
      })
    } catch (error) {
      console.error('Error verifying PawaPay deposit:', error)
      return response.internalServerError({
        message: 'Failed to verify deposit',
        error: error.message,
      })
    }
  }
}
