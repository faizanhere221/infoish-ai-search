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
}
