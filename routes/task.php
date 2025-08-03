<?php

declare(strict_types=1);

use App\Http\Controllers\TaskController;
use Illuminate\Support\Facades\Route;

// Task routes
Route::middleware(['auth', 'verified'])->group(function (): void {
    Route::prefix('task')->name('task.')->group(function (): void {
        Route::get('/', [TaskController::class, 'index'])->name('index');
        Route::get('/create', [TaskController::class, 'create'])->name('create');
        Route::get('/{task}/edit', [TaskController::class, 'edit'])->name('edit');
    });
});
