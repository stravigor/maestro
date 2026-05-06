import type { Middleware } from '@strav/http'
import { query, withTenant } from '@strav/database'
import Project from '#models/project'
import type Workspace from '#models/workspace'

/**
 * Load the workspace's non-archived projects and expose them as
 * `ctx.get('projects')`. The sidebar template reads from this to render
 * the project list with per-project sub-menus.
 */
export function projects(): Middleware {
  return async (ctx, next) => {
    const workspace = ctx.get<Workspace>('workspace')
    const list = await withTenant(workspace.id, async () =>
      query(Project).whereNull('archivedAt').orderBy('name', 'asc').all()
    )
    ctx.set('projects', list)
    // console.log('projects', list)
    return next()
  }
}
