import type { Context } from '@strav/http'
import { validate } from '@strav/http'
import { query, withTenant } from '@strav/database'
import Sprint from '#models/sprint'
import type Workspace from '#models/workspace'
import {
  SprintRules,
  type SprintStoreInput,
  type SprintUpdateInput,
} from '#validators/sprint_validator'

export default class SprintController {
  async index(ctx: Context) {
    const workspaceId = ctx.get<Workspace>('workspace').id
    const projectId = ctx.params.projectId
    const page = Number(ctx.query.get('page')) || 1
    const perPage = Number(ctx.query.get('perPage')) || 100
    return withTenant(workspaceId, async () => {
      let q = query(Sprint).orderBy('createdAt', 'desc')
      if (projectId) q = q.where('projectId', projectId)
      const result = await q.paginate(page, perPage)
      return ctx.json(result)
    })
  }

  async show(ctx: Context) {
    const workspaceId = ctx.get<Workspace>('workspace').id
    return withTenant(workspaceId, async () => {
      const sprint = await Sprint.find(ctx.params.id!)
      if (!sprint) return ctx.json({ error: 'Not Found' }, 404)
      return ctx.json(sprint)
    })
  }

  async store(ctx: Context) {
    const workspaceId = ctx.get<Workspace>('workspace').id
    const projectId = ctx.params.projectId!
    const body = await ctx.body()
    const { data, errors } = validate<SprintStoreInput>(body, SprintRules.store)
    if (errors) return ctx.json({ errors }, 422)

    return withTenant(workspaceId, async () => {
      const sprint = await Sprint.create({ ...data, projectId })
      return ctx.json(sprint, 201)
    })
  }

  async update(ctx: Context) {
    const workspaceId = ctx.get<Workspace>('workspace').id
    const body = await ctx.body()
    const { data, errors } = validate<SprintUpdateInput>(body, SprintRules.update)
    if (errors) return ctx.json({ errors }, 422)

    return withTenant(workspaceId, async () => {
      const sprint = await Sprint.find(ctx.params.id!)
      if (!sprint) return ctx.json({ error: 'Not Found' }, 404)
      sprint.merge(data as Record<string, unknown>)
      await sprint.save()
      return ctx.json(sprint)
    })
  }

  async destroy(ctx: Context) {
    const workspaceId = ctx.get<Workspace>('workspace').id
    return withTenant(workspaceId, async () => {
      const sprint = await Sprint.find(ctx.params.id!)
      if (!sprint) return ctx.json({ error: 'Not Found' }, 404)
      await sprint.forceDelete()
      return ctx.json({ ok: true })
    })
  }
}
