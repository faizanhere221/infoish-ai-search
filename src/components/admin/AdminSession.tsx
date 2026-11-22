'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'

// The identity of the CURRENT admin session, from GET /api/admin/auth/me
// (which reads the verified auth_token cookie). The header, sidebar and
// every role-based button read this. localStorage is never trusted for who
// is signed in: an earlier login in the same browser left admin_email /
// admin_role behind, which is how a team member saw the super admin's email.

export interface AdminSessionUser {
  id: string
  email: string
  role: 'admin' | 'super_admin' | 'outreach'
  display_name: string | null
  must_change_password: boolean
}

interface AdminSessionValue {
  user: AdminSessionUser | null
  loading: boolean
  isSuperAdmin: boolean
  isOutreach: boolean
  // The live staff check failed (/api/admin/auth/me): 'gone' = removed,
  // demoted or suspended; 'retry' = the check itself couldn't run.
  noAccess: false | 'gone' | 'retry'
  refresh: () => Promise<void>
}

const AdminSessionContext = createContext<AdminSessionValue>({
  user: null,
  loading: true,
  isSuperAdmin: false,
  isOutreach: false,
  noAccess: false,
  refresh: async () => {},
})

// Removes every admin_* key a previous session left in this browser.
export function clearAdminStorage(): void {
  try {
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k?.startsWith('admin_')) {keys.push(k)}
    }
    for (const k of keys) {localStorage.removeItem(k)}
  } catch {
    // storage blocked: nothing stored to clear
  }
}

// Replaces the stored admin_* keys with the current session's values (kept
// only as a convenience for older code paths; nothing reads them for auth).
export function storeAdminSession(user: { email: string; role: string }): void {
  clearAdminStorage()
  try {
    localStorage.setItem('admin_email', user.email)
    localStorage.setItem('admin_role', user.role)
  } catch {
    // storage blocked
  }
}

export function AdminSessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminSessionUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [noAccess, setNoAccess] = useState<false | 'gone' | 'retry'>(false)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/auth/me', { cache: 'no-store' })
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { code?: string } | null
        if (body?.code === 'no_staff_access') {setNoAccess('gone')}
        else if (body?.code === 'staff_check_failed') {setNoAccess('retry')}
        clearAdminStorage()
        setUser(null)
        return
      }
      setNoAccess(false)
      const data = (await res.json()) as { user: AdminSessionUser }
      setUser(data.user)
      // The cookie belongs to someone other than what this browser stored:
      // drop the old keys and store the current identity.
      let stale = true
      try {
        stale = localStorage.getItem('admin_email') !== data.user.email || localStorage.getItem('admin_role') !== data.user.role
      } catch {
        stale = false
      }
      if (stale) {storeAdminSession(data.user)}
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void refresh() }, [refresh])

  // Access can be taken away while a page is open: check again whenever the
  // tab comes back (every API call is checked live anyway, this only
  // swaps the page for the "no longer have access" message sooner).
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') {void refresh()} }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [refresh])

  return (
    <AdminSessionContext.Provider
      value={{
        user,
        loading,
        isSuperAdmin: user?.role === 'super_admin',
        isOutreach: user?.role === 'outreach',
        noAccess,
        refresh,
      }}
    >
      {children}
    </AdminSessionContext.Provider>
  )
}

export function useAdminSession(): AdminSessionValue {
  return useContext(AdminSessionContext)
}
