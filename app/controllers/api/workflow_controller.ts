import type { Context } from '@strav/http'
import { validate } from '@strav/http'
import { query, withTenant } from '@strav/database'
import Workflow from '#models/workflow'
import type Workspace from '#models/workspace'
import {
  WorkflowRules,
  type WorkflowStoreInput,
  type WorkflowUpdateInput,
} from '#validators/workflow_validator'

export default class WorkflowController {
  async index(ctx: Context) {
    const workspaceId = ctx.get<Workspace>('workspace').id
    const page = Number(ctx.query.get('page')) || 1
    const perPage = Number(ctx.query.get('perPage')) || 20
    return withTenant(workspaceId, async () => {
      const result = await query(Workflow).orderBy('createdAt', 'desc').paginate(page, perPage)
      return ctx.json(result)
    })
  }

  async show(ctx: Context) {
    const workspaceId = ctx.get<Workspace>('workspace').id
    return withTenant(workspaceId, async () => {
      const workflow = await Workflow.find(ctx.params.id!)
      if (!workflow) return ctx.json({ error: 'Not Found' }, 404)
      return ctx.json(workflow)
    })
  }

  async store(ctx: Context) {
    const workspaceId = ctx.get<Workspace>('workspace').id
    const body = await ctx.body()
    const { data, errors } = validate<WorkflowStoreInput>(body, WorkflowRules.store)
    if (errors) return ctx.json({ errors }, 422)

    return withTenant(workspaceId, async () => {
      const workflow = await Workflow.create(data as unknown as Record<string, unknown>)
      return ctx.json(workflow, 201)
    })
  }

  async update(ctx: Context) {
    const workspaceId = ctx.get<Workspace>('workspace').id
    const body = await ctx.body()
    const { data, errors } = validate<WorkflowUpdateInput>(body, WorkflowRules.update)
    if (errors) return ctx.json({ errors }, 422)

    return withTenant(workspaceId, async () => {
      const workflow = await Workflow.find(ctx.params.id!)
      if (!workflow) return ctx.json({ error: 'Not Found' }, 404)
      workflow.merge(data as Record<string, unknown>)
      await workflow.save()
      return ctx.json(workflow)
    })
  }

  async destroy(ctx: Context) {
    const workspaceId = ctx.get<Workspace>('workspace').id
    return withTenant(workspaceId, async () => {
      const workflow = await Workflow.find(ctx.params.id!)
      if (!workflow) return ctx.json({ error: 'Not Found' }, 404)
      await workflow.delete()
      return ctx.json({ ok: true })
    })
  }
}
