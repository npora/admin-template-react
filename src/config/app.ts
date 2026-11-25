import { normalizeApiPrefix } from './env'

export const appTitle = import.meta.env.VITE_APP_TITLE?.trim() || 'Npora Admin'
export const apiPrefix = normalizeApiPrefix(import.meta.env.VITE_API_PREFIX)
export const demoEnabled = import.meta.env.VITE_DEMO_ENABLED === 'true'
export const authenticatorEnabled = import.meta.env.VITE_AUTHENTICATOR_ENABLED === 'true'
export const tokenStorageMode = import.meta.env.VITE_TOKEN_STORAGE
