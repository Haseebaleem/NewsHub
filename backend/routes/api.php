<?php

declare(strict_types=1);

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PreferenceController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function (): void {
    Route::post('register', [AuthController::class, 'register'])->name('auth.register');
    Route::post('login', [AuthController::class, 'login'])->name('auth.login');

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::post('logout', [AuthController::class, 'logout'])->name('auth.logout');
    });
});

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('user', [AuthController::class, 'me'])->name('auth.me');

    Route::get('preferences', [PreferenceController::class, 'show'])->name('preferences.show');
    Route::patch('preferences', [PreferenceController::class, 'update'])->name('preferences.update');
});
