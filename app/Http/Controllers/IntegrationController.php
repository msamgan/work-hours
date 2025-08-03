<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

final class IntegrationController extends Controller
{
    /**
     * Display the integration page.
     */
    public function index(): Response
    {
        $user = Auth::user();
        $isGitHubIntegrated = ! empty($user->github_token);
        $isTrelloIntegrated = ! empty($user->trello_token);

        return Inertia::render('integration/index', [
            'isGitHubIntegrated' => $isGitHubIntegrated,
            'isTrelloIntegrated' => $isTrelloIntegrated,
        ]);
    }
}
