import type { HttpContext } from '@adonisjs/core/http'
import TransportationOrganization from '#models/transportation_organization'
import TransportationOrganizationMember from '#models/transportation_organization_member'
import User from '#models/user'
import {
  addTransportationOrganizationMemberValidator,
  updateTransportationOrganizationMemberValidator,
} from '#validators/transportation_organization_member'

export default class TransportationOrganizationMembersController {
  /**
   * Display a list of all members for a given transportation organization
   */
  async index({ params, response }: HttpContext) {
    const organization = await TransportationOrganization.findOrFail(
      params.transportationOrganizationId
    )
    const members = await organization.related('members').query().preload('user')
    return response.ok(members)
  }

  /**
   * Display a single member
   */
  async show({ params, response }: HttpContext) {
    const member = await TransportationOrganizationMember.query()
      .where('id', params.id)
      .andWhere('transportationOrganizationId', params.transportationOrganizationId)
      .preload('user')
      .firstOrFail()
    return response.ok(member)
  }

  /**
   * Add a new member to a transportation organization
   */
  async store({ params, request, response, auth }: HttpContext) {
    const organization = await TransportationOrganization.findOrFail(
      params.transportationOrganizationId
    )
    if (organization.ownerId !== auth.user!.id) {
      return response.forbidden('You are not authorized to add members to this organization')
    }
    const payload = await request.validateUsing(addTransportationOrganizationMemberValidator)
    const user = await User.findByOrFail('email', payload.email)

    const member = await organization.related('members').create({
      userId: user.id,
      role: payload.role,
    })
    return response.created(member)
  }

  /**
   * Update an existing member's role
   */
  async update({ params, request, response, auth }: HttpContext) {
    const organization = await TransportationOrganization.findOrFail(
      params.transportationOrganizationId
    )
    if (organization.ownerId !== auth.user!.id) {
      return response.forbidden('You are not authorized to update members of this organization')
    }
    const member = await TransportationOrganizationMember.query()
      .where('id', params.id)
      .andWhere('transportationOrganizationId', params.transportationOrganizationId)
      .firstOrFail()
    const payload = await request.validateUsing(updateTransportationOrganizationMemberValidator)
    member.merge(payload)
    await member.save()
    return response.ok(member)
  }

  /**
   * Remove a member from an organization
   */
  async destroy({ params, response, auth }: HttpContext) {
    const organization = await TransportationOrganization.findOrFail(
      params.transportationOrganizationId
    )
    if (organization.ownerId !== auth.user!.id) {
      return response.forbidden('You are not authorized to remove members from this organization')
    }
    const member = await TransportationOrganizationMember.query()
      .where('id', params.id)
      .andWhere('transportationOrganizationId', params.transportationOrganizationId)
      .firstOrFail()
    await member.delete()
    return response.noContent()
  }
}
