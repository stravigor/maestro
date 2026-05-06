import type { Context } from '@strav/http'
import { renderPage } from '#lib/render_page'

export default class StoryController {
  async index(ctx: Context) {
    return renderPage(ctx, 'pages/stories')
  }

  /** Stories kanban scoped to one project (`/projects/:projectId/stories`). */
  async forProject(ctx: Context) {
    return renderPage(ctx, 'pages/stories', { projectId: ctx.params.projectId! })
  }

  /** Backlog (stories without a sprint) for one project. */
  async backlog(ctx: Context) {
    return renderPage(ctx, 'pages/backlog', { projectId: ctx.params.projectId! })
  }
}
