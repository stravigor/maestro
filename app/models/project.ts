import { BaseModel, primary, reference } from '@strav/database'
import type { DateTime } from 'luxon'
import Workflow from './workflow'

export default class Project extends BaseModel {
  static override tenantScoped = true
  static override softDeletes = true

  @primary
  declare id: string

  declare workspaceId: string
  declare name: string
  declare description: string | null
  declare workflowId: string | null
  declare archivedAt: DateTime | null

  declare createdAt: DateTime
  declare updatedAt: DateTime
  declare deletedAt: DateTime | null

  @reference({ model: 'Workflow', foreignKey: 'workflowId', targetPK: 'id' })
  declare workflow: Workflow | null
}
