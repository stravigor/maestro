import { env } from '@strav/kernel'

export default {
  username: env('DB_USER', 'strav_app'),
  tenant: {
    enabled: true,
    bypass: {
      username: env('DB_BYPASS_USER', 'liva'),
      password: env('DB_BYPASS_PASSWORD', ''),
    },
  },
}