import { required, string, max, type Rule } from '@strav/http'

type RuleSet = Record<string, Rule[]>

export interface WorkspaceStoreInput {
  slug: string
  name: string
}

export interface WorkspaceUpdateInput {
  slug?: string
  name?: string
}

export const WorkspaceRules: Record<'store' | 'update', RuleSet> = {
  store: {
    slug: [required(), string(), max(255)],
    name: [required(), string(), max(255)],
  },
  update: {
    slug: [string(), max(255)],
    name: [string(), max(255)],
  },
}
