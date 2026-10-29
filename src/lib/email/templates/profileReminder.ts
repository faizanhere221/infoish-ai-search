import { renderLayout, paragraph } from './layout'

export interface ProfileReminderParams {
  displayName: string | null
  percentage: number
  // Labels of the missing checklist items, required ones first.
  missing: { label: string; required: boolean }[]
  settingsUrl: string
  manageSettingsUrl: string
  unsubscribeUrl: string
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function profileReminderTemplate(params: ProfileReminderParams): { subject: string; html: string; text: string } {
  const name = params.displayName?.trim()
  const greeting = name ? `Hi ${name},` : 'Hi there,'

  const itemsHtml = params.missing
    .map((m) => `<li style="margin-bottom: 6px;">${escapeHtml(m.label)}${m.required ? ' <span style="color: #b153c8; font-weight: 600;">(required)</span>' : ''}</li>`)
    .join('')
  const itemsText = params.missing.map((m) => `- ${m.label}${m.required ? ' (required)' : ''}`).join('\n')

  const bodyHtml =
    paragraph(escapeHtml(greeting)) +
    paragraph(`Your Infoishai profile is ${params.percentage}% complete. Brands search by niche and platform, and complete profiles show up first, so a few minutes here goes a long way.`) +
    paragraph('Here is what your profile is missing:') +
    `<ul style="margin: 0 0 16px 0; padding-left: 20px; font-size: 15px; line-height: 1.6; color: #374151;">${itemsHtml}</ul>` +
    paragraph('Once the required items are done, your profile is listed for brands to find, and you get a badge to share on your channels.')
  const bodyText =
    `${greeting}\n\n` +
    `Your Infoishai profile is ${params.percentage}% complete. Brands search by niche and platform, and complete profiles show up first, so a few minutes here goes a long way.\n\n` +
    `Here is what your profile is missing:\n${itemsText}\n\n` +
    'Once the required items are done, your profile is listed for brands to find, and you get a badge to share on your channels.'

  const { html, text } = renderLayout({
    preheader: `Your profile is ${params.percentage}% complete. Here is what to add.`,
    heading: 'Finish your Infoishai profile',
    bodyHtml,
    bodyText,
    buttonLabel: 'Complete my profile',
    buttonUrl: params.settingsUrl,
    footerLinks: { manageSettingsUrl: params.manageSettingsUrl, unsubscribeUrl: params.unsubscribeUrl },
  })
  return { subject: 'Your Infoishai profile is almost ready', html, text }
}
