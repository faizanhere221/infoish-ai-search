// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import { isPolledEndpoint } from "./lib/sentry-polling-filter";

// Sentry.init() itself must never be able to crash the page — a bad
// init (e.g. an SDK/Next.js version mismatch at runtime) would otherwise
// throw before React hydrates, taking every other client component
// (including CookieConsent) down with it.
try {
  Sentry.init({
    dsn: "https://87ec6c3e151dabcc08720ebaf40844f6@o4512244228882432.ingest.us.sentry.io/4512244229079040",

    // Local dev would otherwise burn Sentry quota on every refresh and every
    // 3s/10s poll tick, and spam the console with CSP/tunnel noise in a
    // half-configured dev environment. Errors from `npm run dev` never reach
    // Sentry — reproduce locally, then verify against a production build.
    enabled: process.env.NODE_ENV === "production",

    // Add optional integrations for additional features. browserTracingIntegration
    // is included by default whenever tracesSampleRate is set, but is re-declared
    // explicitly here (same integration name, so this overrides the default
    // rather than adding a second one) to set shouldCreateSpanForRequest: our
    // usePolling hook hits GET /api/conversations and
    // GET /api/conversations/*/messages every 3-10s, and a span would
    // otherwise be created for every single poll tick, burning trace quota on
    // requests that are never interesting on their own.
    // Session Replay is not listed here: it's added lazily below, only for
    // signed-in visitors, so public pages don't ship rrweb at all.
    integrations: [
      Sentry.browserTracingIntegration({
        shouldCreateSpanForRequest: (url) => !isPolledEndpoint(url),
      }),
    ],

    // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
    tracesSampleRate: 0.1,

    // No ambient session replay — only capture around an actual error.
    replaysSessionSampleRate: 0,

    // Define how likely Replay events are sampled when an error occurs.
    replaysOnErrorSampleRate: 0.1,

    dataCollection: {
      // To disable sending user data and HTTP bodies, uncomment the lines below. For more info visit:
      // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#dataCollection
      // userInfo: false,
      // httpBodies: [],
    },
  });
} catch (e) {
  console.error('Sentry init failed:', e);
}

// Error replays are only useful inside the logged-in app (dashboard,
// messages, campaign workflow), and anonymous visitors on public pages
// should never download rrweb. So the replay integration is fetched only
// when an auth token is present, once the browser is idle, keeping it off
// the critical path for LCP/TBT. A visitor who signs in mid-session picks it
// up on their next full page load.
function hasAuthToken(): boolean {
  try {
    return !!window.localStorage.getItem('auth_token');
  } catch {
    return false;
  }
}

if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined' && hasAuthToken()) {
  const loadReplay = () => {
    import('./lib/sentry-replay')
      .then((m) => m.addSentryReplay())
      .catch(() => {
        // Replay is optional diagnostics; never let a failed chunk load surface.
      });
  };
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(loadReplay, { timeout: 5000 });
  } else {
    setTimeout(loadReplay, 3000);
  }
}

// captureRouterTransitionStart is a Next.js 15 App Router hook — this repo
// is on Next.js 14.2.35, where it may not exist on the SDK's export surface
// at runtime even if the type still does, so guard it instead of assuming.
export const onRouterTransitionStart =
  typeof Sentry.captureRouterTransitionStart === 'function' ? Sentry.captureRouterTransitionStart : undefined;
