import { defineSchema, t, Archetype } from '@strav/database'

export default defineSchema('story', {
  archetype: Archetype.Component,
  parents: ['project'],
  tenanted: true,
  fields: {
    id: t.tenantedBigSerial().primaryKey(),
    title: t.varchar(200).required(),
    description: t.text().nullable(),
    workflowColumn: t.varchar(200).required(),
    position: t.integer().default(0).required(),
    assignee: t.reference('user').nullable(),
    priority: t.enum(['low', 'med', 'high']).nullable(),
    priorityRationale: t.text().nullable(),
    sprint: t.reference('sprint').nullable(),
    dueAt: t.date().nullable(),
  },
})
