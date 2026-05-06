import Workspace from '#models/workspace'
import type { Middleware, Session } from '@strav/http'

export function workspace(): Middleware {
  return async (ctx, next) => {
    const s = ctx.get<Session>('session')
    const workspaceId = s.get('workspaceId') as number
    if (!workspaceId) {
      return ctx.json({ errors: { workspaceId: ['Workspace ID is required'] } }, 400)
    }
    const workspace = await Workspace.find(workspaceId)
    if (!workspace) {
      return ctx.json({ errors: { workspaceId: ['Workspace ID is invalid'] } }, 400)
    }
    ctx.set('workspace', workspace)
    return next()
  }
}