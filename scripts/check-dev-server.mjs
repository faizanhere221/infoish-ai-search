// Runs automatically before `npm run build` (the "prebuild" script).
//
// `next build` deletes and rewrites .next, which breaks a `next dev` server
// that is using the same folder. If anything is listening on port 3000, stop
// here with a non-zero exit so the build never starts.
//
// Skipped on Vercel/CI (no dev server there). To build anyway, set
// ALLOW_BUILD_WITH_DEV_SERVER=1.
import net from 'node:net'

const PORT = 3000

if (process.env.VERCEL || process.env.CI || process.env.ALLOW_BUILD_WITH_DEV_SERVER === '1') {
  process.exit(0)
}

function isListening(host) {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port: PORT })
    socket.setTimeout(1000)
    socket.once('connect', () => { socket.destroy(); resolve(true) })
    socket.once('timeout', () => { socket.destroy(); resolve(false) })
    socket.once('error', () => resolve(false))
  })
}

const results = await Promise.all([isListening('127.0.0.1'), isListening('::1')])
if (results.some(Boolean)) {
  console.error(
    `\nBuild stopped: something is listening on port ${PORT} (probably \`npm run dev\`).\n` +
      'Building rewrites .next and breaks the running dev server.\n' +
      'Stop the dev server first, or set ALLOW_BUILD_WITH_DEV_SERVER=1 to build anyway.\n'
  )
  process.exit(1)
}
