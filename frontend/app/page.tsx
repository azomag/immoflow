import Link from "next/link";
import { ArrowRight, Building2, FileCheck2, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const highlights = [
  {
    title: "Super admin oversight",
    description: "Approve or suspend admin accounts from a dedicated control surface.",
    icon: Shield,
  },
  {
    title: "Agent operations",
    description: "Create properties, contracts, and payments without placeholder data.",
    icon: Building2,
  },
  {
    title: "Locataire experience",
    description: "Search logements, review contracts, and sign them from a clean portal.",
    icon: FileCheck2,
  },
];

export default function Home() {
  return (
    <main className="page-grid min-h-screen px-6 py-10 md:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-10">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--primary)] text-[var(--primary-foreground)]">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
                ImmoFlow
              </div>
              <div className="text-sm text-[var(--muted-foreground)]">
                Real estate workflows with role-based control
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/signup">
              <Button>Start now</Button>
            </Link>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
          <Card className="overflow-hidden">
            <CardContent className="space-y-8 p-8 md:p-12">
              <Badge variant="warning">Shadcn-styled frontend + Laravel API</Badge>
              <div className="space-y-5">
                <h1 className="max-w-4xl text-4xl font-semibold tracking-tight md:text-6xl">
                  One platform for admins, agents, and locataires.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-[var(--muted-foreground)] md:text-lg">
                  ImmoFlow connects Google or credential auth, role-specific dashboards,
                  approval flows, and property data loaded directly from your backend.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/signup">
                  <Button size="lg">
                    Create an account
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline">
                    Open dashboard access
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[var(--primary)] text-[var(--primary-foreground)]">
            <CardContent className="flex h-full flex-col justify-between p-8">
              <div className="space-y-4">
                <Badge variant="neutral" className="bg-white/10 text-white">
                  Security model
                </Badge>
                <h2 className="text-3xl font-semibold">Granular permissions.</h2>
                <p className="text-sm leading-6 text-white/70">
                  `super_admin` controls admins. `admin` manages agents and locataires. `agent`
                  operates properties, contracts, and payments. `locataire` signs and tracks.
                </p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 text-sm text-white/75">
                Google sign-in syncs the authenticated profile into the Laravel user table, then the frontend loads the exact role and permissions assigned there.
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-5 md:grid-cols-3">
          {highlights.map((item) => (
            <Card key={item.title}>
              <CardContent className="space-y-4 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent)] text-[var(--accent-foreground)]">
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                    {item.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      </div>
    </main>
  );
}
