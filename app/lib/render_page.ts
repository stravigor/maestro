import type { Context } from '@strav/http'

/**
 * Render a page template with the per-request data the layout expects:
 * `workspace` and `projects` (both populated by middleware), plus any
 * extra page-specific values.
 */
export function renderPage(
  ctx: Context,
  template: string,
  extra: Record<string, unknown> = {}
) {
  return ctx.view(template, {
    workspace: ctx.get('workspace'),
    projects: ctx.get('projects'),
    ...extra,
  })
}
