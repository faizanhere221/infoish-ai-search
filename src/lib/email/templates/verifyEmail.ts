import { renderLayout, paragraph } from './layout'

export function verifyEmailTemplate(verifyUrl: string): { subject: string; html: string; text: string } {
  const bodyHtml =
    paragraph('Confirm your email address to finish setting up your account.') +
    paragraph('This link expires in 24 hours.')
  const bodyText = 'Confirm your email address to finish setting up your account.\n\nThis link expires in 24 hours.'

  const { html, text } = renderLayout({
    preheader: 'Confirm your email address',
    heading: 'Verify your email',
    bodyHtml,
    bodyText,
    buttonLabel: 'Verify email',
    buttonUrl: verifyUrl,
  })
  return { subject: 'Verify your Infoishai email', html, text }
}
