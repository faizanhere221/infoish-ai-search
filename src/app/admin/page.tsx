import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { jwtVerify } from 'jose'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Admin',
  description: 'Infoishai admin panel.',
  robots: { index: false, follow: false },
}

// /admin has no page of its own: it sends each session to its home.
// middleware.ts only checks /admin/* (with the slash), so this server
// component verifies the auth_token cookie itself, the same way.
//   admin, super_admin  → /admin/dashboard
//   outreach            → /admin/outreach
//   must change password → /admin/change-password
//   anything else       → /admin/login
export default async function AdminIndexPage() {
  const secret = process.env.JWT_SECRET
  const token = cookies().get('auth_token')?.value

  let role = ''
  let mustChangePassword = false
  if (secret && token) {
    try {
      const { payload } = await jwtVerify(token, new TextEncoder().encode(secret))
      role = String(payload.role ?? '')
      mustChangePassword = payload.mustChangePassword === true
    } catch {
      role = ''
    }
  }

  // redirect() throws, so it stays outside the try/catch above.
  if (role === 'admin' || role === 'super_admin' || role === 'outreach') {
    if (mustChangePassword) {redirect('/admin/change-password')}
    redirect(role === 'outreach' ? '/admin/outreach' : '/admin/dashboard')
  }
  redirect('/admin/login')
}
