const commonTLDTypos: Record<string, string> = {
  '.con': '.com',
  '.cpm': '.com',
  '.vom': '.com',
  '.cm': '.com',
  '.cim': '.com',
  '.og': '.org',
  '.ent': '.net',
}

const commonDomainTypos: Record<string, string> = {
  gmial: 'gmail',
  gmil: 'gmail',
  gmal: 'gmail',
  gmaill: 'gmail',
  hotmal: 'hotmail',
  yahooo: 'yahoo',
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export interface EmailValidationResult {
  valid: boolean
  suggestion?: string
  warning?: string
}

export function validateEmail(email: string): EmailValidationResult {
  if (!EMAIL_REGEX.test(email)) {
    return { valid: false, warning: 'Invalid email format' }
  }

  for (const [typo, correct] of Object.entries(commonTLDTypos)) {
    if (email.endsWith(typo)) {
      const suggestion = email.slice(0, -typo.length) + correct
      return { valid: true, suggestion, warning: `Did you mean ${suggestion}?` }
    }
  }

  for (const [typo, correct] of Object.entries(commonDomainTypos)) {
    if (email.includes(`@${typo}.`)) {
      const suggestion = email.replace(`@${typo}.`, `@${correct}.`)
      return { valid: true, suggestion, warning: `Did you mean ${suggestion}?` }
    }
  }

  return { valid: true }
}
