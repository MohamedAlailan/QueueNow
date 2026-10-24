# QueueNow React frontend

React + Vite client for the Laravel queue API. The service catalog, ticket numbers,
status, queue and employee history come from Laravel. No mock queue or localStorage
authentication is used. Patient status/employee queues poll every five seconds.

```sh
npm ci
cp .env.example .env
npm run dev
```

Run Laravel on 127.0.0.1:8000; Vite proxies `/api`. Open localhost:5173. Provision
real employee credentials using the Laravel command documented in
[Integration and operations](../docs/INTEGRATION.md). Employee sessions and patient
access capabilities use sessionStorage; clearing it ends access in that tab.

`npm run lint` checks sources; `npm run build` writes `dist/`. Deploy with SPA
fallback and a same-origin `/api` reverse proxy, or explicitly configure the API
origin and CORS. `npm run preview` does not proxy API calls.

See [Integration and operations](../docs/INTEGRATION.md) for API responses,
transitions, database migrations, AI configuration and verification steps.
