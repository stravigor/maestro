import { BaseModel, primary, associate, Collection } from '@strav/database'
import type { DateTime } from 'luxon'
import Workspace from './workspace'

export default class User extends BaseModel {
  static override softDeletes = true

  @primary
  declare id: string

  declare email: string
  declare name: string
  declare passwordHash: string
  declare emailVerifiedAt: DateTime | null
  declare rememberToken: string | null

  declare createdAt: DateTime
  declare updatedAt: DateTime
  declare deletedAt: DateTime | null

  @associate({
    through: 'workspace_user',
    foreignKey: 'user_id',
    otherKey: 'workspace_id',
    model: 'Workspace',
    targetPK: 'id',
  })
  declare workspaces: Collection<Workspace>
}
