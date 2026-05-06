import { defineSchema, t, Archetype } from '@strav/database'

export default defineSchema('comment', {
  archetype: Archetype.Component,
  parents: ['story'],
  tenanted: true,
  fields: {
    id: t.tenantedBigSerial().primaryKey(),
    author: t.reference('user').required(),
    body: t.text().required(),
  },
})