import { BaseModel, primary, reference, associate, Collection } from '@strav/database'
import type { DateTime } from 'luxon'
import User from './user'

export default class Workspace extends BaseModel {
  static override softDeletes = true

  @primary
  declare id: string

  declare slug: string
  declare name: string
  declare ownerId: string

  declare createdAt: DateTime
  declare updatedAt: DateTime
  declare deletedAt: DateTime | null

  @reference({ model: 'User', foreignKey: 'ownerId', targetPK: 'id' })
  declare owner: User

  @associate({
    through: 'workspace_user',
    foreignKey: 'workspace_id',
    otherKey: 'user_id',
    model: 'User',
    targetPK: 'id',
  })
  declare members: Collection<User>
}
