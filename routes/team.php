<?php

declare(strict_types=1);

use App\Http\Controllers\TeamController;
use Illuminate\Support\Facades\Route;

// Team routes
Route::middleware(['auth', 'verified'])->group(function (): void {
    Route::prefix('team')->name('team.')->group(function (): void {
        Route::get('/', [TeamController::class, 'index'])->name('index');
        Route::get('/create', [TeamController::class, 'create'])->name('create');
        Route::get('/all-time-logs', [TeamController::class, 'allTimeLogs'])->name('all-time-logs');
        Route::get('/{user}/edit', [TeamController::class, 'edit'])->name('edit');
        Route::get('/{user}/time-logs', [TeamController::class, 'timeLogs'])->name('time-logs');
    });
});
