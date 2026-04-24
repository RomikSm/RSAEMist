import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Vite config.
// Dev server proxies `/api` to the Spring Boot backend, which allows the
// browser to treat API requests as same-origin. That is the simplest and
// safest way to make HttpOnly JWT cookies issued by the backend work
// without any SameSite=None / Secure gymnastics in development.
//
// The proxy target can be customised with `VITE_BACKEND_URL` in `.env`.
export default defineConfig(({ mode }) => {
  // `loadEnv` resolves relative to the Vite root (cwd) when the second
  // argument is an empty string, so we avoid relying on Node's `process`
  // global and keep `@types/node` out of the dependency graph.
  const env = loadEnv(mode, '', '')
  const backendUrl = env.VITE_BACKEND_URL ?? 'http://localhost:8080'

  return {
    plugins: [react()],
    server: {
      // Listen on all interfaces so the dev server responds identically to
      // requests coming via `localhost`, `127.0.0.1`, or the LAN IP. Without
      // this Vite 5 can reject non-GET requests from a host it didn't bind
      // to with `403 Forbidden` (observed for `POST /api/v1/auth/login`
      // when opening the app via `127.0.0.1:5173` while Vite only bound
      // to `localhost`).
      host: true,
      port: 5173,
      strictPort: true,
      // Disable Vite's host header allow-list in dev — same reason as above.
      // Safe for local development only.
      allowedHosts: true,
      proxy: {
        // IMPORTANT: forward every `/api/*` call (GET, POST, OPTIONS, …) to
        // the Spring Boot backend. If this rule is missing, Vite treats a
        // `POST /api/v1/auth/login` as an unknown route and answers
        // `403 Forbidden` from its own middleware instead of returning the
        // SPA fallback. Keep `changeOrigin: true` so the backend sees the
        // right `Host` header and issues cookies for the proxy origin.
        '/api': {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
          ws: false,
        },
      },
    },
    preview: {
      port: 4173,
    },
  }
})
