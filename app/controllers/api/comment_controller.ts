import type { Context } from '@strav/http'
import { validate } from '@strav/http'
import { query, withTenant } from '@strav/database'
import Comment from '#models/comment'
import type Workspace from '#models/workspace'
import {
  CommentRules,
  type CommentStoreInput,
  type CommentUpdateInput,
} from '#validators/comment_validator'

export default class CommentController {
  async index(ctx: Context) {
    const workspaceId = ctx.get<Workspace>('workspace').id
    const storyId = ctx.params.storyId!
    const page = Number(ctx.query.get('page')) || 1
    const perPage = Number(ctx.query.get('perPage')) || 20
    return withTenant(workspaceId, async () => {
      const result = await query(Comment)
        .where('storyId', storyId)
        .orderBy('createdAt', 'asc')
        .paginate(page, perPage)
      return ctx.json(result)
    })
  }

  async show(ctx: Context) {
    const workspaceId = ctx.get<Workspace>('workspace').id
    return withTenant(workspaceId, async () => {
      const comment = await Comment.find(ctx.params.id!)
      if (!comment) return ctx.json({ error: 'Not Found' }, 404)
      return ctx.json(comment)
    })
  }

  async store(ctx: Context) {
    const workspaceId = ctx.get<Workspace>('workspace').id
    const storyId = ctx.params.storyId!
    const authorId = ctx.get<{ id: string }>('user').id
    const body = await ctx.body()
    const { data, errors } = validate<CommentStoreInput>(body, CommentRules.store)
    if (errors) return ctx.json({ errors }, 422)

    return withTenant(workspaceId, async () => {
      const comment = await Comment.create({ ...data, storyId, authorId })
      return ctx.json(comment, 201)
    })
  }

  async update(ctx: Context) {
    const workspaceId = ctx.get<Workspace>('workspace').id
    const body = await ctx.body()
    const { data, errors } = validate<CommentUpdateInput>(body, CommentRules.update)
    if (errors) return ctx.json({ errors }, 422)

    return withTenant(workspaceId, async () => {
      const comment = await Comment.find(ctx.params.id!)
      if (!comment) return ctx.json({ error: 'Not Found' }, 404)
      comment.merge(data as Record<string, unknown>)
      await comment.save()
      return ctx.json(comment)
    })
  }

  async destroy(ctx: Context) {
    const workspaceId = ctx.get<Workspace>('workspace').id
    return withTenant(workspaceId, async () => {
      const comment = await Comment.find(ctx.params.id!)
      if (!comment) return ctx.json({ error: 'Not Found' }, 404)
      await comment.forceDelete()
      return ctx.json({ ok: true })
    })
  }
}
