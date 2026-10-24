<?php

use App\Models\Employee;
use App\Models\Service;
use Illuminate\Contracts\Console\Kernel;

// Used only by frontend/tests/e2e.mjs against its disposable SQLite database.
require __DIR__.'/../../vendor/autoload.php';
$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
if (! app()->environment('testing') || ! str_contains(config('database.connections.sqlite.database'), 'queuenow-e2e-')) {
    throw new RuntimeException('E2E fixtures require the disposable testing database.');
}
$service = Service::create(['name' => 'Consultation E2E', 'is_open' => true, 'type' => 'consultation', 'avg_service_time' => 12]);
Service::create(['name' => 'Other E2E', 'is_open' => true]);
Service::create(['name' => 'Closed E2E', 'is_open' => false]);
Employee::create(['name' => 'Test Employee', 'email' => 'e2e@example.test', 'password' => getenv('E2E_PASSWORD'), 'service_id' => $service->id, 'is_available' => true]);
