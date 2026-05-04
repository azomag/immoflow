"use client";

import { useEffect, useMemo, useState } from "react";
import { MessageCircle, Plus, Search, Send, Inbox } from "lucide-react";
import type { AuthenticatedUser, ConversationRecord, UserRecord } from "@/lib/api";
import { backendRequest } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { initials, relativeTime } from "@/components/dashboard/workspace-utils";

export function NotificationsPanel({
  token,
  user,
  users,
}: {
  token: string;
  user: AuthenticatedUser;
  users: UserRecord[];
}) {
  const [conversations, setConversations] = useState<ConversationRecord[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [recipientId, setRecipientId] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recipients = useMemo(() => {
    if (user.role === "locataire")
      return users.filter((e) => e.role === "agent");
    if (user.role === "agent")
      return users.filter((e) =>
        ["admin", "super_admin", "locataire"].includes(e.role)
      );
    if (user.role === "admin")
      return users.filter((e) => ["agent", "locataire"].includes(e.role));
    return users.filter((e) => e.id !== user.id);
  }, [user.id, user.role, users]);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeConversationId) ?? null,
    [activeConversationId, conversations]
  );

  const selectedRecipient = useMemo(
    () => recipients.find((e) => String(e.id) === recipientId) ?? null,
    [recipientId, recipients]
  );

  const filteredConversations = useMemo(() => {
    const query = search.trim().toLowerCase();
    return conversations.filter((c) => {
      const names = c.participants
        .filter((p) => p.id !== user.id)
        .map((p) => p.name)
        .join(" ");
      const last = c.messages.at(-1)?.body ?? "";
      return `${names} ${last}`.toLowerCase().includes(query);
    });
  }, [conversations, search, user.id]);

  async function loadConversations() {
    const res = await backendRequest<{ conversations: ConversationRecord[] }>(
      "/api/conversations",
      {},
      token
    );
    setConversations(res.conversations);
    return res.conversations;
  }

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await backendRequest<{ conversations: ConversationRecord[] }>(
          "/api/conversations",
          {},
          token
        );
        if (!cancelled) {
          setConversations(res.conversations);
          setActiveConversationId((cur) => cur ?? res.conversations[0]?.id ?? null);
        }
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Messages could not be loaded.");
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  async function sendMessage() {
    const body = message.trim();
    if (!body) return;
    setBusy(true);
    setError(null);
    try {
      let nextId = activeConversation?.id ?? null;
      if (activeConversation) {
        await backendRequest(
          `/api/conversations/${activeConversation.id}/messages`,
          { method: "POST", body: JSON.stringify({ body }) },
          token
        );
      } else {
        if (!recipientId) throw new Error("Choose a contact before sending.");
        const res = await backendRequest<{ conversation: ConversationRecord }>(
          "/api/conversations",
          { method: "POST", body: JSON.stringify({ recipient_id: Number(recipientId), body }) },
          token
        );
        nextId = res.conversation.id;
      }
      setMessage("");
      setRecipientId("");
      const next = await loadConversations();
      setActiveConversationId(nextId ?? next[0]?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Message could not be sent.");
    } finally {
      setBusy(false);
    }
  }

  function contactName(c: ConversationRecord): string {
    const others = c.participants.filter((p) => p.id !== user.id);
    if (user.role === "super_admin")
      return c.participants.map((p) => p.name).join(" · ");
    return others.map((p) => p.name).join(", ") || "Conversation";
  }

  const activeContact = activeConversation
    ? activeConversation.participants.find((p) => p.id !== user.id) ??
      activeConversation.participants[0]
    : selectedRecipient;

  return (
    <div className="w-full overflow-hidden rounded-3xl border border-[var(--border)] bg-white shadow-[var(--shadow)] min-h-[calc(100vh-220px)]">
      <div className="grid h-full lg:grid-cols-[360px_minmax(0,1fr)]">
        {/* ── Sidebar ── */}
        <aside className="flex flex-col border-r border-[var(--border)] bg-[#f8f7f5]">
          {/* Header */}
          <div className="p-5 border-b border-[var(--border)]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-[var(--foreground)]">Messages</h2>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                  {conversations.length} conversation{conversations.length !== 1 ? "s" : ""}
                </p>
              </div>
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--primary)] text-white shadow-[var(--shadow-primary)] transition hover:bg-[var(--primary-hover)]"
                onClick={() => {
                  setActiveConversationId(null);
                  setRecipientId("");
                  setMessage("");
                }}
                title="New conversation"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search conversations…"
                className="h-10 rounded-xl border-[var(--border)] bg-white pl-10 text-sm shadow-none"
              />
            </div>
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(1,73,124,0.08)]">
                  <Inbox className="h-5 w-5 text-[var(--primary)]" />
                </div>
                <p className="text-sm text-[var(--muted-foreground)]">No conversations yet</p>
              </div>
            ) : (
              filteredConversations.map((c) => {
                const last = c.messages.at(-1);
                const participant =
                  c.participants.find((p) => p.id !== user.id) ?? c.participants[0];
                const isActive = activeConversation?.id === c.id;

                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setActiveConversationId(c.id)}
                    className={`flex w-full gap-3 border-b border-[var(--border)] p-4 text-left transition ${
                      isActive
                        ? "bg-white shadow-[inset_3px_0_0_var(--primary)]"
                        : "hover:bg-white/70"
                    }`}
                  >
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage
                        src={participant?.avatar_url ?? undefined}
                        alt={participant?.name ?? "Contact"}
                      />
                      <AvatarFallback className="bg-[rgba(1,73,124,0.12)] text-[var(--primary)] text-xs font-bold">
                        {initials(participant?.name ?? "IM")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="truncate text-sm font-semibold text-[var(--foreground)]">
                          {contactName(c)}
                        </div>
                        <div className="shrink-0 text-[11px] text-[var(--muted-foreground)]">
                          {relativeTime(c.last_message_at)}
                        </div>
                      </div>
                      <div className="mt-0.5 truncate text-xs text-[var(--muted-foreground)]">
                        {last?.body ?? "No messages yet"}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* New conversation area */}
          <div className="border-t border-[var(--border)] p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
              New message to
            </p>
            <Select
              value={recipientId}
              onValueChange={(val) => {
                setRecipientId(val);
                setActiveConversationId(null);
              }}
            >
              <SelectTrigger className="h-10 rounded-xl border-[var(--border)] bg-white text-sm">
                <SelectValue placeholder="Choose a contact…" />
              </SelectTrigger>
              <SelectContent
                className="max-h-72 w-[var(--radix-select-trigger-width)] rounded-xl"
                position="popper"
              >
                {recipients.map((r) => (
                  <SelectItem key={r.id} value={String(r.id)} className="rounded-lg py-2">
                    <div className="flex w-full items-center justify-between gap-2">
                      <span className="truncate font-medium">{r.name}</span>
                      <span className="shrink-0 text-xs text-[var(--muted-foreground)]">
                        {r.role.replace("_", " ")}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </aside>

        {/* ── Chat area ── */}
        <div className="flex min-h-[520px] flex-col bg-[#fbfbf9] lg:min-h-[680px]">
          {/* Chat header */}
          <header className="flex items-center gap-3 border-b border-[var(--border)] bg-white px-6 py-4">
            <Avatar className="h-10 w-10">
              <AvatarImage
                src={activeContact?.avatar_url ?? undefined}
                alt={activeContact?.name ?? "Contact"}
              />
              <AvatarFallback className="bg-[rgba(1,73,124,0.12)] text-[var(--primary)] text-xs font-bold">
                {initials(activeContact?.name ?? "IM")}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-semibold text-[var(--foreground)]">
                {activeConversation
                  ? contactName(activeConversation)
                  : "New conversation"}
              </div>
              <div className="text-xs text-[var(--muted-foreground)]">
                {activeContact
                  ? activeContact.role.replace("_", " ")
                  : "Pick a contact from the left panel"}
              </div>
            </div>
          </header>

          {/* Messages */}
          <div className="flex-1 space-y-3 overflow-y-auto px-6 py-6">
            {activeConversation?.messages.length ? (
              activeConversation.messages.map((item) => {
                const mine = item.sender_id === user.id;
                return (
                  <div
                    key={item.id}
                    className={`flex ${mine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 sm:max-w-[70%] ${
                        mine
                          ? "rounded-br-sm bg-[var(--primary)] text-white shadow-[var(--shadow-primary)]"
                          : "rounded-bl-sm border border-[var(--border)] bg-white text-[var(--foreground)] shadow-[var(--shadow-sm)]"
                      }`}
                    >
                      <p className="whitespace-pre-wrap text-sm leading-6">
                        {item.body}
                      </p>
                      <p
                        className={`mt-1.5 text-[11px] ${
                          mine ? "text-white/55" : "text-[var(--muted-foreground)]"
                        }`}
                      >
                        {relativeTime(item.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(1,73,124,0.08)]">
                  <MessageCircle className="h-6 w-6 text-[var(--primary)]" />
                </div>
                <p className="text-sm text-[var(--muted-foreground)] max-w-xs">
                  Choose a contact, write a message, and a conversation will be created.
                </p>
              </div>
            )}
          </div>

          <Separator />
          {/* Message input */}
          <footer className="bg-white p-4">
            {error ? (
              <p className="mb-2 text-xs font-medium text-[var(--danger)]">{error}</p>
            ) : null}
            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-end">
              <textarea
                className="min-h-[44px] flex-1 resize-none rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--ring)]"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void sendMessage();
                  }
                }}
                placeholder="Write a message… (Enter to send)"
              />
              <Button
                className="h-11 rounded-2xl bg-[var(--primary)] px-5 shadow-[var(--shadow-primary)] hover:bg-[var(--primary-hover)] sm:w-auto"
                disabled={busy}
                onClick={() => void sendMessage()}
              >
                <Send className="h-4 w-4" />
                Send
              </Button>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
