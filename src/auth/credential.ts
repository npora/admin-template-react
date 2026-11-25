import { tokenStorageMode } from '../config/app'

export type Credential = { token: string; expiresAt?: number }

let memoryCredential: Credential | null = null

const sessionKey = 'npora-react-session'

export function storedCredential(): Credential | null {
  if (tokenStorageMode === 'memory') return memoryCredential
  for (const storage of [sessionStorage, localStorage]) {
    try {
      const value = JSON.parse(storage.getItem(sessionKey) ?? 'null') as Credential | null
      if (value?.token && (value.expiresAt === undefined || value.expiresAt > Date.now()))
        return value
      storage.removeItem(sessionKey)
    } catch {
      storage.removeItem(sessionKey)
    }
  }
  return null
}

export function saveCredential(credential: Credential | null, remember = false) {
  if (tokenStorageMode === 'memory') {
    memoryCredential = credential
    return
  }
  sessionStorage.removeItem(sessionKey)
  localStorage.removeItem(sessionKey)
  if (credential) {
    const storage = (tokenStorageMode === 'local' || (remember && credential.expiresAt)) ? localStorage : sessionStorage
    storage.setItem(sessionKey, JSON.stringify(credential))
  }
}
