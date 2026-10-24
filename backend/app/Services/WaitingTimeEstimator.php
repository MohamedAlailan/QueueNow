<?php

namespace App\Services;

use App\Models\Ticket;

class WaitingTimeEstimator
{
    public function __construct(private AiPredictionService $ai) {}

    public function estimate(Ticket $ticket): array
    {
        $service = $ticket->service;
        $ahead = $ticket->status === 'WAITING' ? Ticket::where('service_id', $ticket->service_id)
            ->whereDate('queue_date', $ticket->queue_date)->where('id', '<', $ticket->id)
            ->whereIn('status', ['WAITING', 'CALLED', 'SERVING'])->count() : 0;
        $result = ['people_ahead' => $ahead, 'estimated_waiting_time_minutes' => null, 'estimate_source' => 'unavailable'];
        if ($ticket->status !== 'WAITING') {
            return array_merge($result, ['estimated_waiting_time_minutes' => 0, 'estimate_source' => 'not_waiting']);
        }
        // Training defines previous wait as start minus arrival, never completion minus arrival.
        $previous = Ticket::where('service_id', $ticket->service_id)->where('status', 'DONE')
            ->whereNotNull('started_at')->where('id', '<', $ticket->id)->latest('finished_at')->first();
        $staff = $service->employees()->where('is_available', true)->count();
        $duration = $service->avg_service_time;
        if (! $duration || $duration <= 0 || ! $staff) {
            return $result;
        }
        // Explicit queue-capacity fallback; no invented AI inputs when history/config is missing.
        $result['estimated_waiting_time_minutes'] = round($ahead * $duration / $staff, 2);
        $result['estimate_source'] = 'capacity';
        if (! $previous || ! in_array($service->type, ['consultation', 'checkup', 'lab_test', 'payment'])) {
            return $result;
        }
        $arrival = $ticket->created_at;
        $prediction = $this->ai->getEstimatedWaitingTime([
            'queue_length_before' => $ahead,
            'avg_service_time' => (float) $duration,
            'available_staff' => $staff,
            'previous_waiting_time' => max(0, $previous->created_at->diffInSeconds($previous->started_at, false) / 60),
            'hour' => $arrival->hour,
            'day_of_week' => $arrival->dayOfWeekIso - 1,
            'service_type' => $service->type,
        ]);
        if ($prediction !== null) {
            return array_merge($result, ['estimated_waiting_time_minutes' => $prediction, 'estimate_source' => 'ai']);
        }

        return $result;
    }
}
