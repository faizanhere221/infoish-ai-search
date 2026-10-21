interface GoogleAccountsId {
  initialize: (config: Record<string, unknown>) => void
  prompt: (callback?: (notification: unknown) => void) => void
  renderButton: (element: HTMLElement, config: Record<string, unknown>) => void
  disableAutoSelect: () => void
  cancel: () => void
  revoke: (hint: string, callback: () => void) => void
}

interface GoogleAccounts {
  id: GoogleAccountsId
}

interface Google {
  accounts: GoogleAccounts
}

// Window.gtag / Window.dataLayer are declared once, in src/lib/analytics.ts
// — don't redeclare them here, that's what caused a TS2717 conflict
// (identical property names, different types) when both existed at once.
interface Window {
  google?: Google
}
