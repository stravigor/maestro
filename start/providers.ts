import { HttpProvider, SessionProvider, AuthProvider } from "@strav/http"
import { app, ConfigProvider, EncryptionProvider, ServiceProvider } from "@strav/kernel"
import { DatabaseProvider, PostgresSessionStore } from "@strav/database"
import { ViewProvider, PagesProvider } from '@strav/view'
import User from '#models/user'

// TODO: drop this workaround once @strav/http >= 0.4.8 ships —
// SessionProvider now registers the store class itself.
class SessionStoreProvider extends ServiceProvider {
  readonly name = 'session-store'
  override readonly dependencies = ['database']
  override register(): void {
    app.singleton(PostgresSessionStore)
  }
}

export const providers: ServiceProvider[] = [
  new ConfigProvider(),
  new HttpProvider(),
  new EncryptionProvider(),
  new DatabaseProvider(),
  new ViewProvider(),
  new SessionStoreProvider(),
  new SessionProvider(),
  new AuthProvider({ resolver: (id) => User.find(id as string) }),
  new PagesProvider(),
]
