import { required, string, email, type Rule } from '@strav/http'

type RuleSet = Record<string, Rule[]>

export interface LoginInput {
  email: string
  password: string
}

export const AuthRules: Record<'login', RuleSet> = {
  login: {
    email: [required(), email()],
    password: [required(), string()],
  },
}
