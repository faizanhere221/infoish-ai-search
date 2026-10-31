import { renderLayout, paragraph, escapeHtml } from '@/lib/email/templates/layout'
import {
  founderIntro,
  founderSignature,
  isAccountVisible,
  isOptedOutOfFounderNotes,
  type FounderNotice,
  type FounderSender,
  type Supabase,
} from './core'
import type { FounderAudience } from './creator'

// Brand welcome: replaces the generic brand welcome email. Queued when the
// brand account is created and sent once the company profile is saved
// (the signup form saves it seconds later), so it includes whatever company
// details exist by then. A brand that never fills in the profile gets it
// from the daily cron without them.

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://infoishai.com'
const CHUNK = 200

export interface BrandWelcomeData {
  email: string | null
  contactName: string | null
  companyName: string | null
  website: string | null
  country: string | null
}

export async function loadBrandWelcome(supabase: Supabase, userId: string): Promise<BrandWelcomeData | null> {
  const [{ data: user, error }, { data: brand }] = await Promise.all([
    supabase.from('users').select('email, user_type').eq('id', userId).maybeSingle(),
    supabase.from('brands').select('company_name, company_website, country, contact_name').eq('user_id', userId).maybeSingle(),
  ])
  if (error) {throw error}
  if (!user || user.user_type !== 'brand') {return null}
  return {
    email: user.email,
    contactName: brand?.contact_name?.trim() || null,
    companyName: brand?.company_name?.trim() || null,
    website: brand?.company_website?.trim() || null,
    country: brand?.country?.trim() || null,
  }
}

export const SAMPLE_BRAND_WELCOME: BrandWelcomeData = {
  email: 'jordan@example.com',
  contactName: 'Jordan',
  companyName: 'Acme Analytics',
  website: 'https://example.com',
  country: 'United States',
}

// Same rule as the "Book a call" button on /pricing: only a valid https
// URL counts. Without one, the call button goes to the contact form.
function strategyCallUrl(): string {
  const raw = process.env.NEXT_PUBLIC_BRAND_BOOKING_URL?.trim()
  return raw && /^https:\/\//.test(raw) ? raw : `${APP_URL}/contact`
}

const linkStyle = 'color: #b153c8; text-decoration: underline;'

export function brandWelcomeTemplate(
  data: BrandWelcomeData,
  sender: FounderSender,
  footer: { manageSettingsUrl: string; unsubscribeUrl: string }
): { subject: string; html: string; text: string } {
  const firstName = data.contactName?.split(/\s+/)[0] || null
  const greeting = firstName ? `Hi ${firstName},` : 'Hi there,'
  const thanks = data.companyName ? `Thanks for bringing ${data.companyName} to Infoishai.` : 'Thanks for signing up.'
  const creatorsUrl = `${APP_URL}/creators`
  const campaignUrl = `${APP_URL}/campaigns/create`
  const pricingUrl = `${APP_URL}/pricing`
  const callUrl = strategyCallUrl()
  const signature = founderSignature(sender)

  const bodyHtml =
    paragraph(escapeHtml(greeting)) +
    paragraph(`${escapeHtml(founderIntro(sender))} ${escapeHtml(thanks)}`) +
    paragraph('There are two ways to work with tech creators here:') +
    paragraph(
      `<strong>1. Do it yourself, free.</strong> Browse creators at <a href="${creatorsUrl}" style="${linkStyle}">infoishai.com/creators</a>, message the ones you like, or <a href="${campaignUrl}" style="${linkStyle}">post a campaign</a> and let creators apply. Infoishai is free for brands and creators. There are no platform fees.`
    ) +
    paragraph(
      `<strong>2. Let us run it.</strong> With our managed service, we find the right creators, handle outreach and contracts, and run the campaign for you. <a href="${pricingUrl}" style="${linkStyle}">See the managed service</a>`
    ) +
    paragraph('Not sure which fits? Book a free strategy call with me and we will plan your first campaign together.')

  const afterButtonHtml =
    paragraph("Or reply to this email and tell me what you're launching. I read every reply.") + signature.html

  const bodyText =
    `${greeting}\n\n` +
    `${founderIntro(sender)} ${thanks}\n\n` +
    'There are two ways to work with tech creators here:\n\n' +
    `1. Do it yourself, free. Browse creators at ${creatorsUrl}, message the ones you like, or post a campaign (${campaignUrl}) and let creators apply. Infoishai is free for brands and creators. There are no platform fees.\n\n` +
    `2. Let us run it. With our managed service, we find the right creators, handle outreach and contracts, and run the campaign for you. ${pricingUrl}\n\n` +
    'Not sure which fits? Book a free strategy call with me and we will plan your first campaign together.'

  const { html, text } = renderLayout({
    preheader: 'A note from the founder: two ways to work with tech creators.',
    heading: 'Welcome to Infoishai',
    bodyHtml,
    bodyText,
    buttonLabel: 'Book a free strategy call',
    buttonUrl: callUrl,
    afterButtonHtml,
    afterButtonText: `Or reply to this email and tell me what you're launching. I read every reply.\n\n${signature.text}`,
    footerLinks: footer,
  })
  return { subject: data.companyName ? `Welcome to Infoishai, ${data.companyName}` : 'Welcome to Infoishai', html, text }
}

export function brandSignupNotice(data: BrandWelcomeData, userId: string): FounderNotice {
  return {
    subject: `New brand signup: ${data.companyName || data.email || userId}`,
    heading: 'A new brand signed up',
    rows: [
      ['Company', data.companyName || 'Not filled in yet'],
      ['Website', data.website || 'Not filled in yet'],
      ['Country', data.country || 'Not filled in yet'],
      ['Email', data.email || 'None'],
    ],
    linkLabel: 'Open brands in admin',
    linkUrl: `${APP_URL}/admin/brands`,
    activityAction: 'founder_brand_signup',
  }
}

async function inChunks<T>(ids: string[], load: (chunk: string[]) => Promise<T[]>): Promise<T[]> {
  const out: T[] = []
  for (let i = 0; i < ids.length; i += CHUNK) {out.push(...(await load(ids.slice(i, i + CHUNK))))}
  return out
}

// Brands who signed up before the founder email existed (no founder_emails
// row): visible, not contacted, not opted out.
export async function getBrandWelcomeAudience(supabase: Supabase): Promise<FounderAudience> {
  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, deleted_at, is_active, email_preferences, founder_contacted_at')
    .eq('user_type', 'brand')
    .limit(5000)
  if (error) {throw error}
  const audience: FounderAudience = { userIds: [], alreadyHandled: 0, contacted: 0, optedOut: 0 }
  if (!users?.length) {return audience}

  const rows = await inChunks(users.map((u) => u.id), async (chunk) => {
    const { data, error: e } = await supabase.from('founder_emails').select('user_id').eq('kind', 'brand_welcome').in('user_id', chunk)
    if (e) {throw e}
    return data ?? []
  })
  const handled = new Set(rows.map((r) => r.user_id))

  for (const user of users) {
    if (!user.email || !isAccountVisible({ deletedAt: user.deleted_at, isActive: user.is_active, hidden: false })) {continue}
    if (handled.has(user.id)) {
      audience.alreadyHandled += 1
    } else if (user.founder_contacted_at) {
      audience.contacted += 1
    } else if (isOptedOutOfFounderNotes((user.email_preferences ?? {}) as Record<string, boolean>)) {
      audience.optedOut += 1
    } else {
      audience.userIds.push(user.id)
    }
  }
  return audience
}
