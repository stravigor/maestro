import { defineSchema, t, Archetype } from '@strav/database'

export default defineSchema('sprint', {
  archetype: Archetype.Component,
  parents: ['project'],
  tenanted: true,
  fields: {
    id: t.tenantedBigSerial().primaryKey(),
    name: t.varchar(120).required(),
    description: t.text().nullable(),
    startedAt: t.date().nullable(),
    endedAt: t.date().nullable(),
  },
})
