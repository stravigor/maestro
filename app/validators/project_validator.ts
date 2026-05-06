import { required, string, max, type Rule } from '@strav/http'

type RuleSet = Record<string, Rule[]>

export interface ProjectStoreInput {
  name: string
  description?: string | null
  workflowId?: string | null
}

export interface ProjectUpdateInput {
  name?: string
  description?: string | null
  workflowId?: string | null
  archivedAt?: string | null
}

export const ProjectRules: Record<'store' | 'update', RuleSet> = {
  store: {
    name: [required(), string(), max(120)],
    description: [string()],
    workflowId: [string()],
  },
  update: {
    name: [string(), max(120)],
    description: [string()],
    workflowId: [string()],
    archivedAt: [string()],
  },
}
