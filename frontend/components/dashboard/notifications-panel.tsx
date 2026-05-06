"use client";

import { useEffect, useMemo, useState } from "react";
import { MessageCircle, Search, Send, Inbox, MessageSquarePlus, ArrowLeft } from "lucide-react";
import type { AuthenticatedUser, ConversationRecord, UserRecord } from "@/lib/api";
import { backendRequest } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/components/dashboard/workspace-utils"; // Removed relativeTime

// Helper to safely parse dates (fixes timezone shifts if backend sends raw SQL dates)
function parseDate(dateString: string): Date {
  if (!dateString) return new Date();
  // If the date looks like "YYYY-MM-DD HH:mm:ss" without a timezone, append "Z" to treat it as UTC
  const safeString = dateString.includes("T") 
    ? dateString 
    : dateString.replace(" ", "T") + (dateString.includes("Z") || dateString.includes("+") ? "" : "Z");
  return new Date(safeString);
}

// Formats time exactly like "11:57 AM" for chat bubbles
function formatExactTime(dateString: string): string {
  const date = parseDate(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Formats time for the sidebar (Time for today, "Yesterday", or Date for older)
function formatSidebarTime(dateString: string): string {
  if (!dateString) return "";
  const date = parseDate(dateString);
  const now = new Date();
  
  const isToday = date.getDate() === now.getDate() && 
                  date.getMonth() === now.getMonth() && 
                  date.getFullYear() === now.getFullYear();
                  
  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.getDate() === yesterday.getDate() && 
                      date.getMonth() === yesterday.getMonth() && 
                      date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) {
    return "Yesterday";
  }

  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

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
  const [contactsSearch, setContactsSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showContactsList, setShowContactsList] = useState(false);

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

  const filteredContacts = useMemo(() => {
    const query = contactsSearch.trim().toLowerCase();
    return recipients.filter((r) =>
      r.name.toLowerCase().includes(query) || r.role.toLowerCase().includes(query)
    );
  }, [recipients, contactsSearch]);

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

  function handleSelectContact(contact: UserRecord) {
    const existingConv = conversations.find((c) =>
      c.participants.some((p) => p.id === contact.id)
    );

    if (existingConv) {
      setActiveConversationId(existingConv.id);
      setRecipientId("");
    } else {
      setActiveConversationId(null);
      setRecipientId(String(contact.id));
    }
    
    setShowContactsList(false);
    setContactsSearch("");
  }

  const activeContact = activeConversation
    ? activeConversation.participants.find((p) => p.id !== user.id) ??
      activeConversation.participants[0]
    : selectedRecipient;

  return (
    <div className="flex h-[calc(100vh-6rem)] w-full overflow-hidden rounded-xl border border-[var(--border)] bg-white shadow-sm">
      
      {/* ── Sidebar (Left Pane) ── */}
      <aside className="relative flex w-[350px] shrink-0 flex-col overflow-hidden border-r border-[var(--border)] bg-white">
        
        {/* View 1: Conversations List */}
        <div className={`absolute inset-0 flex flex-col bg-white transition-transform duration-300 ${showContactsList ? "-translate-x-full" : "translate-x-0"}`}>
          <div className="flex items-center justify-between bg-[#f0f2f5] px-4 h-16 border-b border-[var(--border)] shrink-0">
            <h2 className="text-xl font-bold text-[var(--foreground)] tracking-tight">Chats</h2>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--muted-foreground)] hover:bg-black/5 transition"
              onClick={() => setShowContactsList(true)}
              title="New chat"
            >
              <MessageSquarePlus className="h-5 w-5" />
            </button>
          </div>
          
          <div className="p-2 border-b border-[var(--border)] bg-white shrink-0">
            <div className="relative flex items-center rounded-lg bg-[#f0f2f5] px-3 py-1.5">
              <Search className="h-4 w-4 text-[var(--muted-foreground)]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search or start a new chat"
                className="ml-3 flex-1 bg-transparent text-[14px] outline-none placeholder:text-[var(--muted-foreground)]"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 p-8 text-center h-full">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f0f2f5]">
                  <Inbox className="h-6 w-6 text-[var(--muted-foreground)]" />
                </div>
                <p className="text-sm text-[var(--muted-foreground)]">No conversations found</p>
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
                    onClick={() => {
                      setActiveConversationId(c.id);
                      setRecipientId("");
                    }}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-[#f5f6f6] ${
                      isActive ? "bg-[#f0f2f5]" : ""
                    }`}
                  >
                    <Avatar className="h-12 w-12 shrink-0">
                      <AvatarImage
                        src={participant?.avatar_url ?? undefined}
                        alt={participant?.name ?? "Contact"}
                      />
                      <AvatarFallback className="bg-[rgba(1,73,124,0.12)] text-[var(--primary)] text-sm font-bold">
                        {initials(participant?.name ?? "IM")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1 border-b border-[var(--border)] pb-3 pt-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="truncate text-[15px] font-medium text-[var(--foreground)]">
                          {contactName(c)}
                        </div>
                        <div className="shrink-0 text-[12px] text-[var(--muted-foreground)]">
                          {/* UPDATED: Uses EXACT time format for sidebar */}
                          {c.last_message_at ? formatSidebarTime(c.last_message_at) : ""}
                        </div>
                      </div>
                      <div className="mt-0.5 truncate text-[13px] text-[var(--muted-foreground)]">
                        {last?.body ?? "No messages yet"}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* View 2: Contacts List (New Chat) */}
        <div className={`absolute inset-0 z-10 flex flex-col bg-white transition-transform duration-300 ${showContactsList ? "translate-x-0" : "translate-x-full"}`}>
          <div className="flex items-center gap-5 bg-[var(--primary)] px-4 h-24 pt-10 text-white shrink-0">
            <button
              onClick={() => setShowContactsList(false)}
              className="hover:bg-white/20 p-1.5 rounded-full transition"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-semibold">New chat</h2>
          </div>
          
          <div className="p-2 border-b border-[var(--border)] bg-white shrink-0">
            <div className="relative flex items-center rounded-lg bg-[#f0f2f5] px-3 py-1.5">
              <Search className="h-4 w-4 text-[var(--muted-foreground)]" />
              <input
                value={contactsSearch}
                onChange={(e) => setContactsSearch(e.target.value)}
                placeholder="Search contacts"
                className="ml-3 flex-1 bg-transparent text-[14px] outline-none placeholder:text-[var(--muted-foreground)]"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="py-4 px-4 text-[12px] font-medium text-[var(--primary)] uppercase tracking-wider">
              Contacts on Immoflow
            </div>
            {filteredContacts.length === 0 ? (
              <p className="p-4 text-center text-sm text-[var(--muted-foreground)]">No contacts found</p>
            ) : (
              filteredContacts.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleSelectContact(r)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 hover:bg-[#f5f6f6] transition text-left"
                >
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={r.avatar_url ?? undefined} alt={r.name} />
                    <AvatarFallback className="bg-[rgba(1,73,124,0.12)] text-[var(--primary)] text-xs font-bold">
                      {initials(r.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 border-b border-[var(--border)] pb-3 pt-1">
                    <div className="text-[15px] font-medium text-[var(--foreground)]">{r.name}</div>
                    <div className="text-[13px] text-[var(--muted-foreground)] capitalize">
                      {r.role.replace("_", " ")}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </aside>

      {/* ── Chat Area (Right Pane) ── */}
      <div className="flex min-w-0 flex-1 flex-col bg-[#efeae2] relative">
        {activeContact ? (
          <>
            {/* Chat header */}
            <header className="flex h-16 shrink-0 items-center gap-3 border-b border-[var(--border)] bg-[#f0f2f5] px-4 z-10">
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarImage
                  src={activeContact?.avatar_url ?? undefined}
                  alt={activeContact?.name ?? "Contact"}
                />
                <AvatarFallback className="bg-[rgba(1,73,124,0.12)] text-[var(--primary)] text-xs font-bold">
                  {initials(activeContact?.name ?? "IM")}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium text-[15px] text-[var(--foreground)]">
                  {activeConversation ? contactName(activeConversation) : activeContact.name}
                </div>
                <div className="truncate text-[12px] text-[var(--muted-foreground)] capitalize">
                  {activeContact.role.replace("_", " ")}
                </div>
              </div>
            </header>

            {/* Messages body */}
            <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 space-y-1.5 bg-[#efeae2] bg-[url('https://static.whatsapp.net/rsrc.php/v3/yl/r/gi_DckOUM5a.png')] bg-repeat opacity-95">
              {activeConversation?.messages.length ? (
                activeConversation.messages.map((item, index) => {
                  const mine = item.sender_id === user.id;
                  const prevMessage = activeConversation.messages[index - 1];
                  const showTail = !prevMessage || prevMessage.sender_id !== item.sender_id;

                  return (
                    <div
                      key={item.id}
                      className={`flex ${mine ? "justify-end" : "justify-start"} ${showTail ? "mt-3" : ""}`}
                    >
                      <div
                        className={`relative max-w-[85%] sm:max-w-[70%] px-2.5 pt-1.5 pb-2 text-[14.5px] leading-relaxed shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] ${
                          mine
                            ? "rounded-l-lg rounded-br-lg " + (showTail ? "rounded-tr-none" : "rounded-tr-lg")
                            : "bg-white text-[#111b21] rounded-r-lg rounded-bl-lg " + (showTail ? "rounded-tl-none" : "rounded-tl-lg")
                        }`}
                        style={mine ? { backgroundColor: 'var(--primary)', color: 'white' } : {}}
                      >
                        {showTail && (
                          <div 
                            className={`absolute top-0 ${mine ? "-right-[7px] text-[var(--primary)]" : "-left-[7px] text-white"}`}
                          >
                            <svg viewBox="0 0 8 13" width="8" height="13" className="fill-current">
                              <path 
                                opacity="0.13" 
                                d={mine ? "M5.188 1H0v11.193l6.467-8.625C7.526 2.156 6.958 1 5.188 1z" : "M2.812 1H8v11.193L1.533 3.568C.474 2.156 1.042 1 2.812 1z"}
                              ></path>
                              <path 
                                d={mine ? "M5.188 0H0v11.193l6.467-8.625C7.526 1.156 6.958 0 5.188 0z" : "M2.812 0H8v11.193L1.533 2.568C.474 1.156 1.042 0 2.812 0z"}
                              ></path>
                            </svg>
                          </div>
                        )}
                        
                        <div className="relative inline-block pr-12 min-w-[70px]">
                          <span className="whitespace-pre-wrap break-words">{item.body}</span>
                          <span
                            className={`absolute bottom-0 right-0 text-[10px] leading-tight ${
                              mine ? "text-white/70" : "text-[var(--muted-foreground)]"
                            }`}
                          >
                            {/* UPDATED: Uses exact parsed time for chat bubble */}
                            {formatExactTime(item.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex h-full items-center justify-center">
                  <div className="rounded-lg bg-[#ffeebb] px-4 py-2 text-xs text-center text-[#111b21] shadow-[0_1px_0.5px_rgba(11,20,26,0.13)]">
                    No messages yet. Send a message to start the conversation.
                  </div>
                </div>
              )}
            </div>

            {/* Message input footer */}
            <footer className="bg-[#f0f2f5] px-4 py-3 shrink-0 z-10">
              {error && <p className="mb-2 text-center text-xs font-medium text-[var(--danger)]">{error}</p>}
              <div className="flex items-end gap-3 max-w-5xl mx-auto w-full">
                <div className="flex min-h-[44px] flex-1 items-end rounded-xl bg-white px-4 py-2.5 shadow-sm border border-transparent focus-within:border-[var(--primary)] transition-colors">
                  <textarea
                    rows={1}
                    className="max-h-[120px] w-full resize-none bg-transparent text-[15px] outline-none"
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      e.target.style.height = 'auto';
                      e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void sendMessage();
                        e.currentTarget.style.height = 'auto';
                      }
                    }}
                    placeholder="Type a message"
                  />
                </div>
                <button
                  type="button"
                  disabled={busy || !message.trim()}
                  onClick={() => {
                    void sendMessage();
                    const ta = document.querySelector('textarea');
                    if(ta) ta.style.height = 'auto';
                  }}
                  className={`flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-full transition ${
                    message.trim() ? "bg-[var(--primary)] text-white hover:opacity-90 shadow-sm" : "bg-black/5 text-[#8696a0]"
                  }`}
                >
                  <Send className="h-5 w-5 ml-1" />
                </button>
              </div>
            </footer>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center bg-[#f0f2f5] text-center border-b-[6px] border-[var(--primary)]">
            <div className="flex h-72 w-72 flex-col items-center justify-center gap-6">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-sm text-[var(--primary)]">
                <MessageCircle className="h-10 w-10" />
              </div>
              <div>
                <h1 className="text-3xl font-light text-[var(--foreground)] mb-4">Immoflow Web</h1>
                <p className="text-sm text-[var(--muted-foreground)] max-w-sm mx-auto leading-relaxed">
                  Send and receive messages seamlessly. Select a contact from the left panel to get started.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}