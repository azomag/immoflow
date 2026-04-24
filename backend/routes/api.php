<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CommuneController;
use App\Http\Controllers\ContratController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\LogementController;
use App\Http\Controllers\PaiementController;
use App\Http\Controllers\TypeLogementController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::get('/ping', function () {
    return response()->json([
        'message' => 'Backend connected',
        'timestamp' => now()->toIso8601String(),
    ]);
});

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/google/sync', [AuthController::class, 'googleSync']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/dashboard/summary', [DashboardController::class, 'summary']);

    Route::get('/communes', [CommuneController::class, 'index']);
    Route::get('/type-logements', [TypeLogementController::class, 'index']);
    Route::get('/logements', [LogementController::class, 'index']);
    Route::get('/contrats', [ContratController::class, 'index']);
    Route::get('/paiements', [PaiementController::class, 'index']);

    Route::middleware('role:super_admin,admin,agent')->group(function () {
        Route::get('/users', [UserController::class, 'index']);
    });

    Route::middleware('role:super_admin,admin')->group(function () {
        Route::patch('/users/{user}/status', [UserController::class, 'updateStatus']);
        Route::post('/communes', [CommuneController::class, 'store']);
        Route::post('/type-logements', [TypeLogementController::class, 'store']);
    });

    Route::middleware('role:super_admin,admin,agent')->group(function () {
        Route::post('/logements', [LogementController::class, 'store']);
        Route::patch('/logements/{logement}', [LogementController::class, 'update']);
        Route::post('/paiements', [PaiementController::class, 'store']);
        Route::patch('/paiements/{paiement}/status', [PaiementController::class, 'updateStatus']);
    });

    Route::middleware('role:agent')->group(function () {
        Route::post('/contrats', [ContratController::class, 'store']);
    });

    Route::middleware('role:locataire')->group(function () {
        Route::post('/contrats/{contrat}/sign', [ContratController::class, 'sign']);
    });
});
