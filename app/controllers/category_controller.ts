import { HttpContext } from '@adonisjs/core/http'
import Category from '#models/category'

export default class CategoryController {
  public async index({ response }: HttpContext) {
    const categories = await Category.query().preload('children').whereNull('parent_id')
    return response.ok(categories)
  }
}
