import type { Context } from '@strav/http'
import { validate } from '@strav/http'
import { query, withTenant } from '@strav/database'
import Story from '#models/story'
import type Workspace from '#models/workspace'
import {
  StoryRules,
  type StoryStoreInput,
  type StoryUpdateInput,
} from '#validators/story_validator'

export default class StoryController {
  async index(ctx: Context) {
    const workspaceId = ctx.get<Workspace>('workspace').id
    const projectId = ctx.params.projectId ?? ctx.query.get('projectId')
    const sprintId = ctx.query.get('sprintId')
    const page = Number(ctx.query.get('page')) || 1
    const perPage = Number(ctx.query.get('perPage')) || 100
    return withTenant(workspaceId, async () => {
      let q = query(Story).orderBy('position', 'asc')
      if (projectId) q = q.where('projectId', projectId)
      if (sprintId) q = q.where('sprintId', sprintId)
      const result = await q.paginate(page, perPage)
      return ctx.json(result)
    })
  }

  async show(ctx: Context) {
    const workspaceId = ctx.get<Workspace>('workspace').id
    return withTenant(workspaceId, async () => {
      const story = await Story.find(ctx.params.id!)
      if (!story) return ctx.json({ error: 'Not Found' }, 404)
      return ctx.json(story)
    })
  }

  async store(ctx: Context) {
    const workspaceId = ctx.get<Workspace>('workspace').id
    const projectId = ctx.params.projectId!
    const body = await ctx.body()
    const { data, errors } = validate<StoryStoreInput>(body, StoryRules.store)
    if (errors) return ctx.json({ errors }, 422)

    return withTenant(workspaceId, async () => {
      const story = await Story.create({ ...data, projectId })
      return ctx.json(story, 201)
    })
  }

  async update(ctx: Context) {
    const workspaceId = ctx.get<Workspace>('workspace').id
    const body = await ctx.body()
    const { data, errors } = validate<StoryUpdateInput>(body, StoryRules.update)
    if (errors) return ctx.json({ errors }, 422)

    return withTenant(workspaceId, async () => {
      const story = await Story.find(ctx.params.id!)
      if (!story) return ctx.json({ error: 'Not Found' }, 404)
      story.merge(data as Record<string, unknown>)
      await story.save()
      return ctx.json(story)
    })
  }

  async destroy(ctx: Context) {
    const workspaceId = ctx.get<Workspace>('workspace').id
    return withTenant(workspaceId, async () => {
      const story = await Story.find(ctx.params.id!)
      if (!story) return ctx.json({ error: 'Not Found' }, 404)
      await story.forceDelete()
      return ctx.json({ ok: true })
    })
  }
}
