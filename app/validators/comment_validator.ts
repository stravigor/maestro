import { required, string, type Rule } from '@strav/http'

type RuleSet = Record<string, Rule[]>

export interface CommentStoreInput {
  body: string
}

export interface CommentUpdateInput {
  body?: string
}

export const CommentRules: Record<'store' | 'update', RuleSet> = {
  store: {
    body: [required(), string()],
  },
  update: {
    body: [string()],
  },
}
