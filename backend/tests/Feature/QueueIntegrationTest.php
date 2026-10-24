<?php

use App\Models\Employee;
use App\Models\Service;
use App\Models\Ticket;
use App\Services\AiPredictionService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

beforeEach(function () {
    Http::preventStrayRequests();
    $this->travelTo(Carbon::parse('2026-10-19 11:00:00')); // Monday
    $this->ticketTokens = [];
    $this->service = Service::create(['name' => 'Consultation', 'is_open' => true, 'type' => 'consultation', 'avg_service_time' => 12]);
    $this->employee = Employee::create(['name' => 'Employee', 'email' => 'staff@example.com', 'password' => 'long-test-password', 'service_id' => $this->service->id, 'is_available' => true]);
});
function takeTicket($test, $service = null)
{
    $data = $test->postJson('/api/v1/tickets', ['service_id' => ($service ?? $test->service)->id])->assertCreated()->json();
    $test->withHeader('X-Ticket-Token', $data['access_token']);
    $test->ticketTokens[$data['ticket_id']] = $data['access_token'];

    return $data['ticket_id'];
}
it('runs the complete API lifecycle and enforces one active ticket', function () {
    $one = takeTicket($this);
    $two = takeTicket($this);
    $this->getJson("/api/v1/tickets/$two")->assertOk()->assertJsonPath('people_ahead', 1)->assertJsonPath('service.name', 'Consultation');
    Sanctum::actingAs($this->employee);
    $this->postJson("/api/v1/services/{$this->service->id}/next")->assertOk()->assertJsonPath('ticket.id', $one)->assertJsonPath('ticket.status', 'CALLED');
    $this->postJson("/api/v1/services/{$this->service->id}/next")->assertConflict();
    $this->withHeader('X-Ticket-Token', $this->ticketTokens[$one])->patchJson("/api/v1/tickets/$one/cancel")->assertConflict();
    $this->postJson("/api/v1/tickets/$one/done")->assertConflict();
    $this->postJson("/api/v1/tickets/$one/start")->assertOk()->assertJsonPath('ticket.status', 'SERVING');
    $this->postJson("/api/v1/tickets/$one/skip")->assertConflict();
    $this->postJson("/api/v1/tickets/$one/done")->assertOk()->assertJsonPath('ticket.status', 'DONE');
    $this->postJson("/api/v1/tickets/$one/start")->assertConflict();
    $this->postJson("/api/v1/services/{$this->service->id}/next")->assertOk()->assertJsonPath('ticket.id', $two);
    $this->postJson("/api/v1/tickets/$two/skip")->assertOk()->assertJsonPath('ticket.status', 'SKIPPED');
    $this->postJson("/api/v1/services/{$this->service->id}/next")->assertNotFound();
});
it('cancels only waiting tickets and reports missing/closed/invalid requests', function () {
    $id = takeTicket($this);
    $this->patchJson("/api/v1/tickets/$id/cancel")->assertOk()->assertJsonPath('ticket.status', 'CANCELLED');
    $this->patchJson("/api/v1/tickets/$id/cancel")->assertConflict();
    $this->getJson('/api/v1/tickets/999')->assertNotFound();
    $this->postJson('/api/v1/tickets', [])->assertUnprocessable();
    $this->service->update(['is_open' => false]);
    $this->postJson('/api/v1/tickets', ['service_id' => $this->service->id])->assertConflict();
});
it('authenticates credentials and revokes logout tokens', function () {
    $this->postJson('/api/v1/employee/login', ['email' => $this->employee->email, 'password' => 'wrong'])->assertUnauthorized();
    $token = $this->postJson('/api/v1/employee/login', ['email' => $this->employee->email, 'password' => 'long-test-password'])->assertOk()->assertJsonMissingPath('employee.password')->json('token');
    $this->withToken($token)->getJson('/api/v1/employee/me')->assertOk()->assertJsonPath('service_id', $this->service->id);
    $this->withToken($token)->postJson('/api/v1/employee/logout')->assertOk();
    expect($this->employee->tokens()->count())->toBe(0);
});
it('requires employee auth and isolates assigned services', function () {
    $id = takeTicket($this);
    $this->postJson("/api/v1/services/{$this->service->id}/next")->assertUnauthorized();
    $other = Service::create(['name' => 'Other', 'is_open' => true]);
    $otherId = takeTicket($this, $other);
    Sanctum::actingAs($this->employee);
    $this->postJson("/api/v1/services/{$other->id}/next")->assertForbidden();
    $this->getJson("/api/v1/services/{$other->id}/waiting-list")->assertForbidden();
    $this->postJson("/api/v1/tickets/$otherId/start")->assertForbidden();
    $this->getJson('/api/v1/employee/queue')->assertJsonCount(1, 'tickets')->assertJsonPath('tickets.0.id', $id);
    $this->postJson('/api/v1/services', ['name' => 'Forbidden'])->assertForbidden();
});
it('resets numbers daily and excludes previous days from next/waiting', function () {
    takeTicket($this);
    $this->travel(1)->days();
    $id = takeTicket($this);
    expect(Ticket::find($id)->ticket_number)->toBe(1);
    Sanctum::actingAs($this->employee);
    $this->getJson("/api/v1/services/{$this->service->id}/waiting-list")->assertJsonCount(1, 'tickets');
    $this->postJson("/api/v1/services/{$this->service->id}/next")->assertJsonPath('ticket.id', $id);
});
it('sends real AI features including Monday zero and start minus arrival', function () {
    $old = Ticket::create(['service_id' => $this->service->id, 'ticket_number' => 100, 'queue_date' => today(), 'status' => 'DONE']);
    $old->forceFill(['created_at' => now()->subMinutes(40), 'started_at' => now()->subMinutes(25), 'finished_at' => now()->subMinutes(5)])->save();
    Http::fake(['*/predict' => Http::response(['predicted_waiting_time_minutes' => 7.5])]);
    $this->postJson('/api/v1/tickets', ['service_id' => $this->service->id])->assertCreated()->assertJsonPath('estimate_source', 'ai')->assertJsonPath('estimated_waiting_time_minutes', 7.5);
    Http::assertSent(fn ($request) => $request['day_of_week'] === 0 && $request['previous_waiting_time'] == 15 && $request['available_staff'] === 1 && $request['avg_service_time'] == 12 && $request['service_type'] === 'consultation' && $request['hour'] === 11);
});
it('does not fabricate missing features and survives unavailable AI', function () {
    $this->postJson('/api/v1/tickets', ['service_id' => $this->service->id])->assertCreated()->assertJsonPath('estimate_source', 'capacity');
    Http::assertNothingSent();
    $this->employee->update(['is_available' => false]);
    $id = takeTicket($this);
    $this->getJson("/api/v1/tickets/$id")->assertJsonPath('estimate_source', 'unavailable')->assertJsonPath('estimated_waiting_time_minutes', null);
});
it('rejects malformed or failed AI responses', function () {
    foreach ([['predicted_waiting_time_minutes' => -1], ['predicted_waiting_time_minutes' => 'oops'], ['predicted_waiting_time_minutes' => '5'], []] as $body) {
        Http::fake(['*/predict' => Http::response($body)]);
        expect(app(AiPredictionService::class)->getEstimatedWaitingTime(['queue_length_before' => 1, 'avg_service_time' => 12, 'available_staff' => 1, 'previous_waiting_time' => 5, 'hour' => 11, 'day_of_week' => 0, 'service_type' => 'consultation']))->toBeNull();
    }
});

it('requires the patient capability for status and cancellation', function () {
    $id = takeTicket($this);
    $this->withHeader('X-Ticket-Token', 'incorrect')->getJson("/api/v1/tickets/$id")->assertForbidden();
    $this->patchJson("/api/v1/tickets/$id/cancel")->assertForbidden();
    $this->withHeader('X-Ticket-Token', $this->ticketTokens[$id])->getJson("/api/v1/tickets/$id")->assertOk()->assertJsonMissingPath('access_token_hash');
});

it('falls back to capacity on connection failure and invalid HTTP status', function () {
    $old = Ticket::create(['service_id' => $this->service->id, 'ticket_number' => 100, 'queue_date' => today(), 'status' => 'DONE']);
    $old->forceFill(['created_at' => now()->subMinutes(40), 'started_at' => now()->subMinutes(25), 'finished_at' => now()->subMinutes(5)])->save();
    Http::fake(['*/predict' => Http::failedConnection()]);
    $this->postJson('/api/v1/tickets', ['service_id' => $this->service->id])->assertCreated()->assertJsonPath('estimate_source', 'capacity')->assertJsonPath('estimated_waiting_time_minutes', 0);
    Http::fake(['*/predict' => Http::response([], 503)]);
    $this->postJson('/api/v1/tickets', ['service_id' => $this->service->id])->assertCreated()->assertJsonPath('estimate_source', 'capacity')->assertJsonPath('estimated_waiting_time_minutes', 12);
});


it('validates administrator AI configuration within database precision', function () {
    $this->employee->update(['role' => 'ADMIN']);
    Sanctum::actingAs($this->employee);
    $url = "/api/v1/services/{$this->service->id}";
    foreach ([0, -1, 1000000] as $duration) {
        $this->patchJson($url, ['avg_service_time' => $duration])->assertUnprocessable();
    }
    $this->patchJson($url, ['type' => 'dental'])->assertUnprocessable();
    $this->patchJson($url, ['type' => 'lab_test', 'avg_service_time' => 7.5])->assertOk();
    expect($this->service->fresh()->avg_service_time)->toBe(7.5);
    $this->patchJson($url, ['type' => null, 'avg_service_time' => null])->assertOk();
    expect($this->service->fresh()->avg_service_time)->toBeNull();
});

it('stamps lifecycle times and reports zero remaining wait after service starts', function () {
    $id = takeTicket($this);
    Sanctum::actingAs($this->employee);
    $this->travel(2)->minutes();
    $this->postJson("/api/v1/services/{$this->service->id}/next")->assertOk();
    $this->travel(3)->minutes();
    $this->postJson("/api/v1/tickets/$id/start")->assertOk();
    $this->getJson("/api/v1/tickets/$id")->assertOk()
        ->assertJsonPath('people_ahead', 0)
        ->assertJsonPath('estimated_waiting_time_minutes', 0)
        ->assertJsonPath('estimate_source', 'not_waiting');
    $ticket = Ticket::findOrFail($id);
    expect((int) $ticket->created_at->diffInMinutes($ticket->started_at))->toBe(5);
    expect((int) $ticket->created_at->diffInMinutes($ticket->called_at))->toBe(2);
    $this->travel(7)->minutes();
    $this->postJson("/api/v1/tickets/$id/done")->assertOk();
    expect((int) $ticket->started_at->diffInMinutes($ticket->fresh()->finished_at))->toBe(7);
});

it('uses Sunday six and counts only staffed employees from the same service', function () {
    $this->travelTo(Carbon::parse('2026-10-25 09:00:00'));
    $other = Service::create(['name' => 'Other', 'is_open' => true]);
    Employee::create(['name' => 'Other staff', 'service_id' => $other->id, 'is_available' => true]);
    Employee::create(['name' => 'Off shift', 'service_id' => $this->service->id, 'is_available' => false]);
    $old = Ticket::create(['service_id' => $this->service->id, 'ticket_number' => 100, 'queue_date' => today(), 'status' => 'DONE']);
    $old->forceFill(['created_at' => now()->subMinutes(30), 'started_at' => now()->subMinutes(20), 'finished_at' => now()->subMinutes(10)])->save();
    Http::fake(['*/predict' => Http::response(['predicted_waiting_time_minutes' => 2])]);
    takeTicket($this);
    Http::assertSent(fn ($request) => $request['day_of_week'] === 6 && $request['available_staff'] === 1 && $request['previous_waiting_time'] == 10);
});
