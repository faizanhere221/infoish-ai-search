// Shared between sentry.server.config.ts (ignoreIncomingRequests) and
// src/instrumentation-client.ts (shouldCreateSpanForRequest) so both sides
// of a polled request — the browser's outgoing fetch and our own incoming
// request handling — skip span creation the same way, from one definition.
//
// Matches GET /api/conversations (the list, polled every 10s by
// useConversationsList) and GET /api/conversations/<id>/messages (polled
// every 3s by useConversationThread while a thread is open).
const POLLED_ENDPOINT_PATTERN = /\/api\/conversations(?:\/[^/?]+\/messages)?(?:\?[^/]*)?$/

export function isPolledEndpoint(urlOrPath: string): boolean {
  return POLLED_ENDPOINT_PATTERN.test(urlOrPath)
}
