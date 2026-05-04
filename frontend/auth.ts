import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { backendRequest, type AuthResponse } from "@/lib/api";

const isGoogleAuthEnabled = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
);

const AUTH_RETRY_DELAYS_MS = [1200, 2200, 3600];

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableAuthError(error: unknown): boolean {
  if (error && typeof error === "object" && "status" in error) {
    const status = (error as { status?: unknown }).status;
    if (typeof status === "number") {
      return status >= 500 || status === 429;
    }
  }
  return true;
}

async function loginWithRetry(identifier: string, password: string): Promise<AuthResponse> {
  let lastError: unknown = null;
  const maxAttempts = AUTH_RETRY_DELAYS_MS.length + 1;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      return await backendRequest<AuthResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          identifier,
          password,
        }),
      });
    } catch (error) {
      lastError = error;
      const hasMoreAttempts = attempt < maxAttempts - 1;
      if (!hasMoreAttempts || !isRetryableAuthError(error)) {
        throw error;
      }
      await wait(AUTH_RETRY_DELAYS_MS[attempt] ?? 1000);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Authentication failed.");
}

export const authOptions: NextAuthOptions = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret:
    process.env.NEXTAUTH_SECRET ??
    (process.env.NODE_ENV === "development" ? "immoflow-dev-secret" : undefined),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        identifier: { label: "Email or username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials.password) {
          throw new Error("Email or username and password are required.");
        }

        const response = await loginWithRetry(credentials.identifier, credentials.password);

        return {
          id: String(response.user.id),
          name: response.user.name,
          email: response.user.email,
          image: response.user.avatar_url ?? undefined,
          backendToken: response.token,
          backendUser: response.user,
          provider: "credentials",
        };
      },
    }),
    ...(isGoogleAuthEnabled
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID ?? "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user, account, trigger, session }) {
      if (user) {
        token.provider = account?.provider ?? "credentials";
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
      }

      if (account?.provider === "credentials" && user) {
        token.backendToken = user.backendToken;
        token.backendUser = user.backendUser;
        token.role = user.backendUser?.role ?? null;
        token.status = user.backendUser?.status ?? null;
        token.permissions = user.backendUser?.permissions ?? [];
      }

      if (account?.provider === "google") {
        token.provider = "google";
      }

      if (trigger === "update" && session?.backendSync) {
        token.backendToken = session.backendSync.token;
        token.backendUser = session.backendSync.user;
        token.role = session.backendSync.user.role;
        token.status = session.backendSync.user.status;
        token.permissions = session.backendSync.user.permissions;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = typeof token.sub === "string" ? token.sub : "";
        session.user.provider = typeof token.provider === "string" ? token.provider : "credentials";
        session.user.backendToken =
          typeof token.backendToken === "string" ? token.backendToken : null;
        session.user.backendUser = token.backendUser ?? null;
        session.user.role = typeof token.role === "string" ? token.role : null;
        session.user.status = typeof token.status === "string" ? token.status : null;
        session.user.permissions = Array.isArray(token.permissions)
          ? (token.permissions as string[])
          : [];
      }

      return session;
    },
  },
};
