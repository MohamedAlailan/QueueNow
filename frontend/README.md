# QueueNow Web Client

React application for visitor ticket tracking and employee queue operations. The client reads service and queue data from the Laravel API and supports English and Arabic interfaces.

## Stack

React 19, Vite 8, React Router 7, Tailwind CSS 4, and Lucide icons. Playwright drives the real-browser acceptance test. Use Node.js 24 and npm to match CI.

## Getting started

Run from this directory:

```sh
npm ci
cp .env.example .env
npm run dev
```

Start Laravel separately on `http://127.0.0.1:8000`, then open **http://localhost:5173**. The Vite development server proxies `/api` to Laravel. Follow the [API setup](../backend/README.md) to migrate the database and provision an employee account.

## Application routes

| Route | Purpose |
| --- | --- |
| `/` | Landing page |
| `/services` | Database-backed service catalog |
| `/services/:serviceId` | Service details and ticket creation |
| `/ticket-success/:ticketId` | Ticket confirmation |
| `/queue` | Redirect to the current tab's active ticket, or the catalog |
| `/queue/:ticketId` | Ticket status, people ahead, estimated wait, and permitted cancellation |
| `/login` | Employee email/password login |
| `/employee` | Assigned-service dashboard |
| `/employee/waiting` | Waiting queue |
| `/employee/current` | Current ticket controls |
| `/employee/history` | Today's terminal-ticket history |

Employee pages require a session token. The API independently enforces authentication, service assignment, and state transitions.

## API and browser state

`VITE_API_BASE_URL` defaults to `/api/v1`. Set it before building if the API uses a different origin or path. Vite environment values are embedded in the client bundle; do not put secrets in them.

Queue data is owned by Laravel. The client polls every five seconds, applies confirmed mutation responses, and displays loading and request errors. Unsupported employee cancellation is not offered; Next remains disabled while a ticket is active.

| Browser storage | Contents |
| --- | --- |
| `sessionStorage` | Employee bearer token and display metadata; visitor ticket capabilities and active ticket ID |
| `localStorage` | Language preference |

Clearing session storage removes the current tab's access. A visitor ticket URL alone does not authorize tracking or cancellation. Server-side logout revokes the current employee token.

The UI distinguishes model predictions from approximate capacity estimates and unavailable estimates. It does not substitute a fixed waiting time when data is missing.

## Commands

| Command | Result |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run lint` | Check JavaScript and React sources |
| `npm run build` | Generate production assets in `dist/` |
| `npm run preview` | Preview the built assets; API proxy is not enabled |
| `npm run test:e2e` | Run the real React/Laravel browser acceptance flow |

## Browser acceptance test

Install Laravel dependencies in `../backend` and prepare `../backend/.env` from its example first. Then run:

```sh
npx playwright install chromium
npm run test:e2e
```

Leave ports `8000` and `5173` free. The runner creates a disposable SQLite database, loads test fixtures, starts Laravel and Vite, and uses isolated Chromium contexts for visitor and employee workflows. It covers ticket creation, reload, login, Next → Start → Done, polling, cancellation, skip, service filtering, and error feedback. Set `PHP_BIN` if PHP is not available under the default executable name.

## Production deployment

Build with `npm run build` and serve `dist/` using a web server that falls back to `index.html` for SPA routes. Route `/api` to Laravel on the same origin, or configure the build-time API URL and Laravel CORS for the intended origin.

The Vite development proxy is not included in `dist/` and does not run under `npm run preview`. An inference server is never called directly by the browser; Laravel manages prediction requests.

See [Integration and operations](../docs/INTEGRATION.md) for the complete API contract, authentication setup, model configuration, and deployment limitations.
