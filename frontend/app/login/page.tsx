import { AuthCard } from "@/components/auth/auth-card";

export default function LoginPage() {
  return (
    <main className="page-grid flex min-h-screen items-center justify-center px-6 py-10">
      <AuthCard mode="login" />
    </main>
  );
}
