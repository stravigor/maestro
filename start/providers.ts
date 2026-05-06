import { HttpProvider, SessionProvider, AuthProvider } from "@strav/http"
import { app, ConfigProvider, EncryptionProvider, ServiceProvider } from "@strav/kernel"
import { DatabaseProvider, PostgresSessionStore } from "@strav/database"
import { ViewProvider, PagesProvider } from '@strav/view'
import User from '#models/user'

// SessionProvider resolves PostgresSessionStore from the container but
// DatabaseProvider doesn't register it for us — wire it up here.
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