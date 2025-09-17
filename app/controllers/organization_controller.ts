import { HttpContext } from '@adonisjs/core/http'
import Organization from '#models/organization'
import { createOrganizationValidator } from '#validators/create_organization'
import OrganizationMember from '#models/organization_member'
import Event from '#models/event'
import Order from '#models/order'
import Ticket from '#models/ticket'
import UserFollow from '#models/user_follow'
import { cuid } from '@adonisjs/core/helpers'
import app from '@adonisjs/core/services/app'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

export default class OrganizationController {
  async create({ request, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const { name, description, logo } = await request.validateUsing(createOrganizationValidator)

    let logoUrl: string | null = null

    if (logo) {
      const fileName = `${cuid()}.${logo.extname}`
      await logo.move(app.makePath('public/uploads/logos'), {
        name: fileName,
      })
      logoUrl = `/uploads/logos/${fileName}`
    }

    const organization = await Organization.create({
      name,
      description: description || null,
      logoUrl,
      ownerId: user.id,
    })

    await OrganizationMember.create({
      userId: user.id,
      organizationId: organization.id,
      role: 'admin',
    })

    return response.created(organization)
  }

  async dashboard({ auth, response, params }: HttpContext) {
    const user = auth.getUserOrFail()
    const { organizationId } = params

    // 1. Authorize
    const authUserMembership = await OrganizationMember.query()
      .where('userId', user.id)
      .where('organizationId', organizationId)
      .firstOrFail()

    if (!['owner', 'admin'].includes(authUserMembership.role)) {
      return response.forbidden(
        'You are not authorized to view the dashboard for this organization.'
      )
    }

    // 2. Get Event IDs for the organization
    const eventIds = (await Event.query().where('organizationId', organizationId).select('id')).map(
      (e) => e.id
    )

    let totalRevenue = 0
    let ticketsSold = 0

    if (eventIds.length > 0) {
      // 3. Calculate Total Revenue from completed orders
      const revenueResult = await Order.query()
        .whereIn('eventId', eventIds)
        .where('status', 'completed')
        .sum('total_amount as revenue')
        .first()
      totalRevenue = Number(revenueResult?.$extras.revenue || 0)

      // 4. Calculate Tickets Sold from completed orders
      const ticketsResult = await Ticket.query()
        .join('orders', 'tickets.order_id', '=', 'orders.id')
        .whereIn('orders.event_id', eventIds) // Filter by eventId on the orders table
        .where('orders.status', 'completed') // Ensure only completed orders are counted
        .count('* as count')
        .first()
      ticketsSold = Number(ticketsResult?.$extras.count || 0)
    }

    // 5. Get total number of events
    const totalEventsResult = await Event.query()
      .where('organizationId', organizationId)
      .count('* as count')
      .first()
    const totalEvents = Number(totalEventsResult?.$extras.count || 0)

    // 6. Assemble dashboard data
    const dashboardData = {
      totalRevenue,
      ticketsSold,
      totalEvents,
    }

    return response.ok(dashboardData)
  }

  async toggleFollow({ auth, response, params }: HttpContext) {
    const user = auth.getUserOrFail()
    const organizationId = params.id

    // Ensure the organization exists before following
    await Organization.findOrFail(organizationId)

    const existingFollow = await UserFollow.query()
      .where('userId', user.id)
      .where('followableId', organizationId)
      .where('followableType', 'Organization')
      .first()

    if (existingFollow) {
      await existingFollow.delete()
      return response.ok({ message: 'Successfully unfollowed.' })
    } else {
      await UserFollow.create({
        userId: user.id,
        followableId: Number(organizationId),
        followableType: 'Organization',
      })
      return response.created({ message: 'Successfully followed.' })
    }
  }

  async listMyOrganizations({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const organizations = await Organization.query().whereIn('id', (subquery) => {
      subquery.from('organization_members').where('user_id', user.id).select('organization_id')
    })

    return response.ok(organizations)
  }

  async getTransactions({ auth, response, params }: HttpContext) {
    const user = auth.getUserOrFail()
    const { organizationId } = params

    // Authorize
    await OrganizationMember.query()
      .where('userId', user.id)
      .where('organizationId', organizationId)
      .firstOrFail()

    // Get event IDs for the organization
    const eventIds = (await Event.query().where('organizationId', organizationId).select('id')).map(
      (e) => e.id
    )

    if (eventIds.length === 0) {
      return response.ok([])
    }

    // Get recent orders
    const orders = await Order.query()
      .whereIn('eventId', eventIds)
      .preload('user')
      .preload('event')
      .orderBy('createdAt', 'desc')
      .limit(10)

    // Format into transactions
    const transactions = orders.map((order) => ({
      id: order.orderNumber,
      amount: order.totalAmount,
      currency: 'usd', // Assuming currency is static for now
      date: order.createdAt.toISO(),
      status: order.status,
      customer: {
        name: order.user.fullName,
        email: order.user.email,
      },
      event: {
        id: order.event.id,
        name: order.event.name,
      },
    }))

    return response.ok(transactions)
  }

  async getRevenueChartData({ auth, response, params }: HttpContext) {
    const user = auth.getUserOrFail()
    const { organizationId } = params

    // Authorize
    await OrganizationMember.query()
      .where('userId', user.id)
      .where('organizationId', organizationId)
      .firstOrFail()

    // Get event IDs for the organization
    const eventIds = (await Event.query().where('organizationId', organizationId).select('id')).map(
      (e) => e.id
    )

    if (eventIds.length === 0) {
      return response.ok({ series: [], categories: [] })
    }

    const sixMonthsAgo = DateTime.now().minus({ months: 6 }).toJSDate()

    // Use the Order model and inject raw expressions for aggregation
    const revenue = await Order.query()
      .select(
        db.raw("TO_CHAR(created_at, 'YYYY-MM') as month"),
        db.raw('SUM(total_amount) as monthly_revenue')
      )
      .whereIn('event_id', eventIds)
      .where('status', 'completed')
      .where('created_at', '>=', sixMonthsAgo)
      .groupByRaw("TO_CHAR(created_at, 'YYYY-MM')")
      .orderBy('month', 'asc')

    // Format for chart
    const categories = revenue.map((r: any) => {
      const [year, month] = r.month.split('-')
      return new Date(Number(year), Number(month) - 1).toLocaleString('default', { month: 'short' })
    })
    const seriesData = revenue.map((r: any) => Number(r.monthly_revenue)) // Ensure it's a number

    const chartData = {
      series: [{ name: 'Revenue', data: seriesData }],
      categories,
    }

    return response.ok(chartData)
  }
}
