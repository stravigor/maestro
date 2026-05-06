import { defineSchema, t, Archetype } from '@strav/database'

export default defineSchema('workflow', {
  archetype: Archetype.Entity,
  tenanted: true,
  fields: {
    id: t.tenantedBigSerial().primaryKey(),
    name: t.varchar(120).required(),
    description: t.text().nullable(),
    columns: t.jsonb(),
  },
})