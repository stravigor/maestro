import { required, string, array, max, type Rule } from '@strav/http'

type RuleSet = Record<string, Rule[]>

export interface WorkflowStoreInput {
  name: string
  description?: string | null
  columns?: string[] | null
}

export interface WorkflowUpdateInput {
  name?: string
  description?: string | null
  columns?: string[] | null
}

export const WorkflowRules: Record<'store' | 'update', RuleSet> = {
  store: {
    name: [required(), string(), max(120)],
    description: [string()],
    columns: [array()],
  },
  update: {
    name: [string(), max(120)],
    description: [string()],
    columns: [array()],
  },
}
