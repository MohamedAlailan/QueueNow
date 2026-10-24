<?php

use App\Models\Employee;
use App\Models\Service;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('employee:credentials {email} {--service=} {--name=} {--available}', function () {
    $service = Service::findOrFail($this->option('service'));
    $password = $this->secret('Password (at least 12 characters)');
    if (strlen($password ?? '') < 12) {
        $this->error('Password must be at least 12 characters.');

        return 1;
    }
    Employee::updateOrCreate(['email' => $this->argument('email')], [
        'name' => $this->option('name') ?: $this->argument('email'),
        'service_id' => $service->id, 'password' => $password,
        'is_available' => (bool) $this->option('available'),
    ]);
    $this->info('Employee credentials saved.');
});
