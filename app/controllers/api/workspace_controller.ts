import type { Context } from '@strav/http'
import { validate } from '@strav/http'
import { query } from '@strav/database'
import Workspace from '#models/workspace'
import {
  WorkspaceRules,
  type WorkspaceStoreInput,
  type WorkspaceUpdateInput,
} from '#validators/workspace_validator'

export default class WorkspaceController {
  async index(ctx: Context) {
    const page = Number(ctx.query.get('page')) || 1
    const perPage = Number(ctx.query.get('perPage')) || 20
    const result = await query(Workspace).orderBy('createdAt', 'desc').paginate(page, perPage)
    return ctx.json(result)
  }

  async show(ctx: Context) {
    const workspace = await Workspace.find(ctx.params.id!)
    if (!workspace) return ctx.json({ error: 'Not Found' }, 404)
    return ctx.json(workspace)
  }

  async store(ctx: Context) {
    const body = await ctx.body()
    const { data, errors } = validate<WorkspaceStoreInput>(body, WorkspaceRules.store)
    if (errors) return ctx.json({ errors }, 422)

    const ownerId = ctx.get<{ id: string }>('user').id
    const workspace = await Workspace.create({ ...data, ownerId })
    return ctx.json(workspace, 201)
  }

  async update(ctx: Context) {
    const workspace = await Workspace.find(ctx.params.id!)
    if (!workspace) return ctx.json({ error: 'Not Found' }, 404)

    const body = await ctx.body()
    const { data, errors } = validate<WorkspaceUpdateInput>(body, WorkspaceRules.update)
    if (errors) return ctx.json({ errors }, 422)

    workspace.merge(data as Record<string, unknown>)
    await workspace.save()
    return ctx.json(workspace)
  }

  async destroy(ctx: Context) {
    const workspace = await Workspace.find(ctx.params.id!)
    if (!workspace) return ctx.json({ error: 'Not Found' }, 404)
    await workspace.delete()
    return ctx.json({ ok: true })
  }
}
