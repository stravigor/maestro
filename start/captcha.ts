import { router } from '@strav/http'
import { mountCaptchaRoutes, installCaptchaHelpers } from '@strav/captcha'

mountCaptchaRoutes(router)   // GET /__captcha/:type — refresh endpoint
installCaptchaHelpers()       // wires the @captcha view directive