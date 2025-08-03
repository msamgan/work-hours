<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Adapters\TrelloAdapter;
use App\Http\Controllers\Controller;
use Exception;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

final class TrelloAuthController extends Controller
{
    public function __construct(private readonly TrelloAdapter $trelloAdapter) {}

    /**
     * Redirect the user to the Trello authentication page.
     */
    public function redirect(): RedirectResponse
    {
        return $this->trelloAdapter->redirectToTrello();
    }

    /**
     * Handle the callback from Trello.
     */
    public function callback(Request $request): RedirectResponse
    {
        try {
            $trelloData = $this->trelloAdapter->handleTrelloCallback();
            $user = $trelloData['user'];

            // Store Trello token in user's record
            $user->update([
                'trello_token' => $trelloData['token'],
            ]);

            Auth::login($user, true);

            return redirect()->route('dashboard')->with('status', 'Successfully authenticated with Trello!');

        } catch (Exception $e) {
            Log::error('Trello authentication error: ' . $e->getMessage());

            return redirect()->route('login')
                ->with('error', 'An error occurred during Trello authentication.');
        }
    }
}
