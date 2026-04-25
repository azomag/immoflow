"use client";

import { useMemo, useState } from "react";
import { Send } from "lucide-react";
import type { AuthenticatedUser, NotificationRecord, UserRecord } from "@/lib/api";
import { backendRequest } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { initials, relativeTime } from "@/components/dashboard/workspace-utils";

export function NotificationsPanel({
  token,
  user,
  users,
  notifications,
  reload,
}: {
  token: string;
  user: AuthenticatedUser;
  users: UserRecord[];
  notifications: NotificationRecord[];
  reload: () => Promise<void>;
}) {
  const [form, setForm] = useState({
    recipient_id: "",
    subject: "",
    message: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recipients = useMemo(() => {
    if (user.role === "locataire") {
      return users.filter((entry) => entry.role === "agent");
    }

    if (user.role === "agent") {
      return users.filter((entry) => ["admin", "super_admin", "locataire"].includes(entry.role));
    }

    return users.filter((entry) => ["agent", "locataire"].includes(entry.role));
  }, [user.role, users]);

  async function sendNotification() {
    setBusy(true);
    setError(null);

    try {
      await backendRequest("/api/notifications", {
        method: "POST",
        body: JSON.stringify({
          recipient_id: Number(form.recipient_id),
          subject: form.subject,
          message: form.message,
        }),
      }, token);
      setForm({ recipient_id: "", subject: "", message: "" });
      await reload();
    } catch (notificationError) {
      setError(notificationError instanceof Error ? notificationError.message : "Notification failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-6">
        <div>
          <h1 className="text-[36px] font-semibold tracking-tight">Notifications</h1>
          <p className="mt-2 text-black/55">Messages between tenants, agents, and administrators.</p>
        </div>

        <div className="overflow-hidden rounded-[24px] border border-black/6 bg-white">
          {notifications.length === 0 ? (
            <div className="p-8 text-sm text-black/50">No notifications yet.</div>
          ) : (
            notifications.map((notification) => {
              const inbound = notification.recipient.id === user.id;
              const actor = inbound ? notification.sender : notification.recipient;

              return (
                <div key={notification.id} className="border-b border-black/6 p-6 last:border-b-0">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-11 w-11">
                      <AvatarImage src={actor.avatar_url ?? undefined} alt={actor.name} />
                      <AvatarFallback>{initials(actor.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="font-semibold">
                          {notification.subject}
                          <span className="ml-2 text-sm font-normal text-black/45">
                            {inbound ? "from" : "to"} {actor.name}
                          </span>
                        </div>
                        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-black/35">
                          {relativeTime(notification.created_at)}
                        </div>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-black/60">{notification.message}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="rounded-[24px] border border-black/6 bg-white p-6">
        <div className="text-[22px] font-semibold">Send notification</div>
        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label>Recipient</Label>
            <select
              className="h-12 w-full rounded-2xl border border-black/8 bg-white px-4"
              value={form.recipient_id}
              onChange={(event) => setForm((current) => ({ ...current, recipient_id: event.target.value }))}
            >
              <option value="">Select recipient</option>
              {recipients.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name} • {entry.role.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Subject</Label>
            <Input value={form.subject} onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Message</Label>
            <textarea
              className="min-h-32 w-full rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
              value={form.message}
              onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
            />
          </div>
          {error ? <div className="text-sm text-[var(--danger)]">{error}</div> : null}
          <Button className="w-full rounded-2xl" disabled={busy} onClick={() => void sendNotification()}>
            <Send className="h-4 w-4" />
            Send
          </Button>
        </div>
      </div>
    </section>
  );
}
