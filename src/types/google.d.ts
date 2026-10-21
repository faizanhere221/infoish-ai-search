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

interface Window {
  google?: Google
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  gtag?: (...args: any[]) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dataLayer?: any[]
}
