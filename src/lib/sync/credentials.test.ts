import { describe, expect, it } from 'vitest'
import {
  decodePairingCode,
  encodePairingCode,
  generateSyncCredentials,
} from './credentials'

describe('sync credentials', () => {
  it('round-trips a pairing code', () => {
    const credentials = generateSyncCredentials()
    const encoded = encodePairingCode(credentials)
    expect(decodePairingCode(encoded)).toEqual(credentials)
  })

  it('rejects malformed pairing codes', () => {
    expect(decodePairingCode('')).toBeNull()
    expect(decodePairingCode('not-a-uuid.secret')).toBeNull()
    expect(decodePairingCode('only-id')).toBeNull()
  })
})
