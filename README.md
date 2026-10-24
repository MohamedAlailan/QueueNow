# QueueNow

QueueNow is a web-based queue management application for clinics and service desks. Visitors can take a ticket and follow their progress, while employees manage their assigned service through a dedicated dashboard.

The application combines a React interface, a Laravel REST API, a persistent database, and an optional FastAPI service for machine-learning waiting-time estimates.

## Features

- **Visitor experience:** database-backed service catalog, ticket creation, live status, people ahead, estimated waiting time, and cancellation while waiting.
- **Employee workspace:** authenticated access, service-specific waiting lists, current ticket controls, and today's ticket history.
- **Queue integrity:** transactional numbering per service and day, validated state transitions, and one active ticket per service.
- **Waiting-time estimates:** validated model inputs from operational data, with explicitly labeled capacity estimates when inference is unavailable.
- **Interface:** English and Arabic, responsive layouts, loading states, error feedback, and five-second polling.
- **Verification:** Laravel integration tests, FastAPI contract tests, a real-browser workflow test, and GitHub Actions checks.

## Architecture

| Component | Technology | Responsibility |
| --- | --- | --- |
| Web client | React 19, Vite 8, React Router, Tailwind CSS 4 | Visitor and employee interfaces |
| REST API | Laravel 12, PHP 8.2+, Laravel Sanctum | Authentication, authorization, queue operations, and estimation orchestration |
| Database | PostgreSQL by default; SQLite for local development and tests | Services, employees, tickets, daily counters, and access tokens |
| Inference service | FastAPI, TensorFlow/Keras, scikit-learn | Waiting-time regression using saved model and preprocessing artifacts |
| Browser tests | Playwright / Chromium | React-to-Laravel acceptance testing |

React calls Laravel under `/api/v1`. Laravel owns queue state and calls the private inference service when the required model features are available. The frontend does not maintain a mock queue database.

## Repository guide

| Path | Contents |
| --- | --- |
| [`frontend/`](frontend/) | React application and browser acceptance test |
| [`backend/`](backend/) | Laravel API, migrations, seeders, and backend tests |
| [`backend/ai-service/`](backend/ai-service/) | FastAPI application, trained artifacts, dependencies, and Python tests |
| [`docs/INTEGRATION.md`](docs/INTEGRATION.md) | API contract, feature definitions, migrations, and operations |
| [`docs/SRS.md`](docs/SRS.md) | Requirements and original project scope |
| [`.github/workflows/integration.yml`](.github/workflows/integration.yml) | Backend, frontend/browser, and AI checks |

## Local development

### Prerequisites

- PHP 8.2+ and Composer; PHP 8.3 is used for verification and CI.
- Laravel extensions, including mbstring, XML/DOM, curl, and PDO with the selected database driver.
- Node.js 24 and npm, matching the CI environment.
- PostgreSQL, or SQLite for a lightweight local setup.
- Python 3.11 or 3.12 if running inference; Python 3.12 is used in CI.

The commands below use a POSIX shell. Run the API, frontend, and optional inference server in separate terminals.

### 1. Clone the repository

```sh
git clone https://github.com/MohamedAlailan/QueueNow.git
cd QueueNow
```

When reviewing a pull request, check out its branch before installing dependencies.

### 2. Start the API

```sh
cd backend
composer install
cp .env.example .env
php artisan key:generate
```

Edit `.env` for your database. PostgreSQL is the default. To use SQLite, create `database/database.sqlite`, set `DB_CONNECTION=sqlite`, and set `DB_DATABASE` to that file's absolute path. Set `APP_URL=http://127.0.0.1:8000` and choose the clinic's `APP_TIMEZONE` before issuing tickets.

On a **new development database**:

```sh
php artisan migrate --seed
php artisan employee:credentials staff@example.com --service=1 --name="Clinic Staff" --available
php artisan serve --host=127.0.0.1 --port=8000
```

The credential command prompts for a password of at least 12 characters. Replace service `1` with the actual assigned service ID. Seeded employees have no login credentials. The `--available` flag records configured staffing; it does not track online presence.

For an existing installation, run `php artisan migrate`. The sample seeders are intended for initial setup and are not idempotent.

### 3. Start the frontend

From the repository root:

```sh
cd frontend
npm ci
cp .env.example .env
npm run dev
```

Open **http://localhost:5173**. Vite forwards `/api` requests to Laravel at `127.0.0.1:8000`. Use `/login` for the employee workspace.

### 4. Enable model inference (optional)

From the repository root:

```sh
cd backend/ai-service
python3.12 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --host 127.0.0.1 --port 8001
```

Set `AI_SERVICE_URL=http://127.0.0.1:8001` in `backend/.env`. Configure each service's model class and average duration, and maintain employee availability using real operational values. See the [AI setup and feature contract](docs/INTEGRATION.md#ai-service) before enabling predictions.

Queue operations work without inference. Estimates are labeled `ai`, `capacity`, `unavailable`, or `not_waiting`; missing data never becomes a fabricated model input.

## Ticket lifecycle

| Current state | Permitted next states | Operation |
| --- | --- | --- |
| `WAITING` | `CALLED`, `CANCELLED` | Employee calls Next; visitor cancels |
| `CALLED` | `SERVING`, `SKIPPED` | Employee starts service or skips |
| `SERVING` | `DONE` | Employee completes service |
| `DONE`, `SKIPPED`, `CANCELLED` | None | Terminal history |

Next selects the oldest waiting ticket for the employee's service and the current queue date. A service can have one `CALLED` or `SERVING` ticket at a time. Numbering restarts each day per service; completed tickets remain stored.

## Authentication and access

Employees sign in with stored, hashed credentials and receive a revocable token that expires after 12 hours. The API checks the employee's actual service assignment for queue actions. Service creation and configuration require an `ADMIN` role; a separate administrator UI is outside the current implementation.

Visitors receive a private access token when creating a ticket. Tracking and cancellation require that token. The frontend keeps employee sessions and visitor capabilities in the current tab's `sessionStorage`; clearing it removes that tab's access. A ticket URL alone does not grant access. Language preference is stored in `localStorage`.

## Tests and builds

Run commands from the indicated directories:

| Directory | Command | Purpose |
| --- | --- | --- |
| `backend` | `php artisan test` | API lifecycle, authorization, numbering, errors, and AI feature mapping |
| `frontend` | `npm run lint` | JavaScript and React source checks |
| `frontend` | `npm run build` | Production assets in `dist/` |
| `frontend` | `npx playwright install chromium` then `npm run test:e2e` | Real browser, Laravel, and disposable SQLite acceptance test |
| `backend/ai-service` | `pip install -r requirements-dev.txt` then `pytest -q` | Prediction request and failure contract |
| `backend/ai-service` | `python predict.py` | Saved-model inference smoke test |

The browser test starts its own servers on ports `8000` and `5173`; leave those ports free. It requires installed Laravel dependencies. Backend tests use in-memory SQLite, and the browser runner creates a disposable database.

GitHub Actions runs these check groups for pull requests and pushes to `main`. Local results and remaining verification limits are recorded in the [integration guide](docs/INTEGRATION.md#verification).

## Deployment considerations

Serve the built SPA with route fallback and route `/api` to Laravel on the same origin. For separate origins, configure `VITE_API_BASE_URL` at build time and Laravel CORS explicitly. Vite's development proxy is not part of the production build or preview server.

Use a fresh application key for each installation, disable debug output in production, run migrations, provision employee credentials, and keep the inference server private. Existing services require explicit AI configuration; existing employees are unavailable until configured. Legacy tickets without visitor capabilities remain in employee history but cannot be tracked through visitor endpoints.

The current MVP uses one active ticket per service. Multi-counter scheduling, real-clinic model calibration, and production database concurrency validation remain separate work. Waiting-time estimates are advisory.

## Contributing

Create a focused branch, describe the resulting behavior in a pull request, and run the checks relevant to your change. Keep API responses, frontend behavior, model feature definitions, and documentation aligned. Submit changes for review before merging to `main`.

Developed by the **QueueNow Project Team** across frontend, backend, AI, design, quality assurance, and project coordination.
