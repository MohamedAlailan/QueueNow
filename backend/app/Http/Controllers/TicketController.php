<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\Service;
use App\Models\Ticket;
use App\Services\TicketStateMachine;
use App\Services\WaitingTimeEstimator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TicketController extends Controller
{
    public function __construct(private WaitingTimeEstimator $estimator) {}

    public function store(Request $request)
    {
        $data = $request->validate(['service_id' => 'required|integer|exists:services,id']);
        $token = bin2hex(random_bytes(32));
        $ticket = DB::transaction(function () use ($data, $token) {
            $service = Service::whereKey($data['service_id'])->lockForUpdate()->firstOrFail();
            abort_unless($service->is_open, 409, 'This service is currently closed.');
            $today = today()->toDateString();
            DB::table('service_daily_counters')->insertOrIgnore(['service_id' => $service->id, 'queue_date' => $today, 'last_number' => 0]);
            $counter = DB::table('service_daily_counters')->where('service_id', $service->id)->where('queue_date', $today)->lockForUpdate()->first();
            DB::table('service_daily_counters')->where('id', $counter->id)->update(['last_number' => $counter->last_number + 1]);

            $ticket = Ticket::create(['service_id' => $service->id, 'queue_date' => $today, 'ticket_number' => $counter->last_number + 1, 'status' => 'WAITING']);
            $ticket->forceFill(['access_token_hash' => hash('sha256', $token)])->save();

            return $ticket;
        });

        return response()->json(array_merge($this->detail($ticket), ['access_token' => $token]), 201);
    }

    private function detail(Ticket $ticket): array
    {
        return array_merge($ticket->toArray(), ['ticket_id' => $ticket->id, 'service' => $ticket->service], $this->estimator->estimate($ticket));
    }

    private function patientTicket(Request $request, $id): Ticket
    {
        $ticket = Ticket::findOrFail($id);
        $token = (string) $request->header('X-Ticket-Token', '');
        abort_unless($ticket->access_token_hash && hash_equals($ticket->access_token_hash, hash('sha256', $token)), 403, 'Ticket access token required.');

        return $ticket;
    }

    public function show(Request $request, $id)
    {
        return response()->json($this->detail($this->patientTicket($request, $id)));
    }

    public function cancel(Request $request, TicketStateMachine $machine, $id)
    {
        $this->patientTicket($request, $id);

        return $this->change($machine, $id, 'CANCELLED');
    }

    private function assertService(Request $request, $serviceId): void
    {
        abort_unless($request->user() instanceof Employee && (int) $request->user()->service_id === (int) $serviceId, 403, 'This service is not assigned to you.');
    }

    public function employeeQueue(Request $request)
    {
        $this->assertService($request, $request->user()->service_id);

        return response()->json(['tickets' => Ticket::where('service_id', $request->user()->service_id)->whereDate('queue_date', today())->orderBy('id')->get()]);
    }

    public function waitingList(Request $request, $serviceId)
    {
        Service::findOrFail($serviceId);
        $this->assertService($request, $serviceId);

        return response()->json(['tickets' => Ticket::where('service_id', $serviceId)->whereDate('queue_date', today())->where('status', 'WAITING')->orderBy('id')->get()]);
    }

    public function next(Request $request, TicketStateMachine $machine, $serviceId)
    {
        $this->assertService($request, $serviceId);
        $ticket = DB::transaction(function () use ($serviceId, $machine) {
            // All queue mutations lock the service first, serializing Next and patient Cancel.
            Service::whereKey($serviceId)->lockForUpdate()->firstOrFail();
            abort_if(Ticket::where('service_id', $serviceId)->whereDate('queue_date', today())->whereIn('status', ['CALLED', 'SERVING'])->exists(), 409, 'Finish or skip the current ticket first.');
            $ticket = Ticket::where('service_id', $serviceId)->whereDate('queue_date', today())->where('status', 'WAITING')->orderBy('id')->lockForUpdate()->first();
            abort_unless($ticket, 404, 'No waiting tickets.');

            return $machine->transition($ticket, 'CALLED');
        });

        return response()->json(['ticket' => $ticket]);
    }

    public function start(Request $request, TicketStateMachine $machine, $id)
    {
        return $this->change($machine, $id, 'SERVING', $request);
    }

    public function done(Request $request, TicketStateMachine $machine, $id)
    {
        return $this->change($machine, $id, 'DONE', $request);
    }

    public function skip(Request $request, TicketStateMachine $machine, $id)
    {
        return $this->change($machine, $id, 'SKIPPED', $request);
    }

    private function change(TicketStateMachine $machine, $id, string $status, ?Request $request = null)
    {
        $ticket = Ticket::findOrFail($id);
        if ($request) {
            $this->assertService($request, $ticket->service_id);
        }
        try {
            $ticket = DB::transaction(function () use ($ticket, $machine, $status) {
                Service::whereKey($ticket->service_id)->lockForUpdate()->firstOrFail();
                $locked = Ticket::whereKey($ticket->id)->lockForUpdate()->firstOrFail();

                return $machine->transition($locked, $status);
            });
        } catch (ValidationException $e) {
            return response()->json(['message' => $e->validator->errors()->first()], 409);
        }

        return response()->json(['ticket' => $ticket]);
    }
}
