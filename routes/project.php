<?php

declare(strict_types=1);

use App\Http\Controllers\ProjectController;
use Illuminate\Support\Facades\Route;

// Project routes
Route::middleware(['auth', 'verified'])->group(function (): void {
    Route::prefix('project')->name('project.')->group(function (): void {
        Route::get('/', [ProjectController::class, 'index'])->name('index');
        Route::get('/create', [ProjectController::class, 'create'])->name('create');
        Route::get('/{project}/edit', [ProjectController::class, 'edit'])->name('edit');
        Route::get('/{project}/time-logs', [ProjectController::class, 'timeLogs'])->name('time-logs');
    });
});
