import { renderLayout, paragraph } from './layout'

export interface ActionNotificationParams {
  title: string
  content: string
  buttonLabel: string
  buttonUrl: string
  manageSettingsUrl: string
  unsubscribeUrl: string
}

// One shared template for every immediate "it's your turn" email — offer/
// counter received, contract to sign or countersign, draft to review,
// changes requested, payment marked paid, payment disputed, added to a
// campaign. Title/content come straight from EVENT_CATALOG
// (src/lib/events/catalog.ts) — the same copy the in-app notification
// already shows, so the email never says something different.
export function actionNotificationTemplate(params: ActionNotificationParams): { subject: string; html: string; text: string } {
  const { html, text } = renderLayout({
    preheader: params.content,
    heading: params.title,
    bodyHtml: paragraph(params.content),
    bodyText: params.content,
    buttonLabel: params.buttonLabel,
    buttonUrl: params.buttonUrl,
    footerLinks: { manageSettingsUrl: params.manageSettingsUrl, unsubscribeUrl: params.unsubscribeUrl },
  })
  return { subject: params.title, html, text }
}
