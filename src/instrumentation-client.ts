// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import { isPolledEndpoint } from "./lib/sentry-polling-filter";

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
  integrations: [
    // Replays only ever capture around an actual error (see
    // replaysSessionSampleRate below) and always mask page content —
    // this is diagnostic tooling, not a record of what a user typed or saw.
    Sentry.replayIntegration({ maskAllText: true, maskAllInputs: true, blockAllMedia: true }),
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

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
