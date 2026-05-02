<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ConversationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $query = Conversation::query()
            ->with([
                'participants:id,name,email,role,avatar_url',
                'messages' => fn ($query) => $query
                    ->with('sender:id,name,email,role,avatar_url')
                    ->oldest()
                    ->limit(80),
            ])
            ->latest('last_message_at');

        if ($user->role !== 'super_admin') {
            $query->whereHas('participants', fn ($participants) => $participants->whereKey($user->id));
        }

        return response()->json([
            'conversations' => $query->get(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        /** @var User $sender */
        $sender = $request->user();

        $validated = $request->validate([
            'recipient_id' => ['required', 'integer', 'exists:users,id'],
            'body' => ['required', 'string', 'max:4000'],
        ]);

        $recipient = User::query()->findOrFail($validated['recipient_id']);

        if (! $this->canMessage($sender, $recipient)) {
            return response()->json([
                'message' => 'This conversation is not allowed for your role.',
            ], 403);
        }

        $conversation = DB::transaction(function () use ($sender, $recipient, $validated): Conversation {
            $conversation = $this->findDirectConversation($sender, $recipient)
                ?? Conversation::create([
                    'created_by_id' => $sender->id,
                    'last_message_at' => now(),
                ]);

            $conversation->participants()->syncWithoutDetaching([$sender->id, $recipient->id]);

            Message::create([
                'conversation_id' => $conversation->id,
                'sender_id' => $sender->id,
                'body' => $validated['body'],
            ]);

            $conversation->update([
                'last_message_at' => now(),
            ]);

            return $conversation;
        });

        return response()->json([
            'message' => 'Message sent.',
            'conversation' => $conversation->fresh([
                'participants:id,name,email,role,avatar_url',
                'messages.sender:id,name,email,role,avatar_url',
            ]),
        ], 201);
    }

    public function reply(Request $request, Conversation $conversation): JsonResponse
    {
        /** @var User $sender */
        $sender = $request->user();

        if (! $this->canAccessConversation($sender, $conversation)) {
            return response()->json([
                'message' => 'You cannot access this conversation.',
            ], 403);
        }

        $validated = $request->validate([
            'body' => ['required', 'string', 'max:4000'],
        ]);

        Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $sender->id,
            'body' => $validated['body'],
        ]);

        $conversation->participants()->syncWithoutDetaching([$sender->id]);
        $conversation->update([
            'last_message_at' => now(),
        ]);

        $conversation->participants()->updateExistingPivot($sender->id, [
            'last_read_at' => now(),
        ]);

        return response()->json([
            'message' => 'Message sent.',
            'conversation' => $conversation->fresh([
                'participants:id,name,email,role,avatar_url',
                'messages.sender:id,name,email,role,avatar_url',
            ]),
        ], 201);
    }

    private function findDirectConversation(User $sender, User $recipient): ?Conversation
    {
        return Conversation::query()
            ->whereHas('participants', fn ($query) => $query->whereKey($sender->id))
            ->whereHas('participants', fn ($query) => $query->whereKey($recipient->id))
            ->withCount('participants')
            ->having('participants_count', '=', 2)
            ->first();
    }

    private function canAccessConversation(User $user, Conversation $conversation): bool
    {
        if ($user->role === 'super_admin') {
            return true;
        }

        return $conversation->participants()->whereKey($user->id)->exists();
    }

    private function canMessage(User $sender, User $recipient): bool
    {
        if ($sender->id === $recipient->id) {
            return false;
        }

        return match ($sender->role) {
            'locataire' => $recipient->role === 'agent',
            'agent' => in_array($recipient->role, ['admin', 'super_admin', 'locataire'], true),
            'admin' => in_array($recipient->role, ['agent', 'locataire'], true),
            'super_admin' => in_array($recipient->role, ['admin', 'agent', 'locataire'], true),
            default => false,
        };
    }
}
