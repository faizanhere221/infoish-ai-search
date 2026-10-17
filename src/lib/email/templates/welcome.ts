import { renderLayout, paragraph } from './layout'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://infoishai.com'

export function welcomeEmail(userType: 'brand' | 'creator'): { subject: string; html: string; text: string } {
  const heading = 'Welcome to Infoishai'

  if (userType === 'brand') {
    const bodyHtml =
      paragraph('Your brand account is ready.') +
      paragraph('Here is how to get started:') +
      `<ul style="margin: 0 0 16px 0; padding-left: 20px; font-size: 15px; line-height: 1.6; color: #374151;">
        <li>Search verified creators by platform, niche, and audience size.</li>
        <li>Send an offer directly, or post a campaign and let creators apply.</li>
        <li>Track every offer, contract, and payment in one place.</li>
      </ul>`
    const bodyText =
      'Your brand account is ready.\n\nHere is how to get started:\n' +
      '- Search verified creators by platform, niche, and audience size.\n' +
      '- Send an offer directly, or post a campaign and let creators apply.\n' +
      '- Track every offer, contract, and payment in one place.'

    const { html, text } = renderLayout({
      preheader: 'Your brand account is ready.',
      heading,
      bodyHtml,
      bodyText,
      buttonLabel: 'Find creators',
      buttonUrl: `${APP_URL}/creators`,
    })
    return { subject: 'Welcome to Infoishai', html, text }
  }

  const bodyHtml =
    paragraph('Your creator account is ready.') +
    paragraph('Here is how to get started:') +
    `<ul style="margin: 0 0 16px 0; padding-left: 20px; font-size: 15px; line-height: 1.6; color: #374151;">
      <li>Complete your profile so brands find you.</li>
      <li>Connect your platforms and add your rates.</li>
      <li>Browse open campaigns, or wait for a brand to reach out.</li>
    </ul>`
  const bodyText =
    'Your creator account is ready.\n\nHere is how to get started:\n' +
    '- Complete your profile so brands find you.\n' +
    '- Connect your platforms and add your rates.\n' +
    '- Browse open campaigns, or wait for a brand to reach out.'

  const { html, text } = renderLayout({
    preheader: 'Your creator account is ready.',
    heading,
    bodyHtml,
    bodyText,
    buttonLabel: 'Complete your profile',
    buttonUrl: `${APP_URL}/dashboard/creator`,
  })
  return { subject: 'Welcome to Infoishai', html, text }
}
