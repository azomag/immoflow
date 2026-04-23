<?php

use Illuminate\Support\Facades\Route;

Route::get('/ping', function () {
    return response()->json([
        'message' => 'Backend connected',
        'timestamp' => now()->toIso8601String(),
    ]);
});
