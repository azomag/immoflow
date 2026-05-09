"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { syncGoogleWithBackend, type AppRole, type AuthResponse } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";

export default function AuthCompletePage() {
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const [error, setError] = useState<string | null>(null);
  const hasSynced = useRef(false);

  useEffect(() => {
    async function completeSync() {
      if (status !== "authenticated" || !session.user?.email || hasSynced.current) {
        return;
      }

      hasSynced.current = true;

      const storedRole = localStorage.getItem("immoflow-auth-role") as AppRole | null;
      const fallbackLogin =
        session.user.email.split("@")[0]?.replace(/[^a-zA-Z0-9._-]/g, "").slice(0, 30) ||
        undefined;

      try {
        const response = await syncGoogleWithBackend({
          google_id: session.user.id,
          email: session.user.email,
          name: session.user.name ?? session.user.email,
          avatar_url: session.user.image,
          login: fallbackLogin,
          role: storedRole === "super_admin" ? undefined : storedRole ?? undefined,
        });

        await update({
          backendSync: response,
        } satisfies { backendSync: AuthResponse });

        localStorage.removeItem("immoflow-auth-role");

        if (response.user.status !== "active") {
          router.replace("/pending");
          return;
        }

        router.replace("/dashboard");
      } catch (syncError) {
        localStorage.removeItem("immoflow-auth-role");
        setError(syncError instanceof Error ? syncError.message : "Could not complete sign-in.");
      }
    }

    void completeSync();
  }, [router, session, status, update]);

  return (
    <main className="page-grid flex min-h-screen items-center justify-center px-6 py-10">
      <LanguageSwitcher className="absolute right-6 top-6" />
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle className="text-3xl">Finishing Google sign-in</CardTitle>
          <CardDescription>
            Synchronizing your Google account with ImmoFlow...
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <>
              <div className="rounded-[24px] bg-[rgba(186,74,69,0.12)] p-4 text-sm text-[var(--danger)]">
                {error}
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/signup">
                  <Button>Create account first</Button>
                </Link>
                <Button variant="outline" onClick={() => void signOut({ callbackUrl: "/login" })}>
                  Cancel Google session
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3 rounded-[24px] bg-white/75 p-4 text-sm text-[var(--muted-foreground)]">
              <LoaderCircle className="h-5 w-5 animate-spin" />
              Working with live backend data...
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
