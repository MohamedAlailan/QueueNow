<?php

namespace App\Services;

use Exception;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AiPredictionService
{
    protected string $baseUrl;

    public function __construct()
    {
        $this->baseUrl = rtrim(config('services.ai.url'), '/');
    }

    public function getEstimatedWaitingTime(array $ticketData): ?float
    {
        try {
            $response = Http::timeout(5)->post("{$this->baseUrl}/predict", [
                'queue_length_before' => $ticketData['queue_length_before'],
                'avg_service_time' => $ticketData['avg_service_time'],
                'available_staff' => $ticketData['available_staff'],
                'previous_waiting_time' => $ticketData['previous_waiting_time'],
                'hour' => $ticketData['hour'],
                'day_of_week' => $ticketData['day_of_week'],
                'service_type' => $ticketData['service_type'],
            ]);

            if ($response->successful()) {
                $value = $response->json('predicted_waiting_time_minutes');

                return (is_int($value) || is_float($value)) && is_finite((float) $value) && $value >= 0 ? (float) $value : null;
            }

            return null;

        } catch (Exception $e) {
            Log::error('Failed to connect to AI Service: '.$e->getMessage());

            return null;
        }
    }
}
