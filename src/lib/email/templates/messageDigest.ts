import { renderLayout, paragraph } from './layout'

export interface MessageDigestParams {
  otherPartyName: string
  unreadCount: number
  conversationUrl: string
  manageSettingsUrl: string
  unsubscribeUrl: string
}

export function messageDigestTemplate(params: MessageDigestParams): { subject: string; html: string; text: string } {
  const content = `You have ${params.unreadCount} unread message${params.unreadCount === 1 ? '' : 's'} from ${params.otherPartyName}.`

  const { html, text } = renderLayout({
    preheader: content,
    heading: 'New messages',
    bodyHtml: paragraph(content),
    bodyText: content,
    buttonLabel: 'Open conversation',
    buttonUrl: params.conversationUrl,
    footerLinks: { manageSettingsUrl: params.manageSettingsUrl, unsubscribeUrl: params.unsubscribeUrl },
  })
  return { subject: `${params.unreadCount} unread message${params.unreadCount === 1 ? '' : 's'} from ${params.otherPartyName}`, html, text }
}
