import { DefaultSession } from "next-auth";
import { AuthenticatedUser } from "@/lib/api";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      provider: string;
      backendToken: string | null;
      backendUser: AuthenticatedUser | null;
      role: AuthenticatedUser["role"] | null;
      status: AuthenticatedUser["status"] | null;
      permissions: string[];
    };
    backendSync?: {
      token: string | null;
      user: AuthenticatedUser;
    };
  }

  interface User {
    backendToken?: string | null;
    backendUser?: AuthenticatedUser;
    provider?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    provider?: string;
    backendToken?: string | null;
    backendUser?: AuthenticatedUser | null;
    role?: AuthenticatedUser["role"] | null;
    status?: AuthenticatedUser["status"] | null;
    permissions?: string[];
  }
}
