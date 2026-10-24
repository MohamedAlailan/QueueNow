# QueueNow integration and operations

The React app now reads the Laravel API. Queue data, numbering and transitions are
owned by the database; refreshing the browser does not reset a queue. Five-second
polling refreshes patient status and employee dashboards. Browser session storage
contains only employee credentials/session metadata and patient ticket access
capabilities, never a queue database. Language preference still uses localStorage.

## Start Laravel

Use PHP 8.2+ (tested with 8.3), Composer, and PDO for your database, plus mbstring,
XML/DOM, curl and standard Laravel extensions. PostgreSQL is the existing default;
SQLite works for local development and tests. Set the database timezone/application
`APP_TIMEZONE` consistently with your clinic; queue dates and model clock features
use the application's timezone (UTC unless configured otherwise).

```sh
cd backend
composer install
cp .env.example .env
php artisan key:generate
# Configure DB_* in .env. For SQLite: DB_CONNECTION=sqlite and an absolute DB_DATABASE path.
# Create that SQLite file first if needed.
php artisan migrate --seed
php artisan serve --host=127.0.0.1 --port=8000
```

For an existing database run `php artisan migrate`, not `migrate:fresh`.
The new migrations preserve existing rows. Existing employees have no login
credentials and are initially unavailable. Existing services have null AI fields;
there is intentionally no guessed mapping from Dental/Pediatrics to model classes.

Provision an employee through the terminal (password is prompted and hashed):

```sh
php artisan employee:credentials staff@example.com --service=1 --name="Staff Name" --available
```

This creates/updates the employee for that email. The `--available` flag explicitly
marks this employee as staffed; running without the flag marks them unavailable.
This represents configured staffing, not inferred login presence or shift tracking.
Seeded employees have no shared/default password. Tokens expire after 12 hours and
logout revokes the current token. Employee API authorization always checks the
employee's actual assigned service; browser session fields are not authority.
Service create/update requires an authenticated employee with ADMIN role.

## Start React

```sh
cd frontend
npm ci
cp .env.example .env
npm run dev
```

Open http://localhost:5173. Vite proxies `/api` to Laravel on 127.0.0.1:8000.
For deployment serve the built SPA and `/api` on the same origin (including SPA
fallback for `/queue/:id`), or configure `VITE_API_BASE_URL` and Laravel CORS for
an explicitly allowed frontend origin. Vite's development proxy is not used by
`npm run preview` or production hosting. Do not expose the AI service publicly.

## API contract

All paths below are relative to `/api/v1`; send `Accept: application/json`.

| Operation | Endpoint | Authorization / result |
| --- | --- | --- |
| Service catalog | `GET /services` | Public; `data` contains DB names, is_open, waiting_count, current_ticket_number, type, avg_service_time; no employee credentials or ticket list |
| Take ticket | `POST /tickets` with `service_id` | Public; 201 returns id/ticket_id, service_id, ticket_number, status, service, people_ahead, estimated_waiting_time_minutes, estimate_source and a one-time access_token |
| Track ticket | `GET /tickets/{id}` | `X-Ticket-Token` from creation; same detail shape, without access_token |
| Cancel waiting ticket | `PATCH /tickets/{id}/cancel` | `X-Ticket-Token`; returns `ticket`; only WAITING is cancellable |
| Employee login | `POST /employee/login` with email/password | Returns token and employee; invalid credentials 401; rate limited |
| Session | `GET /employee/me`, `POST /employee/logout` | Bearer token |
| Employee queue | `GET /employee/queue` | Bearer token; `tickets` for assigned service and today, including terminal history |
| Waiting list | `GET /services/{id}/waiting-list` | Bearer token; assigned service, today, WAITING only |
| Next | `POST /services/{id}/next` | Bearer token; returns `ticket`; assigned service only, oldest WAITING today |
| Start / Done / Skip | `POST /tickets/{id}/start`, `/done`, `/skip` | Bearer token; returns `ticket`; assigned service only |

Patient access tokens are capabilities: keep them private. The frontend stores them
in the current browser tab's session; copying only a numeric URL to another browser
does not grant access. Legacy tickets without a capability cannot be accessed by
patient endpoints; issue a new ticket. Employee queue/history remains available.
The public catalog exposes counts and currently called numbers, not patient tokens.

Transitions: WAITING → CALLED or CANCELLED; CALLED → SERVING or SKIPPED;
SERVING → DONE. Terminal states cannot transition. Invalid transitions and busy
Next return 409; empty Next and unknown resources return 404; wrong service/token
returns 403; bad input returns 422. Closed service creation returns 409.

Each service permits one CALLED/SERVING ticket at a time, matching the existing MVP
employee UI. Queue mutations lock the service then the ticket/counter in a
transaction. Daily numbering is unique per service/date. Yesterday's WAITING
rows are retained for history but never selected by today's Next.

## AI service

Use Python 3.11 or 3.12 (tested with 3.12). Dependencies are pinned in
`backend/ai-service/requirements.txt`; scikit-learn 1.6.1 matches the saved
preprocessor and Keras 3.13.2 matches model metadata. The pickle also references
dill, which is included. Only load the repository's trusted artifacts.

```sh
cd backend/ai-service
python3.12 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --host 127.0.0.1 --port 8001
```

Set `AI_SERVICE_URL=http://127.0.0.1:8001` in Laravel `.env`. Port 8000 belongs
to Laravel. After configuration changes run `php artisan config:clear` (or rebuild
your deployment's config cache). Inference resolves all three artifacts relative
to `predict.py`, so the working directory does not affect model loading. Artifacts
load lazily once per process. `/health` reports liveness only; `/predict` exercises
model readiness. Invalid features return 422; inference/artifact failures return
503 without exposing internal paths. Laravel uses a bounded five-second timeout.

Configure `services.type` and `services.avg_service_time` with real operational
values through an ADMIN `PATCH /api/v1/services/{id}` or controlled database admin
workflow. `type` is one of consultation/checkup/lab_test/payment; duration must be
positive minutes. These labels are model classes, not UI service names. Do not map
a clinical service to a class without the model owner's agreement. Update employee
staffing explicitly as availability changes.

| Feature | Source and units |
| --- | --- |
| queue_length_before | Older active tickets (WAITING/CALLED/SERVING) for the same service and queue date; terminal tickets are excluded |
| avg_service_time | Explicit `services.avg_service_time`, positive minutes |
| available_staff | Count of employees assigned to that service with is_available=true |
| previous_waiting_time | Latest earlier DONE ticket for that service with started_at: `(started_at - created_at)` in fractional minutes; never updated_at/finished_at minus created_at |
| hour | Ticket arrival hour in app timezone, 0–23 |
| day_of_week | Arrival day, ISO weekday minus one: Monday=0, Sunday=6 |
| service_type | Explicit `services.type`, validated model vocabulary |

`people_ahead` and estimates are refreshed from current active queue state. A
non-WAITING ticket returns zero remaining wait with source `not_waiting`. If staff
and duration exist, a transparent capacity estimate is `people_ahead * duration /
staff`, with source `capacity`. This is a rough heuristic, not a model prediction.
If history/class is missing or AI fails/returns invalid data, this heuristic is
used. With no staff or duration the estimate is null and source `unavailable`.
No fabricated 2 staff, 10-minute history, checkup class or fixed 15-minute forecast
is sent or displayed as AI output. AI estimates are not promises; model calibration
on real clinic data and multi-counter scheduling remain separate product work.

## Verification

```sh
cd backend
php artisan test
# Fresh tests use SQLite :memory:, not your configured application database.
cd ../frontend
npm run lint
npm run build
cd ../backend/ai-service
pip install -r requirements-dev.txt
pytest -q
python predict.py
```

Backend integration tests cover the lifecycle, invalid/terminal transitions, closed
services, cancellation, empty/busy queues, service boundaries, auth/revocation,
patient capabilities, daily numbering, correct AI features and missing/invalid
prediction behavior. Python tests validate the HTTP feature contract and errors;
`python predict.py` is the real saved-artifact smoke test. SQLite tests do not prove
PostgreSQL lock contention behavior; run parallel Next/create/cancel requests on
your deployment database before production rollout.

Manual/browser acceptance: take a ticket, reload its tracking page, log in in a
second browser context, Next → Start → Done, and observe patient polling. Repeat
with Skip, patient cancellation while WAITING, empty Next, closed service, bad
credentials, another employee's service, and a stopped AI server. Failed requests
must show errors without creating fake success or changing a local queue.

### Automated browser test

With PHP/Composer dependencies installed and no listeners on ports 8000/5173:

```sh
cd frontend
npx playwright install chromium
npm run test:e2e
```

The runner creates a disposable SQLite database and fixtures, starts real Laravel
and Vite servers, drives two isolated Chromium contexts through Take Ticket →
Next → Start → Done, polling, reload, cancellation, skip, service filtering and an
error page, then cleans up. Set `PHP_BIN` for a non-default PHP executable.
It never migrates your application database. All three check groups are also
configured in `.github/workflows/integration.yml` for pull requests.

### Reviewed verification (2026-10-24)

PHP 8.3: 15 tests passed (98 assertions); frontend lint and production build
passed; real Chromium/Laravel/SQLite end-to-end runner passed. Python 3.12:
3 HTTP contract tests passed and saved-artifact inference returned 17.1 minutes
for the documented example on CPU. These results do not establish production
PostgreSQL concurrency behavior or clinical prediction accuracy.
