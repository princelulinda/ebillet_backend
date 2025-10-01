import env from '#start/env'

class PawaPayService {
  private pawaPayUrl: string
  private apiKey: string

  constructor() {
    this.pawaPayUrl = env.get('PAWA_PAY_URL_SANDBOX') || ''
    this.apiKey = env.get('PAWA_PAY_KEY') || ''
  }

  async createDeposit(
    depositId: string,
    amount: string,
    currency: string,
    phoneNumber: string,
    provider: string,
    clientReferenceId: string,
    customerMessage: string,
    metadata: any[]
  ) {
    const url = new URL('deposits/', this.pawaPayUrl)
    const response = await fetch(url.href, {
      method: 'POST',
      headers: {
        'Content-Digest': 'quis minim',
        'Signature': 'culpa Excepteur',
        'Signature-Input': 'aute adipisicing qui esse',
        'Accept-Signature': 'eu exercitation',
        'Accept-Digest': 'exercitation ea in laboris',
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        depositId,
        amount,
        currency: 'USD',
        payer: {
          type: 'MMO',
          accountDetails: {
            phoneNumber,
            provider,
          },
        },
        preAuthorisationCode: '3c',
        clientReferenceId,
        customerMessage,
        metadata,
      }),
    })

    if (!response.ok) {
      const r = await response.json()
      console.log(r, provider, phoneNumber, amount, currency, depositId)
      throw new Error('Failed to create deposit with PawaPay')
    }
    return response.json()
  }

  async getActiveConfiguration(country?: string, operationType?: string) {
    const url = new URL('active-conf', this.pawaPayUrl)
    if (country) {
      url.searchParams.append('country', country)
    }
    if (operationType) {
      url.searchParams.append('operationType', operationType)
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    })
    if (!response.ok) {
      const error = await response.json()
      console.log(error)
      throw new Error('Failed to get active configuration from PawaPay')
    }

    return response.json()
  }

  async getDepositStatus(depositId: string) {
    const url = new URL(`/deposits/${depositId}`, this.pawaPayUrl)

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      console.log(error)
      throw new Error('Failed to get deposit status from PawaPay')
    }

    return response.json()
  }
}

export default new PawaPayService()
