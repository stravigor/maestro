import { required, string, max, type Rule } from '@strav/http'

type RuleSet = Record<string, Rule[]>

export interface SprintStoreInput {
  name: string
  description?: string | null
  startedAt?: string | null
  endedAt?: string | null
}

export interface SprintUpdateInput {
  name?: string
  description?: string | null
  startedAt?: string | null
  endedAt?: string | null
}

export const SprintRules: Record<'store' | 'update', RuleSet> = {
  store: {
    name: [required(), string(), max(120)],
    description: [string()],
    startedAt: [string()],
    endedAt: [string()],
  },
  update: {
    name: [string(), max(120)],
    description: [string()],
    startedAt: [string()],
    endedAt: [string()],
  },
}
