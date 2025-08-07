<?php

declare(strict_types=1);

use App\Http\Controllers\ApprovalController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\IntegrationController;
use App\Http\Controllers\NotificationsController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', fn () => Inertia::render('welcome'))->name('home');

Route::middleware(['auth', 'verified'])->group(function (): void {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('notifications', [NotificationsController::class, 'index'])->name('notifications.index');
    Route::get('integration', [IntegrationController::class, 'index'])->name('integration.index');
    Route::get('approvals', [ApprovalController::class, 'index'])->name('approvals.index');
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
require __DIR__ . '/github.php';
require __DIR__ . '/trello.php';
require __DIR__ . '/client.php';
require __DIR__ . '/team.php';
require __DIR__ . '/project.php';
require __DIR__ . '/task.php';
require __DIR__ . '/timelog.php';
require __DIR__ . '/invoice.php';
require __DIR__ . '/calendar.php';
require __DIR__ . '/features.php';
require __DIR__ . '/legal.php';
require __DIR__ . '/tags.php';
require __DIR__ . '/admin.php';
