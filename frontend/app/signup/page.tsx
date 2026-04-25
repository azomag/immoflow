import { Suspense } from "react";
import { AuthCard } from "@/components/auth/auth-card";

export default function SignupPage() {
  return (
    <main className="page-grid flex min-h-screen items-center justify-center px-6 py-10">
      <Suspense>
        <AuthCard mode="signup" />
      </Suspense>
    </main>
  );
}
