import type { Context } from '@strav/http'
import { renderPage } from '#lib/render_page'

export default class SprintController {
  async index(ctx: Context) {
    return renderPage(ctx, 'pages/sprints')
  }

  /** Sprints kanban scoped to one project (`/projects/:projectId/sprints`). */
  async forProject(ctx: Context) {
    return renderPage(ctx, 'pages/sprints', { projectId: ctx.params.projectId! })
  }
}
