// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import { isPolledEndpoint } from "./src/lib/sentry-polling-filter";

Sentry.init({
  dsn: "https://87ec6c3e151dabcc08720ebaf40844f6@o4512244228882432.ingest.us.sentry.io/4512244229079040",

  // Local dev would otherwise burn Sentry quota on every refresh and every
  // 3s/10s poll tick. Errors from `npm run dev` never reach Sentry —
  // reproduce locally, then verify against a production build.
  enabled: process.env.NODE_ENV === "production",

  // httpIntegration is included by default; re-declared here (same
  // integration name, so this overrides rather than adds a second one) to
  // set ignoreIncomingRequests: usePolling hits GET /api/conversations and
  // GET /api/conversations/*/messages every 3-10s, and an incoming-request
  // span would otherwise be created for every poll tick on the server side
  // too, on top of the client-side filtering in instrumentation-client.ts.
  integrations: [
    Sentry.httpIntegration({
      ignoreIncomingRequests: (urlPath) => isPolledEndpoint(urlPath),
    }),
  ],

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 0.1,

  dataCollection: {
    // To disable sending user data and HTTP bodies, uncomment the lines below. For more info visit:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#dataCollection
    // userInfo: false,
    // httpBodies: [],
  },
});
