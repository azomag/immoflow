"use client";

import { startTransition } from "react";
import { signOut } from "next-auth/react";
import { LogOut, UserRound, Settings, ChevronDown } from "lucide-react";
import type { AuthenticatedUser } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { initials } from "@/components/dashboard/workspace-utils";

const roleLabel: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  agent: "Agent",
  locataire: "Locataire",
};

export function AvatarMenu({
  user,
  onProfile,
}: {
  user: AuthenticatedUser;
  onProfile: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]">
        <Avatar className="h-9 w-9 border-2 border-white/20 shadow-[0_2px_8px_rgba(0,0,0,0.15)]">
          <AvatarImage src={user.avatar_url ?? undefined} alt={user.name} />
          <AvatarFallback className="bg-[var(--primary)] text-white text-xs font-bold">
            {initials(user.name)}
          </AvatarFallback>
        </Avatar>
        <ChevronDown className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-2xl p-1.5">
        {/* User info header */}
        <div className="px-3 py-2.5">
          <div className="font-semibold text-[var(--foreground)] truncate">{user.name}</div>
          <div className="mt-0.5 truncate text-xs text-[var(--muted-foreground)]">{user.email}</div>
          <div className="mt-2 inline-flex items-center rounded-full bg-[rgba(1,73,124,0.1)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--primary)]">
            {roleLabel[user.role] ?? user.role}
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium cursor-pointer"
          onClick={onProfile}
        >
          <UserRound className="h-4 w-4 text-[var(--muted-foreground)]" />
          My Profile
        </DropdownMenuItem>
        <DropdownMenuItem
          className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium cursor-pointer"
          onClick={onProfile}
        >
          <Settings className="h-4 w-4 text-[var(--muted-foreground)]" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--danger)] focus:text-[var(--danger)] cursor-pointer"
          onClick={() =>
            startTransition(() => void signOut({ callbackUrl: "/login" }))
          }
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
