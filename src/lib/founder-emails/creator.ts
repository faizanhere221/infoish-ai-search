import { getProfileCompleteness, type ProfileCompleteness } from '@/lib/profile-completion'
import { badgeHtmlSnippet, badgeImageUrl, profileShareUrl } from '@/lib/creators/badge'
import { renderLayout, paragraph, escapeHtml } from '@/lib/email/templates/layout'
import { platformName } from '@/utils/constants'
import {
  founderIntro,
  founderSignature,
  isAccountVisible,
  isOptedOutOfFounderNotes,
  type FounderNotice,
  type FounderSender,
  type Supabase,
} from './core'

// Creator welcome: sent once a creator's profile is complete (every
// required item in getProfileCompleteness) and their follower total
// reaches the threshold in platform_settings.

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://infoishai.com'
const CHUNK = 200

export const FOLLOWER_THRESHOLD_KEY = 'founder_creator_min_followers'
export const DEFAULT_FOLLOWER_THRESHOLD = 10000

export async function getCreatorFollowerThreshold(supabase: Supabase): Promise<number> {
  const { data } = await supabase.from('platform_settings').select('value').eq('key', FOLLOWER_THRESHOLD_KEY).maybeSingle()
  const value = Number(data?.value)
  return Number.isFinite(value) && value >= 0 ? Math.floor(value) : DEFAULT_FOLLOWER_THRESHOLD
}

export interface CreatorWelcomeData {
  username: string
  displayName: string | null
  followers: number
  platforms: string[]
  hasRates: boolean
}

interface CreatorRow {
  id: string
  user_id: string
  username: string
  display_name: string | null
  bio: string | null
  profile_photo_url: string | null
  niches: string[] | null
  country: string | null
  total_followers: number | null
  hidden_from_marketplace: boolean | null
}

interface PlatformRow {
  creator_id: string
  platform: string
  platform_username: string | null
  followers: number | null
}

interface ServiceRow {
  creator_id: string
  price: number | null
  is_active: boolean | null
}

const CREATOR_FIELDS =
  'id, user_id, username, display_name, bio, profile_photo_url, niches, country, total_followers, hidden_from_marketplace'

function summarize(
  creator: CreatorRow,
  platforms: PlatformRow[],
  services: ServiceRow[]
): { data: CreatorWelcomeData; completeness: ProfileCompleteness } {
  const completeness = getProfileCompleteness({ ...creator, creator_platforms: platforms, creator_services: services })
  // POST /api/creators stores total_followers as 0 even when it saves
  // platforms, so fall back to the platform sum when that's higher.
  const platformSum = platforms.reduce((sum, p) => sum + (p.followers || 0), 0)
  return {
    completeness,
    data: {
      username: creator.username,
      displayName: creator.display_name,
      followers: Math.max(creator.total_followers ?? 0, platformSum),
      platforms: platforms.map((p) => platformName(p.platform)),
      hasRates: !completeness.missing.some((m) => m.id === 'services'),
    },
  }
}

// The creator's current data, plus whether they qualify for the welcome.
export async function loadCreatorWelcome(
  supabase: Supabase,
  userId: string,
  threshold: number
): Promise<{ data: CreatorWelcomeData; qualifies: boolean } | null> {
  const { data: creator, error } = await supabase.from('creators').select(CREATOR_FIELDS).eq('user_id', userId).maybeSingle()
  if (error) {throw error}
  if (!creator) {return null}

  const [{ data: platforms }, { data: services }] = await Promise.all([
    supabase.from('creator_platforms').select('creator_id, platform, platform_username, followers').eq('creator_id', creator.id),
    supabase.from('creator_services').select('creator_id, price, is_active').eq('creator_id', creator.id),
  ])
  const { data, completeness } = summarize(creator as CreatorRow, platforms ?? [], services ?? [])
  return { data, qualifies: completeness.isComplete && data.followers >= threshold }
}

export const SAMPLE_CREATOR_WELCOME: CreatorWelcomeData = {
  username: 'yourname',
  displayName: 'Alex Rivera',
  followers: 48200,
  platforms: ['YouTube', 'LinkedIn'],
  hasRates: false,
}

function formatFollowers(n: number): string {
  return n.toLocaleString('en-US')
}

const codeBlockStyle =
  'margin: 0 0 16px 0; padding: 12px; background-color: #f3f4f6; border-radius: 8px; font-family: Menlo, Consolas, monospace; font-size: 12px; line-height: 1.5; color: #111827; white-space: pre-wrap; word-break: break-all;'
const linkStyle = 'color: #b153c8; text-decoration: underline;'

export function creatorWelcomeTemplate(
  data: CreatorWelcomeData,
  sender: FounderSender,
  footer: { manageSettingsUrl: string; unsubscribeUrl: string }
): { subject: string; html: string; text: string } {
  const name = data.displayName?.trim() || data.username
  const profileUrl = `${APP_URL}/creators/${encodeURIComponent(data.username)}`
  const bioLink = profileShareUrl(data.username)
  const snippet = badgeHtmlSnippet(data.username, 'light')
  const previewUrl = badgeImageUrl(data.username, 'light')
  const ratesUrl = `${APP_URL}/settings?tab=services`
  const signature = founderSignature(sender)
  const followers = formatFollowers(data.followers)

  const ratesHtml = data.hasRates
    ? ''
    : paragraph(
        `One more step: add your services and rates. Brands reply faster when your prices are on your profile. <a href="${ratesUrl}" style="${linkStyle}">Add your rates</a>`
      )
  const ratesText = data.hasRates
    ? ''
    : `One more step: add your services and rates. Brands reply faster when your prices are on your profile.\nAdd your rates: ${ratesUrl}\n\n`

  const bodyHtml =
    paragraph(`Hi ${escapeHtml(name)},`) +
    paragraph(
      `${escapeHtml(founderIntro(sender))} Your profile is complete, and I wanted to say thank you for joining. With ${followers} followers, you are the kind of creator tech brands come here to find.`
    ) +
    paragraph(`Your profile: <a href="${profileUrl}" style="${linkStyle}">${escapeHtml(profileUrl)}</a>`) +
    paragraph('Two ways to bring brands to your profile:') +
    paragraph(`<strong>1. Add this link to your bio.</strong><br /><a href="${bioLink}" style="${linkStyle}">${escapeHtml(bioLink)}</a>`) +
    paragraph('<strong>2. Put the Infoishai badge on your website.</strong> Paste this HTML:') +
    `<pre style="${codeBlockStyle}">${escapeHtml(snippet)}</pre>` +
    paragraph(`<a href="${previewUrl}" style="${linkStyle}">See how the badge looks</a>`) +
    ratesHtml +
    paragraph('Infoishai is free for creators, with no platform fees.') +
    paragraph('If you have a question or an idea, reply to this email. It comes straight to me.') +
    signature.html

  const bodyText =
    `Hi ${name},\n\n` +
    `${founderIntro(sender)} Your profile is complete, and I wanted to say thank you for joining. With ${followers} followers, you are the kind of creator tech brands come here to find.\n\n` +
    `Your profile: ${profileUrl}\n\n` +
    'Two ways to bring brands to your profile:\n\n' +
    `1. Add this link to your bio.\n${bioLink}\n\n` +
    `2. Put the Infoishai badge on your website. Paste this HTML:\n${snippet}\n\n` +
    `See how the badge looks: ${previewUrl}\n\n` +
    ratesText +
    'Infoishai is free for creators, with no platform fees.\n\n' +
    'If you have a question or an idea, reply to this email. It comes straight to me.\n\n' +
    signature.text

  const { html, text } = renderLayout({
    preheader: 'A note from the founder, plus your profile badge.',
    heading: 'Welcome to Infoishai',
    bodyHtml,
    bodyText,
    buttonLabel: 'View your profile',
    buttonUrl: profileUrl,
    footerLinks: footer,
  })
  return { subject: `Welcome to Infoishai, ${name}`, html, text }
}

export function creatorQualifiedNotice(data: CreatorWelcomeData, threshold: number): FounderNotice {
  const name = data.displayName?.trim() || data.username
  const profileUrl = `${APP_URL}/creators/${encodeURIComponent(data.username)}`
  return {
    subject: `New creator over ${formatFollowers(threshold)}: ${name} (${formatFollowers(data.followers)} followers)`,
    heading: 'A creator completed their profile',
    rows: [
      ['Name', name],
      ['Username', `@${data.username}`],
      ['Followers', formatFollowers(data.followers)],
      ['Platforms', data.platforms.join(', ') || 'None'],
      ['Profile', profileUrl],
    ],
    linkLabel: 'Open profile',
    linkUrl: profileUrl,
    activityAction: 'founder_creator_qualified',
  }
}

export interface FounderAudience {
  userIds: string[]
  alreadyHandled: number
  contacted: number
  optedOut: number
}

async function inChunks<T>(ids: string[], load: (chunk: string[]) => Promise<T[]>): Promise<T[]> {
  const out: T[] = []
  for (let i = 0; i < ids.length; i += CHUNK) {out.push(...(await load(ids.slice(i, i + CHUNK))))}
  return out
}

// Existing creators who qualify today and have never had the welcome
// queued: visible, complete, over the threshold, not contacted, not opted out.
export async function getCreatorWelcomeAudience(supabase: Supabase): Promise<FounderAudience> {
  const threshold = await getCreatorFollowerThreshold(supabase)
  const { data: creators, error } = await supabase.from('creators').select(CREATOR_FIELDS).limit(5000)
  if (error) {throw error}
  const audience: FounderAudience = { userIds: [], alreadyHandled: 0, contacted: 0, optedOut: 0 }
  if (!creators?.length) {return audience}

  const userIds = creators.map((c) => c.user_id)
  const creatorIds = creators.map((c) => c.id)
  const [users, platforms, services, rows] = await Promise.all([
    inChunks(userIds, async (chunk) => {
      const { data, error: e } = await supabase
        .from('users')
        .select('id, email, deleted_at, is_active, email_preferences, founder_contacted_at')
        .in('id', chunk)
      if (e) {throw e}
      return data ?? []
    }),
    inChunks(creatorIds, async (chunk) => {
      const { data, error: e } = await supabase.from('creator_platforms').select('creator_id, platform, platform_username, followers').in('creator_id', chunk)
      if (e) {throw e}
      return (data ?? []) as PlatformRow[]
    }),
    inChunks(creatorIds, async (chunk) => {
      const { data, error: e } = await supabase.from('creator_services').select('creator_id, price, is_active').in('creator_id', chunk)
      if (e) {throw e}
      return (data ?? []) as ServiceRow[]
    }),
    inChunks(userIds, async (chunk) => {
      const { data, error: e } = await supabase.from('founder_emails').select('user_id').eq('kind', 'creator_welcome').in('user_id', chunk)
      if (e) {throw e}
      return data ?? []
    }),
  ])

  const userById = new Map(users.map((u) => [u.id, u]))
  const handled = new Set(rows.map((r) => r.user_id))

  for (const creator of creators as CreatorRow[]) {
    const user = userById.get(creator.user_id)
    if (!user?.email) {continue}
    if (!isAccountVisible({ deletedAt: user.deleted_at, isActive: user.is_active, hidden: !!creator.hidden_from_marketplace })) {continue}

    const { data, completeness } = summarize(
      creator,
      platforms.filter((p) => p.creator_id === creator.id),
      services.filter((s) => s.creator_id === creator.id)
    )
    if (!completeness.isComplete || data.followers < threshold) {continue}

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
