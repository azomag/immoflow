<?php

namespace App\Support;

use App\Models\Notification;
use App\Models\User;

class DashboardNotification
{
    /**
     * @param array<int, int|null> $recipientIds
     */
    public static function send(User $sender, array $recipientIds, string $subject, string $message): void
    {
        $uniqueRecipients = collect($recipientIds)
            ->filter(fn ($id) => is_int($id) && $id > 0)
            ->unique()
            ->reject(fn ($id) => $id === $sender->id)
            ->values();

        if ($uniqueRecipients->isEmpty()) {
            return;
        }

        $rows = $uniqueRecipients
            ->map(fn ($recipientId) => [
                'sender_id' => $sender->id,
                'recipient_id' => $recipientId,
                'subject' => $subject,
                'message' => $message,
                'created_at' => now(),
                'updated_at' => now(),
            ])
            ->all();

        Notification::query()->insert($rows);
    }

    /**
     * @return array<int, int>
     */
    public static function adminRecipientIds(): array
    {
        return User::query()
            ->whereIn('role', ['admin', 'super_admin'])
            ->pluck('id')
            ->all();
    }
}

