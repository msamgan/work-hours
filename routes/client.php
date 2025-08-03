<?php

declare(strict_types=1);

use App\Http\Controllers\ClientController;
use App\Http\Controllers\InvoiceController;
use Illuminate\Support\Facades\Route;

// Client routes
Route::middleware(['auth', 'verified'])->group(function (): void {
    Route::prefix('client')->name('client.')->group(function (): void {
        Route::get('/', [ClientController::class, 'index'])->name('index');
        Route::get('/create', [ClientController::class, 'create'])->name('create');
        Route::get('/{client}/edit', [ClientController::class, 'edit'])->name('edit');
        Route::get('/{client}/projects', [ClientController::class, 'projects'])->name('projects');
    });

    // Client-related invoice route
    Route::get('client/{client}/invoices', [InvoiceController::class, 'clientInvoices'])->name('client.invoices');
});
