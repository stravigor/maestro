import { defineSchema, t, Archetype } from '@strav/database'

export default defineSchema('workspace', {
  archetype: Archetype.Entity,
  tenantRegistry: true,
  fields: {
    id: t.bigserial().primaryKey(),
    slug: t.varchar(255).unique().required(),
    name: t.varchar(255).required(),
    owner: t.reference('user').required(),
  },
})