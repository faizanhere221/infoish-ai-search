const BASE_URL = 'https://infoishai.com'

// Other JSON-LD blocks reference the Organization by this @id instead of
// repeating it, so only one Organization renders per page.
export const ORGANIZATION_ID = `${BASE_URL}/#organization`
const WEBSITE_ID = `${BASE_URL}/#website`

export function OrganizationJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    name: 'Infoishai',
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    description: 'A free B2B marketplace connecting tech brands with tech content creators on YouTube, X, LinkedIn, newsletters, and podcasts.',
    areaServed: ['US', 'GB', 'CA', 'IN', 'PK', 'AU', 'DE', 'NL', 'SG'],
    // Only profiles the site itself links to. Add X/YouTube here once confirmed.
    sameAs: ['https://www.linkedin.com/company/infoishai'],
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'support@infoishai.com',
      contactType: 'customer service',
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function WebSiteJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: 'Infoishai',
    url: BASE_URL,
    publisher: { '@id': ORGANIZATION_ID },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function PersonJsonLd({
  name,
  username,
  description,
  image,
  sameAs,
}: {
  name: string
  username: string
  description?: string
  image?: string
  sameAs?: string[]
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: {
      '@type': 'Person',
      name,
      url: `${BASE_URL}/creators/${username}`,
      ...(description && { description }),
      ...(image && { image }),
      ...(sameAs && sameAs.length > 0 && { sameAs }),
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
