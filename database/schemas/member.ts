import { defineAssociation } from '@strav/database'

export default defineAssociation(['workspace', 'user'], {
  as: { workspace: 'members', user: 'workspaces' },
  fields: {},
})