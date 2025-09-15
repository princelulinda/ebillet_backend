import type { HttpContext } from '@adonisjs/core/http'
import Ticket from '#models/ticket'
import UserFollow from '#models/user_follow'
import Organization from '#models/organization'

export default class UserController {
  async listMyTickets({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const tickets = await Ticket.query()
      .where('userId', user.id)
      .preload('order', (orderQuery) => {
        orderQuery.preload('event')
      })
      .preload('ticketType')

    return response.ok(tickets)
  }

  async listFollowedOrganizations({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const followedOrgIds = (
      await UserFollow.query()
        .where('userId', user.id)
        .where('followableType', 'Organization')
        .select('followableId')
    ).map((f) => f.followableId)

    if (followedOrgIds.length === 0) {
      return response.ok([])
    }

    const organizations = await Organization.query().whereIn('id', followedOrgIds)

    return response.ok(organizations)
  }
}
