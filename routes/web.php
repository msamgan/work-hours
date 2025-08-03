<?php

declare(strict_types=1);

use App\Http\Controllers\ApprovalController;
use App\Http\Controllers\CalendarController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\IntegrationController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\NotificationsController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\TeamController;
use App\Http\Controllers\TimeLogController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', fn () => Inertia::render('welcome'))->name('home');

// Feature pages
Route::get('/features/time-tracking', fn () => Inertia::render('features/TimeTracking'))->name('features.time-tracking');
Route::get('/features/detailed-reports', fn () => Inertia::render('features/DetailedReports'))->name('features.detailed-reports');
Route::get('/features/team-collaboration', fn () => Inertia::render('features/TeamCollaboration'))->name('features.team-collaboration');
Route::get('/features/client-management', fn () => Inertia::render('features/ClientManagement'))->name('features.client-management');
Route::get('/features/bulk-upload', fn () => Inertia::render('features/BulkUpload'))->name('features.bulk-upload');
Route::get('/features/approval-management', fn () => Inertia::render('features/ApprovalManagement'))->name('features.approval-management');
Route::get('/features/currency-management', fn () => Inertia::render('features/CurrencyManagement'))->name('features.currency-management');
Route::get('/features/multi-currency-invoice', fn () => Inertia::render('features/MultiCurrencyInvoice'))->name('features.multi-currency-invoice');
Route::get('/features/task-management', fn () => Inertia::render('features/TaskManagement'))->name('features.task-management');
Route::get('/features/github-integration', fn () => Inertia::render('features/GithubIntegration'))->name('features.github-integration');

Route::get('/privacy-policy', fn () => Inertia::render('legal/PrivacyPolicy'))->name('privacy-policy');
Route::get('/terms-of-service', fn () => Inertia::render('legal/TermsOfService'))->name('terms-of-service');
Route::get('/cookie-policy', fn () => Inertia::render('legal/CookiePolicy'))->name('cookie-policy');
Route::get('/gdpr-compliance', fn () => Inertia::render('legal/GDPRCompliance'))->name('gdpr-compliance');
Route::get('/security', fn () => Inertia::render('legal/Security'))->name('security');

Route::middleware(['auth', 'verified'])->group(function (): void {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::get('notifications', [NotificationsController::class, 'index'])->name('notifications.index');

    // AI Chat routes
    Route::get('integration', [IntegrationController::class, 'index'])->name('integration.index');

    Route::get('team', [TeamController::class, 'index'])->name('team.index');
    Route::get('team/create', [TeamController::class, 'create'])->name('team.create');
    Route::get('team/all-time-logs', [TeamController::class, 'allTimeLogs'])->name('team.all-time-logs');
    Route::get('team/{user}/edit', [TeamController::class, 'edit'])->name('team.edit');
    Route::get('team/{user}/time-logs', [TeamController::class, 'timeLogs'])->name('team.time-logs');

    Route::get('project', [ProjectController::class, 'index'])->name('project.index');
    Route::get('project/create', [ProjectController::class, 'create'])->name('project.create');
    Route::get('project/{project}/edit', [ProjectController::class, 'edit'])->name('project.edit');
    Route::get('project/{project}/time-logs', [ProjectController::class, 'timeLogs'])->name('project.time-logs');

    Route::get('client', [ClientController::class, 'index'])->name('client.index');
    Route::get('client/create', [ClientController::class, 'create'])->name('client.create');
    Route::get('client/{client}/edit', [ClientController::class, 'edit'])->name('client.edit');
    Route::get('client/{client}/projects', [ClientController::class, 'projects'])->name('client.projects');

    Route::get('task', [TaskController::class, 'index'])->name('task.index');
    Route::get('task/create', [TaskController::class, 'create'])->name('task.create');
    Route::get('task/{task}/edit', [TaskController::class, 'edit'])->name('task.edit');

    Route::get('time-log', [TimeLogController::class, 'index'])->name('time-log.index');
    Route::get('time-log/create', [TimeLogController::class, 'create'])->name('time-log.create');
    Route::get('time-log/{timeLog}/edit', [TimeLogController::class, 'edit'])->name('time-log.edit');

    Route::get('invoice', [InvoiceController::class, 'index'])->name('invoice.index');
    Route::get('invoice/create', [InvoiceController::class, 'create'])->name('invoice.create');
    Route::get('invoice/{invoice}/edit', [InvoiceController::class, 'edit'])->name('invoice.edit');
    Route::get('client/{client}/invoices', [InvoiceController::class, 'clientInvoices'])->name('client.invoices');

    Route::get('approvals', [ApprovalController::class, 'index'])->name('approvals.index');

    // Calendar routes
    Route::get('calendar', [CalendarController::class, 'index'])->name('calendar.index');
    Route::get('calendar/detail/{id}', [CalendarController::class, 'detail'])->name('calendar.detail');
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
require __DIR__ . '/github.php';
require __DIR__ . '/trello.php';
