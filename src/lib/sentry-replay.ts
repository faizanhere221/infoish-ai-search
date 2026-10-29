// Loaded on demand by src/instrumentation-client.ts via dynamic import(), so
// Session Replay (rrweb, ~40 KiB gzipped) lands in its own async chunk instead
// of the JS every page downloads up front.
import { addIntegration, replayIntegration } from '@sentry/nextjs'

export function addSentryReplay(): void {
  // Replays only ever capture around an actual error (see
  // replaysSessionSampleRate in instrumentation-client.ts) and always mask
  // page content — this is diagnostic tooling, not a record of what a user
  // typed or saw.
  addIntegration(replayIntegration({ maskAllText: true, maskAllInputs: true, blockAllMedia: true }))
}
