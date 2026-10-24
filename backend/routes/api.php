<?php

use App\Http\Controllers\Api\v1\ServiceController;
use App\Http\Controllers\EmployeeAuthController;
use App\Http\Controllers\TicketController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::get('/services', [ServiceController::class, 'index']);
    Route::get('/services/{id}', [ServiceController::class, 'show']);
    Route::post('/tickets', [TicketController::class, 'store']);
    Route::get('/tickets/{id}', [TicketController::class, 'show']);
    Route::patch('/tickets/{id}/cancel', [TicketController::class, 'cancel']);
    Route::post('/employee/login', [EmployeeAuthController::class, 'login'])->middleware('throttle:10,1');
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/employee/me', fn (Request $request) => $request->user());
        Route::post('/employee/logout', [EmployeeAuthController::class, 'logout']);
        Route::get('/employee/queue', [TicketController::class, 'employeeQueue']);
        Route::get('/services/{serviceId}/waiting-list', [TicketController::class, 'waitingList']);
        Route::post('/services/{serviceId}/next', [TicketController::class, 'next']);
        Route::post('/tickets/{id}/start', [TicketController::class, 'start']);
        Route::post('/tickets/{id}/done', [TicketController::class, 'done']);
        Route::post('/tickets/{id}/skip', [TicketController::class, 'skip']);
        Route::post('/services', [ServiceController::class, 'store']);
        Route::patch('/services/{id}', [ServiceController::class, 'update']);
    });
});
