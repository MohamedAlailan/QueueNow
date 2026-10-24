# QueueNow Laravel API

Laravel 12 API with transactional per-service/day queue numbering, enforced ticket
transitions, patient access capabilities, Sanctum employee authentication and
service authorization, and an optional FastAPI waiting-time estimator.

Follow [Integration and operations](../docs/INTEGRATION.md) for complete installation,
configuration, employee provisioning, AI dependencies/feature definitions and
verification. Start with `composer install`, configure `.env`, generate an app key,
and run `php artisan migrate --seed` on a new database. Existing deployments need
`php artisan migrate`. Run `php artisan test` for SQLite integration tests.
