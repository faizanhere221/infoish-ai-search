import { renderLayout, paragraph } from './layout'

export function passwordResetTemplate(resetUrl: string): { subject: string; html: string; text: string } {
  const bodyHtml =
    paragraph('Someone requested a password reset for your Infoishai account.') +
    paragraph('If this was you, set a new password below. This link expires in 1 hour and works once.') +
    paragraph('If this was not you, ignore this email. Your password stays the same.')
  const bodyText =
    'Someone requested a password reset for your Infoishai account.\n\n' +
    'If this was you, set a new password below. This link expires in 1 hour and works once.\n\n' +
    'If this was not you, ignore this email. Your password stays the same.'

  const { html, text } = renderLayout({
    preheader: 'Reset your password',
    heading: 'Reset your password',
    bodyHtml,
    bodyText,
    buttonLabel: 'Reset password',
    buttonUrl: resetUrl,
  })
  return { subject: 'Reset your Infoishai password', html, text }
}
