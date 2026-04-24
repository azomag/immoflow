import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/auth";

const rolePathMap = {
  super_admin: "/dashboard/super-admin",
  admin: "/dashboard/admin",
  agent: "/dashboard/agent",
  locataire: "/dashboard/locataire",
} as const;

export default async function DashboardIndexPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.role) {
    redirect("/login");
  }

  redirect(rolePathMap[session.user.role]);
}
