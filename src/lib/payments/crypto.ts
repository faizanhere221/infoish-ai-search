import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

// AES-256-GCM for creator payout account details at rest. The key never
// leaves the server (PAYOUT_ENCRYPTION_KEY*, server-only env vars) and is
// never sent to the client in any form — only masked previews and, on an
// explicit "Reveal" by an authorized party, the decrypted details for that
// one request.
const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12 // recommended for GCM

// The version written for every NEW encryption. Bump this (and add the
// matching case in getKeyForVersion below) when rotating to a new key —
// existing rows keep decrypting correctly under their own stored
// key_version, so rotation never requires re-encrypting old records in the
// same deploy. This phase only makes that possible; it doesn't perform a
// rotation (no PAYOUT_ENCRYPTION_KEY_V2 exists yet).
export const CURRENT_KEY_VERSION = 1

function getKeyForVersion(version: number): Buffer {
  const envVarName = version === 1 ? 'PAYOUT_ENCRYPTION_KEY' : `PAYOUT_ENCRYPTION_KEY_V${version}`
  const raw = process.env[envVarName]
  if (!raw) {
    throw new Error(`${envVarName} is not set — see .env.example`)
  }
  const key = Buffer.from(raw, 'base64')
  if (key.length !== 32) {
    throw new Error(`${envVarName} must decode to exactly 32 bytes (base64 of \`openssl rand -base64 32\`)`)
  }
  return key
}

export interface EncryptedPayload {
  ciphertext: string
  keyVersion: number
}

// Encrypts a plain object to a single base64 string: iv (12) + authTag (16)
// + ciphertext, concatenated. Self-contained — nothing else needs to be
// stored alongside it to decrypt later, except which key version made it
// (returned here, stored in payout_methods.key_version).
export function encryptPayoutDetails(details: Record<string, string>): EncryptedPayload {
  const key = getKeyForVersion(CURRENT_KEY_VERSION)
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const plaintext = Buffer.from(JSON.stringify(details), 'utf8')
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()])
  const authTag = cipher.getAuthTag()
  return {
    ciphertext: Buffer.concat([iv, authTag, ciphertext]).toString('base64'),
    keyVersion: CURRENT_KEY_VERSION,
  }
}

export function decryptPayoutDetails(encrypted: string, keyVersion: number): Record<string, string> {
  const key = getKeyForVersion(keyVersion)
  const raw = Buffer.from(encrypted, 'base64')
  const iv = raw.subarray(0, IV_LENGTH)
  const authTag = raw.subarray(IV_LENGTH, IV_LENGTH + 16)
  const ciphertext = raw.subarray(IV_LENGTH + 16)
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  // Deliberately not logged or included in any thrown error below — a
  // decrypt failure (wrong key version, tampered ciphertext) must never
  // put plaintext or partial plaintext anywhere an error tracker could
  // pick it up.
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()])
  return JSON.parse(plaintext.toString('utf8'))
}

// A display-safe preview that never requires decrypting anything — stored
// alongside the ciphertext (payout_methods.masked_preview) and shown by
// default; "Reveal" is the only action that triggers a real decrypt.
export function buildMaskedPreview(method: string, details: Record<string, string>): string {
  const methodLabel = { wise: 'Wise', payoneer: 'Payoneer', bank_transfer: 'Bank transfer', paypal: 'PayPal', other: 'Other' }[method] || method

  if (details.email) {
    const [user, domain] = details.email.split('@')
    const maskedUser = user.length > 2 ? `${user.slice(0, 2)}***` : '***'
    return `${methodLabel} · ${maskedUser}@${domain || '???'}`
  }
  if (details.iban) {
    return `${methodLabel} · IBAN •••• ${details.iban.slice(-4)}`
  }
  if (details.account_number) {
    return `${methodLabel} · Acct •••• ${details.account_number.slice(-4)}`
  }
  return methodLabel
}
