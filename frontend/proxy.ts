import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";

const rolePathMap: Record<string, string> = {
  super_admin: "/dashboard/super-admin",
  admin: "/dashboard/admin",
  agent: "/dashboard/agent",
  locataire: "/dashboard/locataire",
};

export default withAuth(
  function proxy(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    if (!token) {
      return;
    }

    const role = typeof token.role === "string" ? token.role : null;
    const status = typeof token.status === "string" ? token.status : null;

    if (pathname.startsWith("/dashboard")) {
      if (status && status !== "active") {
        return NextResponse.redirect(new URL("/pending", req.url));
      }

      if (pathname === "/dashboard" && role && rolePathMap[role]) {
        return NextResponse.redirect(new URL(rolePathMap[role], req.url));
      }

      if (role === "super_admin" && pathname.startsWith("/dashboard/admin")) {
        return;
      }

      if (
        role &&
        rolePathMap[role] &&
        pathname !== "/dashboard" &&
        !pathname.startsWith(rolePathMap[role])
      ) {
        return NextResponse.redirect(new URL(rolePathMap[role], req.url));
      }
    }
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        if (!req.nextUrl.pathname.startsWith("/dashboard")) {
          return true;
        }

        return !!token;
      },
    },
  },
);

export const config = {
  matcher: ["/dashboard/:path*"],
};
