import jwt from 'jsonwebtoken'

// Lets an unsubscribe link work without a login — same JWT_SECRET as the
// auth tokens, but a distinct `purpose` claim so this can never be replayed
// as an auth token (middleware never issues or accepts one with this
// purpose) and an auth token can never be used here either.
interface UnsubscribeTokenPayload {
  purpose: 'unsubscribe'
  userId: string
  category: string // an EmailCategory, or 'all'
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) {throw new Error('JWT_SECRET environment variable is required')}
  return secret
}

export function signUnsubscribeToken(userId: string, category: string): string {
  const payload: UnsubscribeTokenPayload = { purpose: 'unsubscribe', userId, category }
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '2y' })
}

export function verifyUnsubscribeToken(token: string): { userId: string; category: string } | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as Partial<UnsubscribeTokenPayload>
    if (decoded.purpose !== 'unsubscribe' || !decoded.userId || !decoded.category) {return null}
    return { userId: decoded.userId, category: decoded.category }
  } catch {
    return null
  }
}
