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
    provider: string
  ) {
    const url = new URL('v2/deposits', this.pawaPayUrl)
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        depositId,
        amount,
        currency,
        payer: {
          type: 'MMO',
          accountDetails: {
            phoneNumber,
            provider,
          },
        },
      }),
    })

    if (!response.ok) {
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
      throw new Error( 'Failed to get active configuration from PawaPay')
    }

    return response.json()
  }
}

export default new PawaPayService()
