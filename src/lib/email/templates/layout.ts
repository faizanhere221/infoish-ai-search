// Single branded layout every email template builds on — table-based HTML
// email markup (not flexbox/grid; most email clients still don't support
// them), inline styles only (no <style> block — Gmail strips it), one clear
// CTA button, and a plain-text version alongside every HTML one.

const BRAND_PINK = '#de5688'
const DARK_BG = '#1A1A2E'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://infoishai.com'

export interface LayoutParams {
  preheader: string
  heading: string
  bodyHtml: string // pre-escaped inner paragraphs, already wrapped in <p style="...">
  bodyText: string // plain-text equivalent of bodyHtml
  buttonLabel?: string
  buttonUrl?: string
  // Optional closing paragraphs below the button (e.g. a sign-off), with
  // their plain-text equivalent.
  afterButtonHtml?: string
  afterButtonText?: string
  // Omit for security emails (welcome/verify/reset) — those aren't
  // unsubscribable and carry no footer links besides "visit Infoishai".
  footerLinks?: { manageSettingsUrl: string; unsubscribeUrl: string }
}

export function renderLayout(params: LayoutParams): { html: string; text: string } {
  const hasButton = !!(params.buttonUrl && params.buttonLabel)
  const button = hasButton ? renderButtonRow(params.buttonLabel as string, params.buttonUrl as string) : ''

  const footerLinksHtml = params.footerLinks
    ? `<a href="${params.footerLinks.manageSettingsUrl}" style="color: #9ca3af; text-decoration: underline;">Manage email settings</a>
       &nbsp;&middot;&nbsp;
       <a href="${params.footerLinks.unsubscribeUrl}" style="color: #9ca3af; text-decoration: underline;">Unsubscribe</a>`
    : `<a href="${APP_URL}" style="color: #9ca3af; text-decoration: underline;">infoishai.com</a>`

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${params.heading}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <div style="display: none; max-height: 0; overflow: hidden;">${params.preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width: 480px; background-color: #ffffff; border-radius: 16px; overflow: hidden;">
          <tr>
            <td style="background-color: ${DARK_BG}; padding: 20px 32px;">
              <span style="color: #ffffff; font-size: 18px; font-weight: 700;">Infoishai</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 32px 8px 32px;">
              <h1 style="margin: 0 0 16px 0; font-size: 20px; color: #111827;">${params.heading}</h1>
              ${params.bodyHtml}
            </td>
          </tr>
          ${button}
          ${params.afterButtonHtml ? `<tr>
            <td style="padding: 0 32px 8px 32px;">${params.afterButtonHtml}</td>
          </tr>` : ''}
          <tr>
            <td style="padding: 24px 32px 32px 32px; border-top: 1px solid #f3f4f6;">
              <p style="margin: 16px 0 0 0; font-size: 12px; color: #9ca3af;">
                ${footerLinksHtml}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  const textFooter = params.footerLinks
    ? `Manage email settings: ${params.footerLinks.manageSettingsUrl}\nUnsubscribe: ${params.footerLinks.unsubscribeUrl}`
    : APP_URL

  const text = `${params.heading}\n\n${params.bodyText}${
    hasButton ? `\n\n${params.buttonLabel}: ${params.buttonUrl}` : ''
  }${params.afterButtonText ? `\n\n${params.afterButtonText}` : ''}\n\n---\n${textFooter}`

  return { html, text }
}

// "Bulletproof" button: a nested table whose cell carries the solid color as
// both the bgcolor attribute and inline background-color, so it shows even
// where clients strip CSS backgrounds (Outlook) or gradients (Gmail). It is a
// full <tr><td> row of the card table; a bare <table> between card rows is
// invalid markup, and clients move it outside the card. The plain link below
// it works even when the button doesn't render at all.
function renderButtonRow(label: string, url: string): string {
  const href = escapeHtml(url)
  return `<tr>
            <td align="center" style="padding: 8px 32px 24px 32px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                <tr>
                  <td align="center" bgcolor="${BRAND_PINK}" style="background-color: ${BRAND_PINK}; border-radius: 10px; padding: 12px 28px;">
                    <a href="${href}" target="_blank" style="color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px; line-height: 20px; display: inline-block;">${label}</a>
                  </td>
                </tr>
              </table>
              <p style="margin: 16px 0 0 0; font-size: 13px; line-height: 1.5; color: #6b7280; text-align: left;">
                Or copy and paste this link:<br />
                <a href="${href}" target="_blank" style="color: ${BRAND_PINK}; text-decoration: underline; word-break: break-all;">${href}</a>
              </p>
            </td>
          </tr>`
}

export function paragraph(text: string): string {
  return `<p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.5; color: #374151;">${text}</p>`
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
