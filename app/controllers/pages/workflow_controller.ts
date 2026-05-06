import type { Context } from '@strav/http'
import { renderPage } from '#lib/render_page'

export default class WorkflowController {
  async index(ctx: Context) {
    return renderPage(ctx, 'pages/workflow')
  }
}
