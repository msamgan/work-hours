<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Notifications\DatabaseNotification;
use Inertia\Response;
use Msamgan\Lact\Attributes\Action;
use Psr\Container\ContainerExceptionInterface;
use Psr\Container\NotFoundExceptionInterface;

final class NotificationsController extends Controller
{
    /**
     * Display the notification page.
     */
    public function index(): Response
    {
        return inertia('notifications');
    }

    /**
     * Get all notifications for the authenticated user.
     */
    #[Action(method: 'get', name: 'notifications.all', middleware: ['auth', 'verified'])]
    public function all(): array
    {
        $user = auth()->user();

        // Check if the user is an admin using the model method
        $isAdmin = $user->isAdmin();

        return [
            'notifications' => $user->notifications()->paginate(10)->through(fn ($notification): array => [
                'id' => $notification->id,
                'type' => class_basename($notification->type),
                'data' => $notification->data,
                'read_at' => $notification->read_at,
                'created_at' => $notification->created_at->diffForHumans(),
            ]),
            'unread_count' => $user->unreadNotifications()->count(),
            'user' => [
                'is_admin' => $isAdmin,
            ],
        ];
    }

    /**
     * Mark all notifications as read.
     */
    #[Action(method: 'post', name: 'notifications.mark-all-as-read', middleware: ['auth', 'verified'])]
    public function markAllAsRead(): JsonResponse
    {
        $user = auth()->user();
        $user->unreadNotifications->markAsRead();

        return response()->json(['message' => 'All notifications marked as read']);
    }

    /**
     * Mark a specific notification as read.
     */
    #[Action(method: 'post', name: 'notifications.mark-as-read', middleware: ['auth', 'verified'])]
    public function markAsRead(): JsonResponse
    {
        try {
            $notification = DatabaseNotification::query()->findOrFail(request()->get('id'));

            if ($notification->notifiable_id !== auth()->id()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $notification->markAsRead();

            return response()->json(['message' => 'Notification marked as read']);
        } catch (NotFoundExceptionInterface|ContainerExceptionInterface) {
            return response()->json(['message' => 'Notification not found'], 404);
        } catch (Exception) {
            return response()->json(['message' => 'An error occurred while marking the notification as read'], 500);
        }
    }
}
