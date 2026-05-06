import { BaseModel, primary, reference } from '@strav/database'
import type { DateTime } from 'luxon'
import Project from './project'

export default class Sprint extends BaseModel {
  static override tenantScoped = true

  @primary
  declare id: string

  declare workspaceId: string
  declare projectId: string
  declare name: string
  declare description: string | null
  declare startedAt: DateTime | null
  declare endedAt: DateTime | null

  declare createdAt: DateTime
  declare updatedAt: DateTime

  @reference({ model: 'Project', foreignKey: 'projectId', targetPK: 'id' })
  declare project: Project
}
