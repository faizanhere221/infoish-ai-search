import { renderLayout, paragraph } from './layout'

export interface DailySummaryItem {
  title: string
  content: string
}

export interface DailySummaryParams {
  items: DailySummaryItem[]
  overdueCount: number
  dashboardUrl: string
  manageSettingsUrl: string
  unsubscribeUrl: string
}

export function dailySummaryTemplate(params: DailySummaryParams): { subject: string; html: string; text: string } {
  const itemsHtml = params.items
    .map(
      (item) =>
        `<li style="margin-bottom: 8px;"><strong style="color: #111827;">${item.title}</strong><br/><span style="color: #6b7280; font-size: 14px;">${item.content}</span></li>`
    )
    .join('')
  const itemsText = params.items.map((item) => `- ${item.title}: ${item.content}`).join('\n')

  const overdueHtml = params.overdueCount > 0
    ? paragraph(`${params.overdueCount} item${params.overdueCount === 1 ? '' : 's'} are overdue and need your attention.`)
    : ''
  const overdueText = params.overdueCount > 0
    ? `${params.overdueCount} item${params.overdueCount === 1 ? '' : 's'} are overdue and need your attention.\n\n`
    : ''

  const bodyHtml =
    overdueHtml +
    paragraph('Here is what happened on Infoishai today:') +
    `<ul style="margin: 0 0 16px 0; padding-left: 20px; font-size: 15px; line-height: 1.5;">${itemsHtml}</ul>`
  const bodyText = `${overdueText}What happened on Infoishai today:\n\n${itemsText}`

  const { html, text } = renderLayout({
    preheader: `${params.items.length} update${params.items.length === 1 ? '' : 's'} from today`,
    heading: 'Your daily summary',
    bodyHtml,
    bodyText,
    buttonLabel: 'Open dashboard',
    buttonUrl: params.dashboardUrl,
    footerLinks: { manageSettingsUrl: params.manageSettingsUrl, unsubscribeUrl: params.unsubscribeUrl },
  })
  return { subject: 'Your Infoishai daily summary', html, text }
}
