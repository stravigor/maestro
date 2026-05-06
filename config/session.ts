import { env } from '@strav/kernel'

export default {
  driver:   env('SESSION_DRIVER', 'postgres') as 'postgres' | 'redis',
  cookie:   'strav_session',
  lifetime: 30 * 24 * 60, // minutes (30 days)
  httpOnly: true,
  secure:   env.bool('APP_SECURE', true),
  sameSite: 'lax' as const,
}