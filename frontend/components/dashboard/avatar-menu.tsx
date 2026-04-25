"use client";

import { startTransition } from "react";
import { signOut } from "next-auth/react";
import { LogOut, UserRound } from "lucide-react";
import type { AuthenticatedUser } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { initials } from "@/components/dashboard/workspace-utils";

export function AvatarMenu({
  user,
  onProfile,
}: {
  user: AuthenticatedUser;
  onProfile: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]">
        <Avatar className="h-11 w-11 border border-black/8">
          <AvatarImage src={user.avatar_url ?? undefined} alt={user.name} />
          <AvatarFallback>{initials(user.name)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <div className="px-3 py-2">
          <div className="font-semibold">{user.name}</div>
          <div className="truncate text-xs text-black/50">{user.email}</div>
        </div>
        <DropdownMenuItem onClick={onProfile}>
          <UserRound className="h-4 w-4" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-[var(--danger)]"
          onClick={() => startTransition(() => void signOut({ callbackUrl: "/login" }))}
        >
          <LogOut className="h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
