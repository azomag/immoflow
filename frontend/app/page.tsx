import Link from "next/link";
import {
  ArrowRight,
  Building2,
  FileCheck2,
  Shield,
  Users,
  TrendingUp,
  Star,
  CheckCircle2,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const features = [
  {
    title: "Super admin oversight",
    description:
      "Approve or suspend admin accounts from a dedicated control surface with full audit history.",
    icon: Shield,
    iconClass: "icon-indigo",
    tag: "Control",
  },
  {
    title: "Agent operations",
    description:
      "Create properties, contracts, and collect payments. Manage your full portfolio in one workspace.",
    icon: Building2,
    iconClass: "icon-amber",
    tag: "Productivity",
  },
  {
    title: "Locataire experience",
    description:
      "Search logements, review contracts, sign them digitally, and track every payment from a clean portal.",
    icon: FileCheck2,
    iconClass: "icon-emerald",
    tag: "Transparency",
  },
];

const stats = [
  { label: "Role levels", value: "4", icon: Users },
  { label: "Avg. setup time", value: "< 5 min", icon: Zap },
  { label: "Customer satisfaction", value: "98%", icon: Star },
  { label: "Data accuracy", value: "100%", icon: TrendingUp },
];

const trustPoints = [
  "Role-based access control",
  "Google OAuth + credentials",
  "Real-time contract signing",
  "Automated payment tracking",
  "PDF generation built-in",
  "Admin approval workflows",
];

export default function Home() {
  return (
    <div className="gradient-hero min-h-screen">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 glass border-b border-white/40">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl icon-indigo shadow-[0_4px_12px_rgba(1,79,134,0.35)]">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[17px] font-bold tracking-tight text-[var(--foreground)]">
                ImmoFlow
              </div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                Real Estate SaaS
              </div>
            </div>
          </div>
          <nav className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="rounded-xl font-semibold">
                Login
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="rounded-xl bg-[var(--primary)] font-semibold shadow-[var(--shadow-primary)] hover:bg-[var(--primary-hover)]">
                Get started
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 pb-20 md:px-10">
        {/* ── Hero Section ── */}
        <section className="pt-20 pb-16 text-center animate-fade-in-up">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[rgba(1,73,124,0.2)] bg-[rgba(1,73,124,0.06)] px-4 py-1.5 text-sm font-semibold text-[var(--primary)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
            Shadcn-styled frontend · Laravel API
          </div>

          <h1 className="mx-auto max-w-4xl text-5xl font-bold leading-[1.1] tracking-tight text-[var(--foreground)] md:text-7xl">
            One platform for{" "}
            <span className="gradient-text">admins, agents</span>
            {" "}and locataires.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[var(--muted-foreground)] md:text-xl">
            ImmoFlow connects Google or credential auth, role-specific
            dashboards, approval flows, and property data loaded directly from
            your backend.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href="/signup">
              <Button
                size="lg"
                className="h-14 rounded-2xl bg-[var(--primary)] px-8 text-base font-semibold shadow-[var(--shadow-primary)] hover:bg-[var(--primary-hover)] transition-all hover:-translate-y-0.5"
              >
                Create an account
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button
                size="lg"
                variant="outline"
                className="h-14 rounded-2xl px-8 text-base font-semibold border-[var(--border-strong)] hover:bg-white hover:-translate-y-0.5 transition-all"
              >
                Open dashboard
              </Button>
            </Link>
          </div>
        </section>

        {/* ── Stats Row ── */}
        <section className="mb-16 animate-fade-in-up stagger" style={{ animationDelay: "0.1s" }}>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/60 bg-white/70 px-6 py-5 text-center shadow-[var(--shadow-sm)] backdrop-blur-sm card-lift"
              >
                <div className="text-3xl font-bold tracking-tight text-[var(--foreground)]">
                  {stat.value}
                </div>
                <div className="mt-1 text-sm text-[var(--muted-foreground)]">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Feature Cards ── */}
        <section className="mb-16">
          <div className="mb-10 text-center animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
            <h2 className="text-3xl font-bold tracking-tight text-[var(--foreground)] md:text-4xl">
              Every role, perfectly served
            </h2>
            <p className="mt-3 text-[var(--muted-foreground)]">
              Each workspace is purpose-built for how that person actually works.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3 stagger">
            {features.map((item) => (
              <div
                key={item.title}
                className="group rounded-3xl border border-white/60 bg-white/70 p-8 shadow-[var(--shadow)] backdrop-blur-sm card-lift animate-fade-in-up"
              >
                <div className="mb-5 flex items-center justify-between">
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl ${item.iconClass} shadow-[0_4px_14px_rgba(0,0,0,0.18)] transition-transform group-hover:scale-110`}
                  >
                    <item.icon className="h-7 w-7" />
                  </div>
                  <span className="badge-indigo rounded-full px-3 py-1 text-xs font-semibold">
                    {item.tag}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-[var(--foreground)]">
                  {item.title}
                </h3>
                <p className="mt-3 text-[15px] leading-7 text-[var(--muted-foreground)]">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Security / Trust Section ── */}
        <section className="animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          <div className="overflow-hidden rounded-3xl bg-[var(--sidebar-bg)] p-1 shadow-[var(--shadow-xl)]">
            <div className="grid gap-0 lg:grid-cols-[1fr_1.1fr]">
              {/* Left dark panel */}
              <div className="p-10">
                <Badge className="mb-6 rounded-full bg-white/10 text-white border-white/15 text-xs font-semibold">
                  Security model
                </Badge>
                <h2 className="text-4xl font-bold text-white leading-tight">
                  Granular permissions.{" "}
                  <span className="text-white/45">Always correct.</span>
                </h2>
                <p className="mt-4 text-[15px] leading-7 text-white/55">
                  <code className="text-[var(--secondary)] font-mono">super_admin</code> controls admins.{" "}
                  <code className="text-[var(--secondary)] font-mono">admin</code> manages agents and locataires.{" "}
                  <code className="text-[var(--secondary)] font-mono">agent</code> operates properties and contracts.{" "}
                  <code className="text-[var(--secondary)] font-mono">locataire</code> signs and tracks.
                </p>

                <div className="mt-8 grid grid-cols-2 gap-3">
                  {trustPoints.map((point) => (
                    <div key={point} className="flex items-center gap-2 text-sm text-white/65">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--success)]" />
                      {point}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right light panel */}
              <div className="rounded-[22px] bg-[var(--background)] p-10">
                <div className="mb-6 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                  How it works
                </div>
                <div className="space-y-4">
                  {[
                    {
                      step: "01",
                      title: "Authenticate",
                      desc: "Google OAuth or email/password — same login for all roles.",
                    },
                    {
                      step: "02",
                      title: "Admin approves agents",
                      desc: "New agent accounts are held until an admin approves them.",
                    },
                    {
                      step: "03",
                      title: "Role-specific workspace",
                      desc: "Each user lands in a tailored dashboard with only the tools they need.",
                    },
                    {
                      step: "04",
                      title: "Real data, live sync",
                      desc: "All actions hit the Laravel API — no mock data, no stale state.",
                    },
                  ].map((item) => (
                    <div
                      key={item.step}
                      className="flex gap-4 rounded-2xl border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-sm)]"
                    >
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[rgba(1,73,124,0.08)] text-xs font-bold text-[var(--primary)]">
                        {item.step}
                      </div>
                      <div>
                        <div className="font-semibold text-[var(--foreground)]">{item.title}</div>
                        <div className="mt-1 text-sm leading-6 text-[var(--muted-foreground)]">{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-[var(--border)] py-8 text-center text-sm text-[var(--muted-foreground)]">
        © 2024 ImmoFlow · Real Estate SaaS Platform
      </footer>
    </div>
  );
}
