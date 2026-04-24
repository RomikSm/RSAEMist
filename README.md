# RSAEmist® Rail Sentinel — Alert Review (Frontend)

React + TypeScript + Vite client for the `sentinel` Spring Boot API.

## How it talks to the backend

* Base API path: `VITE_API_BASE_URL` (default `/api/v1`).
* In development, Vite proxies the `/api` prefix to `VITE_BACKEND_URL`
  (default `http://localhost:8080`). This makes the browser treat API
  calls as **same-origin**, so the HttpOnly JWT cookies issued by
  `/api/v1/auth/login` are accepted without any SameSite workarounds.
* Every request uses `credentials: 'include'` — see `src/api/client.ts`.
* On a `401` the client silently calls `/api/v1/auth/refresh` once and
  retries the original request. If refresh fails the session is cleared
  and the login screen is shown.

## Project layout

```
src/
  api/               # Typed API client (types, fetch wrapper, per-resource modules)
  hooks/             # useApi + feature-specific hooks (useMessages, useMessage)
  utils/format.ts    # Date / g-force formatting helpers
  components/        # Sidebar, MapPanel, DetailPanel, TopBar, LoginForm
  AuthContext.tsx    # Session state, login/logout, startup refresh probe
  ThemeContext.tsx   # Dark / light theme toggle
  App.tsx            # Auth-gated shell
```

## Scripts

```sh
npm install       # restore dependencies
npm run dev       # Vite dev server on http://localhost:5173
npm run build     # type-check + production bundle into dist/
npm run preview   # serve the built bundle
npm run typecheck # tsc --noEmit
```

## Environment

Copy `.env.example` → `.env.local` and adjust:

```
VITE_BACKEND_URL=http://localhost:8080
VITE_API_BASE_URL=/api/v1
```

The backend's allowed CORS origins already include `http://localhost:5173`,
but the dev proxy means CORS is not actually exercised locally.
