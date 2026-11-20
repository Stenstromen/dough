export interface SyncCredentials {
  id: string
  clientSecret: string
}

const PAIRING_SEPARATOR = '.'

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

export function generateSyncCredentials(): SyncCredentials {
  return {
    id: crypto.randomUUID(),
    clientSecret: bytesToBase64Url(crypto.getRandomValues(new Uint8Array(32))),
  }
}

export function encodePairingCode(credentials: SyncCredentials): string {
  return `${credentials.id}${PAIRING_SEPARATOR}${credentials.clientSecret}`
}

export function decodePairingCode(raw: string): SyncCredentials | null {
  const trimmed = raw.trim()
  const separator = trimmed.indexOf(PAIRING_SEPARATOR)
  if (separator <= 0 || separator === trimmed.length - 1) return null

  const id = trimmed.slice(0, separator)
  const clientSecret = trimmed.slice(separator + 1)
  if (!id || !clientSecret) return null

  const uuidRe =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!uuidRe.test(id)) return null
  if (!/^[A-Za-z0-9_-]+$/.test(clientSecret)) return null

  return { id, clientSecret }
}
