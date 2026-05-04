<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        return response()->json([
            'notifications' => Notification::query()
                ->with([
                    'sender:id,name,email,role,avatar_url',
                    'recipient:id,name,email,role,avatar_url',
                ])
                ->where(function ($query) use ($user): void {
                    $query
                        ->where('sender_id', $user->id)
                        ->orWhere('recipient_id', $user->id);
                })
                ->latest()
                ->limit(50)
                ->get(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        /** @var User $sender */
        $sender = $request->user();

        $validated = $request->validate([
            'recipient_id' => ['required', 'integer', 'exists:users,id'],
            'subject' => ['required', 'string', 'max:255'],
            'message' => ['required', 'string', 'max:2000'],
        ]);

        $recipient = User::query()->findOrFail($validated['recipient_id']);

        if (! $this->canMessage($sender, $recipient)) {
            return response()->json([
                'message' => 'This notification route is not allowed for your role.',
            ], 403);
        }

        $notification = Notification::create([
            'sender_id' => $sender->id,
            'recipient_id' => $recipient->id,
            'subject' => $validated['subject'],
            'message' => $validated['message'],
        ]);

        return response()->json([
            'message' => 'Notification sent.',
            'notification' => $notification->load([
                'sender:id,name,email,role,avatar_url',
                'recipient:id,name,email,role,avatar_url',
            ]),
        ], 201);
    }

    public function markRead(Request $request, Notification $notification): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if ($notification->recipient_id !== $user->id) {
            return response()->json([
                'message' => 'Only the recipient can mark this notification as read.',
            ], 403);
        }

        $notification->update([
            'read_at' => now(),
        ]);

        return response()->json([
            'message' => 'Notification read.',
            'notification' => $notification->fresh([
                'sender:id,name,email,role,avatar_url',
                'recipient:id,name,email,role,avatar_url',
            ]),
        ]);
    }

    public function destroy(Request $request, Notification $notification): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if ($notification->sender_id !== $user->id && $notification->recipient_id !== $user->id) {
            return response()->json([
                'message' => 'You can only delete your own notifications.',
            ], 403);
        }

        $notification->delete();

        return response()->json([
            'message' => 'Notification deleted.',
        ]);
    }

    private function canMessage(User $sender, User $recipient): bool
    {
        return match ($sender->role) {
            'locataire' => $recipient->role === 'agent',
            'agent' => in_array($recipient->role, ['admin', 'super_admin', 'locataire'], true),
            'admin', 'super_admin' => in_array($recipient->role, ['agent', 'locataire'], true),
            default => false,
        };
    }
}
