<?php

declare(strict_types=1);

use App\Http\Controllers\CalendarController;
use Illuminate\Support\Facades\Route;

// Calendar routes
Route::middleware(['auth', 'verified'])->group(function (): void {
    Route::prefix('calendar')->name('calendar.')->group(function (): void {
        Route::get('/', [CalendarController::class, 'index'])->name('index');
        Route::get('/detail/{id}', [CalendarController::class, 'detail'])->name('detail');
    });
});
