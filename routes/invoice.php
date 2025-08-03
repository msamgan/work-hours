<?php

declare(strict_types=1);

use App\Http\Controllers\InvoiceController;
use Illuminate\Support\Facades\Route;

// Invoice routes
Route::middleware(['auth', 'verified'])->group(function (): void {
    Route::prefix('invoice')->name('invoice.')->group(function (): void {
        Route::get('/', [InvoiceController::class, 'index'])->name('index');
        Route::get('/create', [InvoiceController::class, 'create'])->name('create');
        Route::get('/{invoice}/edit', [InvoiceController::class, 'edit'])->name('edit');
    });
});
