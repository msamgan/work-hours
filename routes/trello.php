<?php

declare(strict_types=1);

use App\Http\Controllers\Auth\TrelloAuthController;
use App\Http\Controllers\TrelloBoardController;
use Illuminate\Support\Facades\Route;

// Trello Auth Routes
Route::get('/auth/trello', [TrelloAuthController::class, 'redirect'])
    ->name('auth.trello');
Route::get('/auth/trello/callback', [TrelloAuthController::class, 'callback'])
    ->name('auth.trello.callback');

// Trello Board Routes
Route::middleware(['auth'])->group(function (): void {
    // Get user's boards
    Route::get('/trello/boards', [TrelloBoardController::class, 'getBoards'])
        ->name('trello.boards');

    // Get lists from a board
    Route::get('/trello/boards/{boardId}/lists', [TrelloBoardController::class, 'getBoardLists'])
        ->name('trello.board.lists');

    // Get cards from a list
    Route::get('/trello/lists/{listId}/cards', [TrelloBoardController::class, 'getListCards'])
        ->name('trello.list.cards');

    // Import a board as a project
    Route::post('/trello/boards/import', [TrelloBoardController::class, 'importBoard'])
        ->name('trello.board.import');
});
