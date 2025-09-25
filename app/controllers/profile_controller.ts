import { HttpContext } from '@adonisjs/core/http'
import Profile from '#models/profile'
import { updateProfileValidator } from '#validators/update_profile'

export default class ProfileController {
  async update({ request, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(updateProfileValidator)

    const profile = await Profile.findByOrFail('userId', user?.id)
    profile.merge(payload)
    await profile.save()

    return response.ok(profile)
  }
}
