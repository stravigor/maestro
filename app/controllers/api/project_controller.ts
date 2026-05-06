import type { Context } from '@strav/http'
import { validate } from '@strav/http'
import { query, withTenant } from '@strav/database'
import Project from '#models/project'
import type Workspace from '#models/workspace'
import {
  ProjectRules,
  type ProjectStoreInput,
  type ProjectUpdateInput,
} from '#validators/project_validator'

export default class ProjectController {
  async index(ctx: Context) {
    const workspaceId = ctx.get<Workspace>('workspace').id
    const page = Number(ctx.query.get('page')) || 1
    const perPage = Number(ctx.query.get('perPage')) || 20
    return withTenant(workspaceId, async () => {
      const result = await query(Project).orderBy('createdAt', 'desc').paginate(page, perPage)
      return ctx.json(result)
    })
  }

  async show(ctx: Context) {
    const workspaceId = ctx.get<Workspace>('workspace').id
    return withTenant(workspaceId, async () => {
      const project = await Project.find(ctx.params.id!)
      if (!project) return ctx.json({ error: 'Not Found' }, 404)
      return ctx.json(project)
    })
  }

  async store(ctx: Context) {
    const workspaceId = ctx.get<Workspace>('workspace').id
    const body = await ctx.body()
    const { data, errors } = validate<ProjectStoreInput>(body, ProjectRules.store)
    if (errors) return ctx.json({ errors }, 422)

    return withTenant(workspaceId, async () => {
      const project = await Project.create(data as unknown as Record<string, unknown>)
      return ctx.json(project, 201)
    })
  }

  async update(ctx: Context) {
    const workspaceId = ctx.get<Workspace>('workspace').id
    const body = await ctx.body()
    const { data, errors } = validate<ProjectUpdateInput>(body, ProjectRules.update)
    if (errors) return ctx.json({ errors }, 422)

    return withTenant(workspaceId, async () => {
      const project = await Project.find(ctx.params.id!)
      if (!project) return ctx.json({ error: 'Not Found' }, 404)
      project.merge(data as Record<string, unknown>)
      await project.save()
      return ctx.json(project)
    })
  }

  async destroy(ctx: Context) {
    const workspaceId = ctx.get<Workspace>('workspace').id
    return withTenant(workspaceId, async () => {
      const project = await Project.find(ctx.params.id!)
      if (!project) return ctx.json({ error: 'Not Found' }, 404)
      await project.delete()
      return ctx.json({ ok: true })
    })
  }
}
