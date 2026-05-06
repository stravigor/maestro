import { defineSchema, t, Archetype } from '@strav/database'

export default defineSchema('user', {
  archetype: Archetype.Entity,
  fields: {
    id: t.bigserial().primaryKey(),
    email: t.varchar(255).email().unique().required(),
    name: t.varchar(120).required(),
    passwordHash: t.text().required(),
    emailVerifiedAt: t.timestamptz().nullable(),
    rememberToken: t.varchar(100).nullable(),
  },
})
