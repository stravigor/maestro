import type { Context } from '@strav/http'
import { Session } from '@strav/http'
import { validate } from '@strav/http'
import { AuthRules, type LoginInput } from '#validators/auth_validator'
import { query } from '@strav/database'
import User from '#models/user'
import Workspace from '#models/workspace'

export default class AuthController {
  /**
   * Login
   */
  async login(ctx: Context) {
    const body = await ctx.body()
    const { data, errors } = validate<LoginInput>(body, AuthRules.login)
    if (errors) {
      return ctx.json({ errors }, 422)
    }

    const user = await query(User).where('email', data.email).first()
    const ok = user && await Bun.password.verify(data.password, user.passwordHash)
    if (!ok) {
      return ctx.json({ errors: { password: ['Invalid password'] } }, 401)
    }

    const s = ctx.get<Session>('session')
    s.authenticate(user)

    let workspace = await query(Workspace).where('ownerId', user.id).first()
    s.set('workspaceId', workspace?.id)
  
    return ctx.json({ id: user.id })
  }

  /**
   * Logout the current user session
   */
  async logout(ctx: Context) {
    return Session.destroy(ctx, ctx.redirect('/login'))
  }
}