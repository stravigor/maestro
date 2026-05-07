import type { Context } from '@strav/http'

export default class AuthPagesController {
  async login(ctx: Context) {
    return ctx.view('pages/login')
  }

  async register(ctx: Context) {
    return ctx.view('pages/register')
  }
}
