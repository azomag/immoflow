import { Suspense } from "react";
import { AuthCard } from "@/components/auth/auth-card";

export default function SignupPage() {
  return (
    <Suspense>
      <AuthCard mode="signup" />
    </Suspense>
  );
}
