// "Find me on Infoishai" badge: the SVG served at /badge/[username].svg and
// the share snippets shown in creator settings. Both live here so the badge
// dimensions in the HTML snippet always match the SVG.

export const BADGE_WIDTH = 190
export const BADGE_HEIGHT = 40
export const BADGE_REF = 'badge'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://infoishai.com'

export type BadgeTheme = 'light' | 'dark'

const THEMES: Record<BadgeTheme, { bg: string; border: string; text: string; muted: string }> = {
  light: { bg: '#FFFFFF', border: '#E5E7EB', text: '#1A1A2E', muted: '#4B5563' },
  dark: { bg: '#1A1A2E', border: '#34345A', text: '#FFFFFF', muted: '#C7C7D9' },
}

// Static markup: no user data goes into the SVG, so there is nothing to escape.
export function renderBadgeSvg(theme: BadgeTheme): string {
  const t = THEMES[theme]
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${BADGE_WIDTH}" height="${BADGE_HEIGHT}" viewBox="0 0 ${BADGE_WIDTH} ${BADGE_HEIGHT}" role="img" aria-label="Find me on Infoishai">
<title>Find me on Infoishai</title>
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#de5688"/><stop offset="1" stop-color="#b153c8"/></linearGradient></defs>
<rect x="0.5" y="0.5" width="${BADGE_WIDTH - 1}" height="${BADGE_HEIGHT - 1}" rx="9" fill="${t.bg}" stroke="${t.border}"/>
<g fill="url(#g)" transform="translate(13 8)"><rect x="0" y="0" width="14" height="3.5" rx="1"/><rect x="4.5" y="2" width="5" height="20"/><rect x="0" y="20.5" width="14" height="3.5" rx="1"/></g>
<text x="38" y="25" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif" font-size="13.5" fill="${t.muted}">Find me on <tspan font-weight="700" fill="${t.text}">Infoishai</tspan></text>
</svg>`
}

export function profileShareUrl(username: string): string {
  return `${SITE_URL}/creators/${encodeURIComponent(username)}?ref=${BADGE_REF}`
}

export function badgeImageUrl(username: string, theme: BadgeTheme): string {
  return `${SITE_URL}/badge/${encodeURIComponent(username)}.svg${theme === 'dark' ? '?theme=dark' : ''}`
}

// Plain followed link (no rel="nofollow") so the badge passes link equity
// to the creator's profile.
export function badgeHtmlSnippet(username: string, theme: BadgeTheme): string {
  return `<a href="${profileShareUrl(username)}" target="_blank" rel="noopener"><img src="${badgeImageUrl(username, theme)}" alt="Find me on Infoishai" width="${BADGE_WIDTH}" height="${BADGE_HEIGHT}" /></a>`
}

export function bioLine(username: string): string {
  return `Find me on Infoishai: ${profileShareUrl(username)}`
}
