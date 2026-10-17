import { randomBytes, createHash } from 'node:crypto'

// The raw token goes out in an email link; only its hash is ever stored, so
// a database read (or a leaked backup) can't be used to sign in as someone
// else. Same reasoning as password hashing, just SHA-256 instead of bcrypt
// since these are single-use, short-lived, high-entropy random values, not
// user-chosen secrets.
export function generateToken(): string {
  return randomBytes(32).toString('hex')
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}
