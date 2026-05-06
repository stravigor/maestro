import { BaseModel, primary, reference } from '@strav/database'
import type { DateTime } from 'luxon'
import Story from './story'
import User from './user'

export default class Comment extends BaseModel {
  static override tenantScoped = true

  @primary
  declare id: string

  declare workspaceId: string
  declare storyId: string
  declare authorId: string
  declare body: string

  declare createdAt: DateTime
  declare updatedAt: DateTime

  @reference({ model: 'Story', foreignKey: 'storyId', targetPK: 'id' })
  declare story: Story

  @reference({ model: 'User', foreignKey: 'authorId', targetPK: 'id' })
  declare author: User
}
