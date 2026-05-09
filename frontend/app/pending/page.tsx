"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { Clock3, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";

export default function PendingPage() {
  const { data: session } = useSession();

  return (
    <main className="page-grid flex min-h-screen items-center justify-center px-6 py-10">
      <LanguageSwitcher className="absolute right-6 top-6" />
      <Card className="w-full max-w-xl">
        <CardHeader>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(210,138,30,0.14)] text-[var(--warning)]">
            <Clock3 className="h-6 w-6" />
          </div>
          <CardTitle className="text-3xl">Account awaiting approval</CardTitle>
          <CardDescription className="text-base leading-7">
            {session?.user?.email
              ? `${session.user.email} is registered, but this role still needs approval before dashboard access is unlocked.`
              : "Your account is registered, but this role still needs approval before dashboard access is unlocked."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-[24px] bg-white/75 p-4 text-sm leading-6 text-[var(--muted-foreground)]">
            Locataires become active immediately. Agent accounts need admin approval. Admin accounts need super admin approval.
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/login">
              <Button>
                <ShieldAlert className="h-4 w-4" />
                Back to login
              </Button>
            </Link>
            <Button variant="outline" onClick={() => void signOut({ callbackUrl: "/login" })}>
              Sign out
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
