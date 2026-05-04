"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, Check, Trash2 } from "lucide-react";
import type { NotificationRecord } from "@/lib/api";
import { backendRequest } from "@/lib/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { relativeTime } from "@/components/dashboard/workspace-utils";

export function NotificationsPopover({
  token,
  userId,
  notifications,
}: {
  token: string;
  userId: number;
  notifications: NotificationRecord[];
}) {
  const [items, setItems] = useState<NotificationRecord[]>(notifications);
  const [busyIds, setBusyIds] = useState<number[]>([]);

  useEffect(() => {
    setItems(notifications);
  }, [notifications]);

  const unreadCount = useMemo(
    () => items.filter((item) => item.recipient.id === userId && !item.read_at).length,
    [items, userId],
  );

  async function markRead(item: NotificationRecord) {
    if (item.recipient.id !== userId || item.read_at || busyIds.includes(item.id)) {
      return;
    }

    setBusyIds((current) => [...current, item.id]);
    try {
      await backendRequest(
        `/api/notifications/${item.id}/read`,
        { method: "PATCH" },
        token,
      );
      setItems((current) =>
        current.map((entry) =>
          entry.id === item.id
            ? { ...entry, read_at: new Date().toISOString() }
            : entry,
        ),
      );
    } finally {
      setBusyIds((current) => current.filter((id) => id !== item.id));
    }
  }

  async function deleteNotification(item: NotificationRecord) {
    if (busyIds.includes(item.id)) {
      return;
    }

    setBusyIds((current) => [...current, item.id]);
    try {
      await backendRequest(
        `/api/notifications/${item.id}`,
        { method: "DELETE" },
        token,
      );
      setItems((current) => current.filter((entry) => entry.id !== item.id));
    } finally {
      setBusyIds((current) => current.filter((id) => id !== item.id));
    }
  }

  const recentItems = items.slice(0, 8);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white border border-[var(--border)] text-[var(--muted-foreground)] shadow-[var(--shadow-sm)] transition hover:text-[var(--foreground)] hover:border-[var(--border-strong)]">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 ? (
            <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-[var(--danger)] px-1 text-[10px] font-semibold leading-4 text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[400px] p-0">
        <div className="px-5 py-4">
          <div className="text-sm font-semibold text-[var(--foreground)]">
            Notifications
          </div>
          <div className="text-xs text-[var(--muted-foreground)]">
            {unreadCount} unread
          </div>
        </div>
        <DropdownMenuSeparator />
        <div className="max-h-[380px] overflow-y-auto px-2 py-2">
          {recentItems.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
              No notifications yet.
            </div>
          ) : (
            recentItems.map((item) => (
              <DropdownMenuItem
                key={item.id}
                className="block cursor-default p-1 focus:bg-transparent data-[highlighted]:bg-transparent"
                onSelect={(event) => event.preventDefault()}
              >
                <div className="flex items-start justify-between gap-3 rounded-xl border border-[var(--border)] bg-white px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="truncate text-sm font-semibold text-[var(--foreground)]">
                        {item.subject}
                      </div>
                      {item.recipient.id === userId && !item.read_at ? (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--primary)]" />
                      ) : null}
                    </div>
                    <div className="mt-1 line-clamp-2 text-xs text-[var(--muted-foreground)]">
                      {item.message}
                    </div>
                    <div className="mt-1 text-[11px] text-[var(--muted-foreground)]">
                      {item.sender.name} • {relativeTime(item.created_at)}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {item.recipient.id === userId && !item.read_at ? (
                      <button
                        type="button"
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)] transition hover:bg-[var(--accent)]"
                        onClick={() => void markRead(item)}
                        disabled={busyIds.includes(item.id)}
                        title="Mark as read"
                      >
                        <Check className="h-4 w-4 stroke-[2.4] text-[var(--foreground)]" />
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--muted)] text-[var(--danger)] transition hover:border-[var(--danger)] hover:bg-[var(--danger-bg)]"
                      onClick={() => void deleteNotification(item)}
                      disabled={busyIds.includes(item.id)}
                      title="Delete notification"
                    >
                      <Trash2 className="h-4 w-4 stroke-[2.2] text-[var(--danger)]" />
                    </button>
                  </div>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
