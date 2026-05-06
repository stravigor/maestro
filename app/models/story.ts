import { BaseModel, primary, reference } from '@strav/database'
import type { DateTime } from 'luxon'
import Project from './project'
import User from './user'
import Sprint from './sprint'

export type StoryPriority = 'low' | 'med' | 'high'

export default class Story extends BaseModel {
  static override tenantScoped = true

  @primary
  declare id: string

  declare workspaceId: string
  declare projectId: string
  declare sprintId: string | null
  declare title: string
  declare description: string | null
  declare workflowColumn: string
  declare position: number
  declare assigneeId: string | null
  declare priority: StoryPriority | null
  declare priorityRationale: string | null
  declare dueAt: DateTime | null

  declare createdAt: DateTime
  declare updatedAt: DateTime

  @reference({ model: 'Project', foreignKey: 'projectId', targetPK: 'id' })
  declare project: Project

  @reference({ model: 'User', foreignKey: 'assigneeId', targetPK: 'id' })
  declare assignee: User | null

  @reference({ model: 'Sprint', foreignKey: 'sprintId', targetPK: 'id' })
  declare sprint: Sprint | null
}
