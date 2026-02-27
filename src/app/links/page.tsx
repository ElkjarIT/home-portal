"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { TopNav } from "@/components/top-nav";
import {
  Shield,
  ExternalLink,
  ChevronRight,
  Globe2,
  ShieldCheck,
  KeyRound,
  RefreshCw,
  Container,
} from "lucide-react";
import Link from "next/link";
import { generalLinks } from "@/data/links";

function GlassCard({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl border border-white/[0.10] bg-white/[0.07] shadow-lg shadow-black/10 backdrop-blur-xl ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export default function LinksPage() {
  const { data: session } = useSession();

  // Sticky admin flag
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    const flag = (session?.user as { isAdmin?: boolean })?.isAdmin;
    if (flag) setIsAdmin(true);
  }, [session]);

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <TopNav />

        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Home Services</h1>
          <p className="mt-1 text-sm text-white/55">
            Quick access to all services and tools
          </p>
        </div>

        {/* ——— General / External Services ——— */}
        <section className="mb-8">
          <div className="mb-4 flex items-center gap-2">
            <Globe2 className="h-4 w-4 text-violet-400" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white/70">
              Services
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {generalLinks.map((link) => {
              const Icon = link.icon;
              return (
                <a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <GlassCard className="group p-4 transition-all hover:bg-white/[0.12] hover:border-white/[0.15]">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${link.iconBg}`}>
                        <Icon className={`h-5 w-5 ${link.iconColor}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-white">{link.name}</p>
                        <p className="truncate text-xs text-white/55">{link.description}</p>
                      </div>
                      <ExternalLink className="h-4 w-4 shrink-0 text-white/35 transition-colors group-hover:text-white/60" />
                    </div>
                  </GlassCard>
                </a>
              );
            })}
          </div>
        </section>

        {/* ——— Quick Actions ——— */}
        <section className="mb-8">
          <div className="mb-4 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-teal-400" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white/70">
              Quick Actions
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {/* Root CA */}
            <Link href="/setup">
              <GlassCard className="group p-4 transition-all hover:bg-white/[0.12] hover:border-white/[0.15]">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-500/20">
                    <ShieldCheck className="h-5 w-5 text-teal-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white">Root CA</p>
                    <p className="text-xs text-white/55">Setup network root certificate</p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-white/35 transition-colors group-hover:text-white/60" />
                </div>
              </GlassCard>
            </Link>

            {/* iCloudPD Auth */}
            <GlassCard className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/20">
                  <KeyRound className="h-5 w-5 text-purple-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white">iCloudPD Auth</p>
                  <p className="text-xs text-white/55">Re-auth for expired cookies</p>
                </div>
              </div>
              <div className="ml-[52px] mt-2 flex gap-2">
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.08] px-2.5 py-0.5 text-xs font-medium text-white/70 disabled:opacity-50"
                >
                  <RefreshCw className="mr-1 h-3 w-3" />
                  Steffen
                </button>
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.08] px-2.5 py-0.5 text-xs font-medium text-white/70 disabled:opacity-50"
                >
                  <RefreshCw className="mr-1 h-3 w-3" />
                  Violeta
                </button>
              </div>
            </GlassCard>

            {/* Containers */}
            <GlassCard className="group p-4 transition-all hover:bg-white/[0.12] hover:border-white/[0.15]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/20">
                  <Container className="h-5 w-5 text-cyan-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white">Containers</p>
                  <p className="text-xs text-white/55">Manage Docker containers</p>
                </div>
              </div>
            </GlassCard>
          </div>
        </section>

        {/* Admin link */}
        {isAdmin && (
          <section className="mb-8">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-300 transition-all hover:bg-red-500/20 hover:border-red-500/40"
            >
              <Shield className="h-4 w-4" />
              Open Admin Panel
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </section>
        )}
      </div>
    </div>
  );
}
