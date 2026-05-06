import { defineSchema, t, Archetype } from '@strav/database'

export default defineSchema('project', {
  archetype: Archetype.Entity,
  tenanted: true,
  fields: {
    id: t.tenantedBigSerial().primaryKey(),
    name: t.varchar(120).required(),
    description: t.text().nullable(),
    workflow: t.reference('workflow'),
    archivedAt: t.timestamptz().nullable(),
  },
})
