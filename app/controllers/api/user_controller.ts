import type { Context } from '@strav/http'
import { validate } from '@strav/http'
import { query } from '@strav/database'
import User from '#models/user'
import {
  UserRules,
  type UserStoreInput,
  type UserUpdateInput,
} from '#validators/user_validator'

export default class UserController {
  async index(ctx: Context) {
    const page = Number(ctx.query.get('page')) || 1
    const perPage = Number(ctx.query.get('perPage')) || 20
    const result = await query(User).orderBy('createdAt', 'desc').paginate(page, perPage)
    return ctx.json(result)
  }

  async show(ctx: Context) {
    const user = await User.find(ctx.params.id!)
    if (!user) return ctx.json({ error: 'Not Found' }, 404)
    return ctx.json(user)
  }

  async store(ctx: Context) {
    const body = await ctx.body()
    const { data, errors } = validate<UserStoreInput>(body, UserRules.store)
    if (errors) return ctx.json({ errors }, 422)

    const passwordHash = await Bun.password.hash(data.password)
    const user = await User.create({
      email: data.email,
      name: data.name,
      passwordHash,
    })
    return ctx.json(user, 201)
  }

  async update(ctx: Context) {
    const user = await User.find(ctx.params.id!)
    if (!user) return ctx.json({ error: 'Not Found' }, 404)

    const body = await ctx.body()
    const { data, errors } = validate<UserUpdateInput>(body, UserRules.update)
    if (errors) return ctx.json({ errors }, 422)

    const patch: Record<string, unknown> = {}
    if (data.email !== undefined) patch.email = data.email
    if (data.name !== undefined) patch.name = data.name
    if (data.password !== undefined) patch.passwordHash = await Bun.password.hash(data.password)

    user.merge(patch)
    await user.save()
    return ctx.json(user)
  }

  async destroy(ctx: Context) {
    const user = await User.find(ctx.params.id!)
    if (!user) return ctx.json({ error: 'Not Found' }, 404)
    await user.delete()
    return ctx.json({ ok: true })
  }
}
