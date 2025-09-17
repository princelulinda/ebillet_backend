import type { HttpContext } from '@adonisjs/core/http'
import { cuid } from '@adonisjs/core/helpers'
import app from '@adonisjs/core/services/app'
import { uploadValidator } from '#validators/upload'

export default class UploadController {
  async store({ request, response }: HttpContext) {
    const { file } = await request.validateUsing(uploadValidator)

    const fileName = `${cuid()}.${file.extname}`
    await file.move(app.makePath('public/uploads/general'), {
      name: fileName,
    })

    

    // Construct the full URL
    const protocol = request.protocol()
    const host = request.host()
    const fullUrl = `${protocol}://${host}/uploads/general/${fileName}`

    return response.ok({ url: fullUrl })
  }
}
