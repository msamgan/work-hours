<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Legal pages routes
Route::prefix('legal')->group(function (): void {
    Route::get('/privacy-policy', fn () => Inertia::render('legal/PrivacyPolicy'))->name('privacy-policy');
    Route::get('/terms-of-service', fn () => Inertia::render('legal/TermsOfService'))->name('terms-of-service');
    Route::get('/cookie-policy', fn () => Inertia::render('legal/CookiePolicy'))->name('cookie-policy');
    Route::get('/gdpr-compliance', fn () => Inertia::render('legal/GDPRCompliance'))->name('gdpr-compliance');
    Route::get('/security', fn () => Inertia::render('legal/Security'))->name('security');
});
