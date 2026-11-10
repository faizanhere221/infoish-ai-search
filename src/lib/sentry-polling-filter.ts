// Shared between sentry.server.config.ts (ignoreIncomingRequests) and
// src/instrumentation-client.ts (shouldCreateSpanForRequest) so both sides
// of a polled request — the browser's outgoing fetch and our own incoming
// request handling — skip span creation the same way, from one definition.
//
// Matches GET /api/dashboard/activity (the shared once-a-minute check, see
// useActivity), GET /api/conversations (the inbox list, reloaded when that
// check reports a change) and GET /api/conversations/<id>/messages (polled
// every 10s by useConversationThread while a thread is open).
const POLLED_ENDPOINT_PATTERN =
  /\/api\/(?:dashboard\/activity|conversations(?:\/[^/?]+\/messages)?)(?:\?[^/]*)?$/

export function isPolledEndpoint(urlOrPath: string): boolean {
  return POLLED_ENDPOINT_PATTERN.test(urlOrPath)
}
