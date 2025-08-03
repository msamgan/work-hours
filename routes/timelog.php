<?php

declare(strict_types=1);

use App\Http\Controllers\TimeLogController;
use Illuminate\Support\Facades\Route;

// Time log routes
Route::middleware(['auth', 'verified'])->group(function (): void {
    Route::prefix('time-log')->name('time-log.')->group(function (): void {
        Route::get('/', [TimeLogController::class, 'index'])->name('index');
        Route::get('/create', [TimeLogController::class, 'create'])->name('create');
        Route::get('/{timeLog}/edit', [TimeLogController::class, 'edit'])->name('edit');
    });
});
