import { BaseModel, primary, cast } from '@strav/database'
import type { DateTime } from 'luxon'

export default class Workflow extends BaseModel {
  static override tenantScoped = true
  static override softDeletes = true

  @primary
  declare id: string

  declare workspaceId: string
  declare name: string
  declare description: string | null

  @cast('json')
  declare columns: string[] | null

  declare createdAt: DateTime
  declare updatedAt: DateTime
  declare deletedAt: DateTime | null
}
