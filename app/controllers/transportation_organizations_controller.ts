import type { HttpContext } from '@adonisjs/core/http'
import TransportationOrganization from '#models/transportation_organization'
import {
  createTransportationOrganizationValidator,
  updateTransportationOrganizationValidator,
} from '#validators/transportation_organization'

export default class TransportationOrganizationsController {
  /**
   * Display a list of all transportation organizations
   */
  async index({ response }: HttpContext) {
    const organizations = await TransportationOrganization.all()
    return response.ok(organizations)
  }

  /**
   * Display a single transportation organization
   */
  async show({ params, response }: HttpContext) {
    const organization = await TransportationOrganization.findOrFail(params.id)
    return response.ok(organization)
  }

  /**
   * Create a new transportation organization
   */
  async store({ request, response, auth }: HttpContext) {
    const payload = await request.validateUsing(createTransportationOrganizationValidator)
    const user = auth.user!
    const organization = await TransportationOrganization.create({
      ...payload,
      ownerId: user.id,
    })
    return response.created(organization)
  }

  /**
   * Update an existing transportation organization
   */
  async update({ params, request, response, auth }: HttpContext) {
    const organization = await TransportationOrganization.findOrFail(params.id)
    if (organization.ownerId !== auth.user!.id) {
      return response.forbidden('You are not the owner of this organization')
    }
    const payload = await request.validateUsing(updateTransportationOrganizationValidator)
    organization.merge(payload)
    await organization.save()
    return response.ok(organization)
  }

  /**
   * Delete a transportation organization
   */
  async destroy({ params, response, auth }: HttpContext) {
    const organization = await TransportationOrganization.findOrFail(params.id)
    if (organization.ownerId !== auth.user!.id) {
      return response.forbidden('You are not the owner of this organization')
    }
    await organization.delete()
    return response.noContent()
  }
}
