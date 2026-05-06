import { required, string, email, max, min, type Rule } from '@strav/http'

type RuleSet = Record<string, Rule[]>

export interface UserStoreInput {
  email: string
  name: string
  password: string
}

export interface UserUpdateInput {
  email?: string
  name?: string
  password?: string
}

export const UserRules: Record<'store' | 'update', RuleSet> = {
  store: {
    email: [required(), email(), max(255)],
    name: [required(), string(), max(120)],
    password: [required(), string(), min(8)],
  },
  update: {
    email: [email(), max(255)],
    name: [string(), max(120)],
    password: [string(), min(8)],
  },
}
