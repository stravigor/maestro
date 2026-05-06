import { required, string, integer, oneOf, max, type Rule } from '@strav/http'
import type { StoryPriority } from '#models/story'

type RuleSet = Record<string, Rule[]>

const PRIORITIES: readonly StoryPriority[] = ['low', 'med', 'high']

export interface StoryStoreInput {
  title: string
  description?: string | null
  workflowColumn: string
  position?: number
  assigneeId?: string | null
  priority?: StoryPriority | null
  priorityRationale?: string | null
  sprintId?: string | null
  dueAt?: string | null
}

export interface StoryUpdateInput {
  title?: string
  description?: string | null
  workflowColumn?: string
  position?: number
  assigneeId?: string | null
  priority?: StoryPriority | null
  priorityRationale?: string | null
  sprintId?: string | null
  dueAt?: string | null
}

export const StoryRules: Record<'store' | 'update', RuleSet> = {
  store: {
    title: [required(), string(), max(200)],
    description: [string()],
    workflowColumn: [required(), string(), max(200)],
    position: [integer()],
    assigneeId: [string()],
    priority: [oneOf(PRIORITIES)],
    priorityRationale: [string()],
    sprintId: [string()],
    dueAt: [string()],
  },
  update: {
    title: [string(), max(200)],
    description: [string()],
    workflowColumn: [string(), max(200)],
    position: [integer()],
    assigneeId: [string()],
    priority: [oneOf(PRIORITIES)],
    priorityRationale: [string()],
    sprintId: [string()],
    dueAt: [string()],
  },
}
