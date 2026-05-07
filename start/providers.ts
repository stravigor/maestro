import { HttpProvider, SessionProvider, AuthProvider } from "@strav/http"
import { app, ConfigProvider, EncryptionProvider, ServiceProvider } from "@strav/kernel"
import { DatabaseProvider } from "@strav/database"
import { ViewProvider, PagesProvider } from '@strav/view'
import User from '#models/user'


export const providers: ServiceProvider[] = [
  new ConfigProvider(),
  new HttpProvider(),
  new EncryptionProvider(),
  new DatabaseProvider(),
  new ViewProvider(),
  new SessionProvider(),
  new AuthProvider({ resolver: (id) => User.find(id as string) }),
  new PagesProvider(),
]
