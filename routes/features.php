<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Feature pages routes
Route::prefix('features')->name('features.')->group(function (): void {
    Route::get('/time-tracking', fn () => Inertia::render('features/TimeTracking'))->name('time-tracking');
    Route::get('/detailed-reports', fn () => Inertia::render('features/DetailedReports'))->name('detailed-reports');
    Route::get('/team-collaboration', fn () => Inertia::render('features/TeamCollaboration'))->name('team-collaboration');
    Route::get('/client-management', fn () => Inertia::render('features/ClientManagement'))->name('client-management');
    Route::get('/bulk-upload', fn () => Inertia::render('features/BulkUpload'))->name('bulk-upload');
    Route::get('/approval-management', fn () => Inertia::render('features/ApprovalManagement'))->name('approval-management');
    Route::get('/currency-management', fn () => Inertia::render('features/CurrencyManagement'))->name('currency-management');
    Route::get('/multi-currency-invoice', fn () => Inertia::render('features/MultiCurrencyInvoice'))->name('multi-currency-invoice');
    Route::get('/task-management', fn () => Inertia::render('features/TaskManagement'))->name('task-management');
    Route::get('/github-integration', fn () => Inertia::render('features/GithubIntegration'))->name('github-integration');
});
