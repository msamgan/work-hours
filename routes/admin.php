<?php

declare(strict_types=1);

use App\Http\Controllers\Admin\AdminController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Middleware\AdminMiddleware;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function (): void {
    Route::middleware(AdminMiddleware::class)
        ->prefix('administration')
        ->name('admin.')
        ->group(function (): void {
            Route::get('/', [AdminController::class, 'index'])->name('index');
            Route::get('/users', [UserController::class, 'index'])->name('users.index');
        });
});
