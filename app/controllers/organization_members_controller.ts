import { HttpContext } from '@adonisjs/core/http'
import Organization from '#models/organization'
import OrganizationMember from '#models/organization_member'
import User from '#models/user'
import mail from '@adonisjs/mail/services/main'
import {
  addOrganizationMemberValidator,
  updateOrganizationMemberRoleValidator,
} from '#validators/organization_member'

export default class OrganizationMembersController {
  async addMember({ request, response, auth, params }: HttpContext) {
    const user = auth.getUserOrFail()
    const organization = await Organization.findOrFail(params.organizationId)

    // Check if the authenticated user is an owner or admin of the organization
    const authUserMembership = await OrganizationMember.query()
      .where('userId', user?.id)
      .where('organizationId', organization.id)
      .firstOrFail()

    if (!['owner', 'admin'].includes(authUserMembership.role)) {
      return response.forbidden('You are not authorized to add members to this organization.')
    }

    const { email, role } = await request.validateUsing(addOrganizationMemberValidator)

    const memberUser = await User.findBy('email', email)
    if (!memberUser) {
      return response.notFound('User with this email not found.')
    }

    // Check if the user is already a member
    const existingMembership = await OrganizationMember.query()
      .where('userId', memberuser?.id)
      .where('organizationId', organization.id)
      .first()

    if (existingMembership) {
      return response.conflict('User is already a member of this organization.')
    }

    const organizationMember = await OrganizationMember.create({
      userId: memberuser?.id,
      organizationId: organization.id,
      role: role,
    })

    // Send email to the new member
    await mail.send((message) => {
      message
        .to(memberUser.email)
        .from('no-reply@ebillet.com', 'Ebillet App')
        .subject(`You've been added to ${organization.name}!`)
        .htmlView('emails/new_organization_member', {
          member: memberUser,
          organization: organization,
          role: role,
        })
    })

    return response.created(organizationMember)
  }

  async updateMemberRole({ request, response, auth, params }: HttpContext) {
    const user = auth.getUserOrFail()
    const organization = await Organization.findOrFail(params.organizationId)

    // Check if the authenticated user is an owner or admin of the organization
    const authUserMembership = await OrganizationMember.query()
      .where('userId', user?.id)
      .where('organizationId', organization.id)
      .firstOrFail()

    if (!['owner', 'admin'].includes(authUserMembership.role)) {
      return response.forbidden(
        'You are not authorized to update member roles in this organization.'
      )
    }

    const { role } = await request.validateUsing(updateOrganizationMemberRoleValidator)

    const memberId = params.memberId
    const organizationMember = await OrganizationMember.query()
      .where('id', memberId)
      .where('organizationId', organization.id)
      .firstOrFail()

    // Prevent changing the role of the owner if the authenticated user is not the owner
    if (organizationMember.role === 'owner' && authUserMembership.role !== 'owner') {
      return response.forbidden("Only the owner can change the owner's role.")
    }

    organizationMember.role = role
    await organizationMember.save()

    return response.ok(organizationMember)
  }

  async removeMember({ response, auth, params }: HttpContext) {
    const user = auth.getUserOrFail()
    const organization = await Organization.findOrFail(params.organizationId)

    // Check if the authenticated user is an owner or admin of the organization
    const authUserMembership = await OrganizationMember.query()
      .where('userId', user?.id)
      .where('organizationId', organization.id)
      .firstOrFail()

    if (!['owner', 'admin'].includes(authUserMembership.role)) {
      return response.forbidden('You are not authorized to remove members from this organization.')
    }

    const memberId = params.memberId
    const organizationMember = await OrganizationMember.query()
      .where('id', memberId)
      .where('organizationId', organization.id)
      .firstOrFail()

    // Prevent removing the owner if the authenticated user is not the owner
    if (organizationMember.role === 'owner' && authUserMembership.role !== 'owner') {
      return response.forbidden('Only the owner can remove the owner.')
    }

    await organizationMember.delete()

    return response.noContent()
  }

  async listMembers({ response, params }: HttpContext) {
    const organization = await Organization.findOrFail(params.organizationId)

    const members = await OrganizationMember.query()
      .where('organizationId', organization.id)
      .preload('user')

    return response.ok(members)
  }
}
