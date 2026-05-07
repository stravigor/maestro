import type { Middleware, Session } from '@strav/http'
import { Auth } from '@strav/http'

/**
 * Session-guard auth for web pages. Mirrors the behavior of `auth()` from
 * @strav/http but redirects unauthenticated requests to `/login` instead
 * of returning a JSON 401 — JSON makes sense for API clients, not browsers.
 */
export function webAuth(): Middleware {
  return async (ctx, next) => {
    const session = ctx.get<Session>('session')

    if (!session || !session.isAuthenticated || session.isExpired()) {
      return ctx.redirect('/login')
    }

    const user = await Auth.resolveUser(session.userId!)
    if (!user) return ctx.redirect('/login')

    ctx.set('user', user)
    const response = await next()
    await session.touch()
    return response
  }
}
