"use client";

import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { UserNav } from "@/components/user-nav";
import {
  Home,
  Lightbulb,
  LightbulbOff,
  Wifi,
  Globe2,
  ShieldCheck,
  KeyRound,
  Container,
  RefreshCw,
  ChevronRight,
  Tv,
  Image as ImageIcon,
  Shield,
  HardDrive,
  Server,
  Globe,
  Users,
  Cloud,
  Github,
  Loader2,
} from "lucide-react";

// ——— Room lights from HA ———

const ROOM_LIGHTS = [
  { entity_id: "light.stue", name: "Stue" },
  { entity_id: "light.kokken", name: "Køkken" },
  { entity_id: "light.spisestue", name: "Spisestue" },
  { entity_id: "light.sovevaerelse", name: "Soveværelse" },
  { entity_id: "light.entre", name: "Entré" },
  { entity_id: "light.bryggers", name: "Bryggers" },
  { entity_id: "light.thor", name: "Thor" },
  { entity_id: "light.freja", name: "Freja" },
  { entity_id: "light.walk_in", name: "Walk-in" },
  { entity_id: "light.krybekaelder", name: "Krybekælder" },
  { entity_id: "light.udendors", name: "Udendørs" },
  { entity_id: "light.trappe", name: "Trappe" },
];

// HA entity for Apple TV
const APPLE_TV_ENTITY = "media_player.stuen_tv";

// ——— External service cards ———

const externalCards = [
  {
    name: "Entra ID",
    description: "Microsoft identity & access",
    url: "https://portal.azure.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/~/Overview",
    icon: Users,
    iconBg: "bg-blue-600/20",
    iconColor: "text-blue-400",
  },
  {
    name: "Cloudflare",
    description: "DNS & CDN management",
    url: "https://dash.cloudflare.com",
    icon: Cloud,
    iconBg: "bg-orange-500/20",
    iconColor: "text-orange-400",
  },
  {
    name: "GitHub",
    description: "Source code & repositories",
    url: "https://github.com",
    icon: Github,
    iconBg: "bg-violet-500/20",
    iconColor: "text-violet-400",
  },
];

// ——— Admin panel items ———

const adminPanelItems = [
  {
    name: "Home Assistant",
    description: "Dashboard & automations",
    url: "https://ha.aser.dk",
    icon: Home,
    iconBg: "bg-sky-500/20",
    iconColor: "text-sky-400",
  },
  {
    name: "Pi-hole",
    description: "DNS and ad blocking",
    url: "https://pihole.aser.dk/admin",
    icon: Shield,
    iconBg: "bg-red-500/20",
    iconColor: "text-red-400",
    children: [
      { name: "Primary", url: "https://pihole.aser.dk/admin" },
      { name: "Secondary", url: "https://pihole2.aser.dk/admin" },
    ],
  },
  {
    name: "Nginx Proxy",
    description: "Reverse proxy & SSL manager",
    url: "https://nginx.aser.dk",
    icon: Globe,
    iconBg: "bg-emerald-500/20",
    iconColor: "text-emerald-400",
  },
  {
    name: "Proxmox VE",
    description: "Virtual machine environment",
    url: "https://pve.aser.dk",
    icon: Server,
    iconBg: "bg-purple-500/20",
    iconColor: "text-purple-400",
  },
  {
    name: "NAS",
    description: "Network attached storage",
    url: "https://nas01.aser.dk",
    icon: HardDrive,
    iconBg: "bg-blue-500/20",
    iconColor: "text-blue-400",
  },
  {
    name: "UniFi Network",
    description: "Network management monitoring",
    url: "https://unifi.ui.com/consoles/F4E2C6EDA3D60000000007D7CE7400000000083F74BA0000000065639621:621370638",
    icon: Wifi,
    iconBg: "bg-indigo-500/20",
    iconColor: "text-indigo-400",
  },
];

// ——— Types ———

interface HAState {
  entity_id: string;
  state: string;
  attributes?: {
    friendly_name?: string;
    media_content_type?: string;
    media_title?: string;
    app_name?: string;
    [key: string]: unknown;
  };
}

interface ImmichQueue {
  name: string;
  active: number;
  waiting: number;
  failed: number;
  isPaused: boolean;
  isActive: boolean;
  pending: number;
}

interface ImmichStats {
  photos: number;
  videos: number;
  users: { name: string; photos: number; videos: number }[];
}

interface ImmichStorage {
  diskSize: string;
  diskUse: string;
  diskAvailable: string;
  diskUsagePercentage: number;
}

// ——— Helper Components ———

function GlassCard({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl border border-white/[0.10] bg-white/[0.07] backdrop-blur-xl ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

function SectionLabel({
  icon: Icon,
  iconColor,
  children,
  actions,
}: {
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${iconColor}`} />
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/50">
          {children}
        </h3>
      </div>
      {actions}
    </div>
  );
}

// ——— Main Page ———

export default function DashboardPage() {
  const { data: session, update: updateSession } = useSession();
  const [haStates, setHaStates] = useState<HAState[]>([]);
  const [loading, setLoading] = useState(true);
  const [immichQueues, setImmichQueues] = useState<ImmichQueue[]>([]);
  const [immichStats, setImmichStats] = useState<ImmichStats | null>(null);
  const [immichStorage, setImmichStorage] = useState<ImmichStorage | null>(null);
  const [immichLoading, setImmichLoading] = useState(true);

  // Keep a stable ref so the effect never re-runs
  const updateRef = useRef(updateSession);
  updateRef.current = updateSession;

  // Force session refresh on bfcache restore or tab re-focus
  // This prevents the admin panel from disappearing after back-navigation
  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) updateRef.current();
    };
    const handleVisibility = () => {
      if (document.visibilityState === "visible") updateRef.current();
    };
    window.addEventListener("pageshow", handlePageShow);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("pageshow", handlePageShow);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  useEffect(() => {
    async function fetchStates() {
      try {
        const res = await fetch("/api/ha/states");
        if (res.ok) {
          setHaStates(await res.json());
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchStates();
    const iv = setInterval(fetchStates, 10_000);
    return () => clearInterval(iv);
  }, []);

  // Fetch Immich job queues
  useEffect(() => {
    async function fetchImmichJobs() {
      try {
        const res = await fetch("/api/immich/jobs");
        if (res.ok) {
          const data = await res.json();
          setImmichQueues(data.queues ?? []);
          if (data.stats) setImmichStats(data.stats);
          if (data.storage) setImmichStorage(data.storage);
        }
      } catch {
        // ignore
      } finally {
        setImmichLoading(false);
      }
    }
    fetchImmichJobs();
    const iv = setInterval(fetchImmichJobs, 10_000);
    return () => clearInterval(iv);
  }, []);

  // Lights
  const lightIds = ROOM_LIGHTS.map((r) => r.entity_id);
  const lights = haStates.filter((e) => lightIds.includes(e.entity_id));
  const onCount = lights.filter((l) => l.state === "on").length;

  // Apple TV
  const appleTv = haStates.find((e) => e.entity_id === APPLE_TV_ENTITY);
  const appleTvState = appleTv?.state ?? "unavailable";
  const appleTvApp = appleTv?.attributes?.app_name ?? "";
  const appleTvMedia = appleTv?.attributes?.media_title ?? "";

  const firstName = session?.user?.name?.split(" ")[0] ?? "";

  // Sticky admin flag — once true, stays true for the page lifecycle.
  // Prevents the admin panel from flickering away when useSession()
  // briefly returns null during a background session refresh.
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    const flag = (session?.user as { isAdmin?: boolean })?.isAdmin;
    if (flag) setIsAdmin(true);
  }, [session]);

  return (
    <div className="min-h-screen">

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* ——— Welcome Banner ——— */}
        <GlassCard className="mb-6 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-500/20 ring-1 ring-blue-400/30">
                <Home className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white sm:text-2xl">
                  Welcome{firstName ? `, ${firstName}` : ""}
                </h1>
                <p className="text-sm text-white/50">
                  Quick access to your home services
                </p>
              </div>
            </div>
            <UserNav />
          </div>
        </GlassCard>

        {/* ——— Two-column grid ——— */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
          {/* === LEFT COLUMN === */}
          <div className="space-y-6">
            {/* — OVERVIEW — */}
            <section>
              <SectionLabel icon={Home} iconColor="text-blue-400">
                Overview
              </SectionLabel>
              <div className="grid grid-cols-2 gap-4">
                {/* Lights card */}
                <GlassCard className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20">
                      <Lightbulb className="h-5 w-5 text-amber-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white">
                        Lights On
                      </p>
                      <p className="text-xs text-white/40">
                        {loading
                          ? "Loading..."
                          : `${onCount} of ${ROOM_LIGHTS.length}`}
                      </p>
                    </div>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/25 text-lg font-bold text-amber-300">
                      {loading ? "-" : onCount}
                    </div>
                  </div>
                </GlassCard>

                {/* Apple TV card */}
                <GlassCard className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-500/20">
                      <Tv className="h-5 w-5 text-slate-300" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white">
                        Apple TV
                      </p>
                      <p className="truncate text-xs text-white/40">
                        {loading
                          ? "Loading..."
                          : appleTvState === "playing"
                            ? appleTvMedia || appleTvApp || "Playing"
                            : appleTvState === "paused"
                              ? `Paused${appleTvMedia ? ` — ${appleTvMedia}` : ""}`
                              : appleTvState === "idle" || appleTvState === "standby"
                                ? appleTvApp || "Idle"
                                : appleTvState === "off"
                                  ? "Off"
                                  : "Unavailable"}
                      </p>
                    </div>
                    {appleTvState === "playing" && (
                      <span className="flex h-2.5 w-2.5 rounded-full bg-green-400 animate-pulse" />
                    )}
                  </div>
                </GlassCard>
              </div>
            </section>

            {/* — SMART HOME DEVICES — */}
            <section>
              <SectionLabel icon={Wifi} iconColor="text-sky-400">
                Smart Home Devices
              </SectionLabel>
              <div className="space-y-3">
                {/* Immich card */}
                <a
                  href="https://immich.aser.dk"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <GlassCard className="p-4 transition-colors hover:bg-white/[0.12]">
                    {/* Header */}
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/20">
                        <ImageIcon className="h-4 w-4 text-blue-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-medium text-white">Immich</span>
                        <p className="text-[11px] text-white/30">Photo & video library</p>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-white/30" />
                    </div>

                    {immichLoading ? (
                      <div className="mt-3 flex items-center gap-2 text-xs text-white/30">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Loading…
                      </div>
                    ) : (
                      <>
                        {/* Stats row */}
                        {immichStats && (
                          <div className="mt-3 grid grid-cols-3 gap-3">
                            <div className="rounded-lg bg-white/[0.05] px-3 py-2 text-center">
                              <p className="text-base font-bold tabular-nums text-white">
                                {immichStats.photos.toLocaleString()}
                              </p>
                              <p className="text-[10px] font-medium uppercase tracking-wider text-white/40">
                                Photos
                              </p>
                            </div>
                            <div className="rounded-lg bg-white/[0.05] px-3 py-2 text-center">
                              <p className="text-base font-bold tabular-nums text-white">
                                {immichStats.videos.toLocaleString()}
                              </p>
                              <p className="text-[10px] font-medium uppercase tracking-wider text-white/40">
                                Videos
                              </p>
                            </div>
                            <div className="rounded-lg bg-white/[0.05] px-3 py-2 text-center">
                              <p className="text-base font-bold tabular-nums text-white">
                                {(immichStats.photos + immichStats.videos).toLocaleString()}
                              </p>
                              <p className="text-[10px] font-medium uppercase tracking-wider text-white/40">
                                Total
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Storage bar */}
                        {immichStorage && (
                          <div className="mt-3">
                            <div className="mb-1 flex items-center justify-between text-[11px]">
                              <span className="text-white/50">
                                {immichStorage.diskUse} / {immichStorage.diskSize}
                              </span>
                              <span className="font-medium tabular-nums text-white/60">
                                {immichStorage.diskUsagePercentage.toFixed(1)}%
                              </span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  immichStorage.diskUsagePercentage > 85
                                    ? "bg-red-400/70"
                                    : immichStorage.diskUsagePercentage > 70
                                      ? "bg-amber-400/70"
                                      : "bg-blue-400/60"
                                }`}
                                style={{ width: `${Math.min(100, immichStorage.diskUsagePercentage)}%` }}
                              />
                            </div>
                            <p className="mt-1 text-[10px] text-white/30">
                              {immichStorage.diskAvailable} available
                            </p>
                          </div>
                        )}

                        {/* Job queues */}
                        {immichQueues.length > 0 && (
                          <div className="mt-3 border-t border-white/[0.06] pt-3 space-y-1.5">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/35 mb-1">Active Queues</p>
                            {immichQueues.map((q) => (
                              <div
                                key={q.name}
                                className="flex items-center gap-2 text-xs"
                              >
                                <span className="w-[6.5rem] shrink-0 truncate font-medium text-white/60">
                                  {q.name}
                                </span>
                                {q.pending > 0 ? (
                                  <>
                                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
                                      <div
                                        className="h-full rounded-full bg-blue-400/60 transition-all"
                                        style={{
                                          width: `${Math.min(
                                            100,
                                            (q.active / Math.max(q.pending, 1)) * 100
                                          )}%`,
                                        }}
                                      />
                                    </div>
                                    <span className="shrink-0 tabular-nums text-white/40">
                                      {q.pending.toLocaleString()}
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-white/25">idle</span>
                                )}
                                {q.failed > 0 && (
                                  <span className="shrink-0 text-red-400/70">
                                    {q.failed} err
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </GlassCard>
                </a>

                {/* Light entities row */}
                <GlassCard className="p-4">
                  <div className="flex items-center gap-3">
                    <Lightbulb className="h-4 w-4 text-amber-400" />
                    <span className="text-sm font-medium text-white">
                      Room Lights
                    </span>
                    <span className="flex-1 text-xs text-white/30">
                      {loading ? "Loading..." : `${onCount} of ${ROOM_LIGHTS.length} on`}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3">
                    {ROOM_LIGHTS.map((room) => {
                      const state = lights.find(
                        (l) => l.entity_id === room.entity_id
                      );
                      const isOn = state?.state === "on";
                      const isUnavailable =
                        !state || state.state === "unavailable";
                      return (
                        <div
                          key={room.entity_id}
                          className={`flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors ${
                            isOn
                              ? "bg-amber-400/10"
                              : isUnavailable && !loading
                                ? "opacity-30"
                                : ""
                          }`}
                        >
                          {isOn ? (
                            <Lightbulb className="h-3.5 w-3.5 shrink-0 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]" />
                          ) : (
                            <LightbulbOff className="h-3.5 w-3.5 shrink-0 text-white/20" />
                          )}
                          <span
                            className={`text-xs font-medium truncate ${
                              isOn ? "text-amber-200" : "text-white/40"
                            }`}
                          >
                            {room.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </GlassCard>

                {/* Apple TV row */}
                <GlassCard className="flex items-center gap-3 p-4">
                  <Tv className="h-4 w-4 text-slate-300" />
                  <span className="text-sm font-medium text-white">
                    Apple TV
                  </span>
                  <span className="flex-1 truncate text-xs text-white/30">
                    {loading
                      ? "Loading..."
                      : appleTvState === "playing"
                        ? `Playing: ${appleTvMedia || appleTvApp || "content"}`
                        : appleTvState === "paused"
                          ? `Paused${appleTvMedia ? `: ${appleTvMedia}` : ""}`
                          : appleTvState === "idle" || appleTvState === "standby"
                            ? appleTvApp || "Idle"
                            : appleTvState === "off"
                              ? "Off"
                              : "Unavailable"}
                  </span>
                  {appleTvState === "playing" && (
                    <span className="flex h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                  )}
                  <ChevronRight className="h-4 w-4 shrink-0 text-white/30" />
                </GlassCard>
              </div>
            </section>

            {/* — EXTERNAL SERVICES — */}
            <section>
              <SectionLabel icon={Globe2} iconColor="text-violet-400">
                External Services
              </SectionLabel>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {externalCards.map((svc) => {
                  const Icon = svc.icon;
                  return (
                    <a
                      key={svc.name}
                      href={svc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <GlassCard className="p-4 transition-colors hover:bg-white/[0.12]">
                        <div
                          className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${svc.iconBg}`}
                        >
                          <Icon className={`h-4.5 w-4.5 ${svc.iconColor}`} />
                        </div>
                        <p className="text-sm font-medium text-white">
                          {svc.name}
                        </p>
                        <p className="text-xs text-white/40">
                          {svc.description}
                        </p>
                      </GlassCard>
                    </a>
                  );
                })}
              </div>
            </section>

            {/* — QUICK THEME (HA preview) — */}
            <section>
              <SectionLabel
                icon={Home}
                iconColor="text-sky-400"
                actions={
                  <div className="flex items-center gap-3 text-xs">
                    <a
                      href="https://ha.aser.dk/config/automation/dashboard"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 transition-colors hover:text-blue-300"
                    >
                      View Automation
                    </a>
                    <span className="text-white/20">|</span>
                    <a
                      href="https://ha.aser.dk/config/logs"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 transition-colors hover:text-blue-300"
                    >
                      View All logs
                    </a>
                  </div>
                }
              >
                Quick Theme
              </SectionLabel>
              <GlassCard className="overflow-hidden">
                <div className="relative h-48 sm:h-56">
                  <img
                    src="/bg-smart-home.png"
                    alt="Smart home"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>
              </GlassCard>
            </section>
          </div>

          {/* === RIGHT COLUMN === */}
          <div className="space-y-6">
            {/* — QUICK ACTIONS — */}
            <section>
              <SectionLabel icon={ShieldCheck} iconColor="text-teal-400">
                Quick Actions
              </SectionLabel>
              <div className="space-y-3">
                {/* Root CA */}
                <Link href="/setup">
                  <GlassCard className="p-4 transition-colors hover:bg-white/[0.12]">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-500/20">
                        <ShieldCheck className="h-5 w-5 text-teal-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">
                          Root CA
                        </p>
                        <p className="text-xs text-white/40">
                          Setup network root certificate
                        </p>
                      </div>
                    </div>
                    <div className="ml-12 mt-2">
                      <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.08] px-2.5 py-0.5 text-[10px] font-medium text-white/60">
                        <ShieldCheck className="mr-1 h-3 w-3" />
                        Setup
                      </span>
                    </div>
                  </GlassCard>
                </Link>

                {/* iCloudPD Auth */}
                <GlassCard className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-500/20">
                      <KeyRound className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        iCloudPD Auth
                      </p>
                      <p className="text-xs text-white/40">
                        Trigger iCloud re-auth for expired cookies
                      </p>
                    </div>
                  </div>
                  <div className="ml-12 mt-2 flex gap-2">
                    <button
                      type="button"
                      disabled
                      className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.08] px-2.5 py-0.5 text-[10px] font-medium text-white/60 transition-colors hover:bg-white/[0.15] disabled:opacity-50"
                    >
                      <RefreshCw className="mr-1 h-3 w-3" />
                      Steffen
                    </button>
                    <button
                      type="button"
                      disabled
                      className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.08] px-2.5 py-0.5 text-[10px] font-medium text-white/60 transition-colors hover:bg-white/[0.15] disabled:opacity-50"
                    >
                      <RefreshCw className="mr-1 h-3 w-3" />
                      Violeta
                    </button>
                  </div>
                </GlassCard>

                {/* Containers */}
                <GlassCard className="p-4 transition-colors hover:bg-white/[0.12]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-500/20">
                      <Container className="h-5 w-5 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        Containers
                      </p>
                      <p className="text-xs text-white/40">
                        Manage Docker containers
                      </p>
                    </div>
                  </div>
                </GlassCard>
              </div>
            </section>

            {/* — ADMIN PANEL — */}
            {isAdmin && (
              <section>
                <SectionLabel icon={Shield} iconColor="text-red-400">
                  Admin Panel
                </SectionLabel>
                <GlassCard className="divide-y divide-white/[0.06]">
                  {adminPanelItems.map((item) => {
                    const Icon = item.icon;

                    /* Split button for items with children (e.g. Pi-hole) */
                    if (item.children) {
                      return (
                        <div
                          key={item.name}
                          className="grid grid-cols-2 divide-x divide-white/[0.06]"
                        >
                          {item.children.map((child) => (
                            <a
                              key={child.name}
                              href={child.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 p-3.5 transition-colors hover:bg-white/[0.06]"
                            >
                              <div
                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${item.iconBg}`}
                              >
                                <Icon className={`h-4 w-4 ${item.iconColor}`} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-white">
                                  {child.name}
                                </p>
                                <p className="truncate text-[11px] text-white/40">
                                  {child.url.replace(/^https?:\/\//, "").replace(/\/admin$/, "")}
                                </p>
                              </div>
                            </a>
                          ))}
                        </div>
                      );
                    }

                    return (
                      <a
                        key={item.name}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3.5 transition-colors hover:bg-white/[0.06]"
                      >
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${item.iconBg}`}
                        >
                          <Icon className={`h-4 w-4 ${item.iconColor}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-white">
                            {item.name}
                          </p>
                          <p className="truncate text-[11px] text-white/40">
                            {item.description}
                          </p>
                        </div>
                      </a>
                    );
                  })}
                </GlassCard>
              </section>
            )}
          </div>
        </div>

        {/* ——— Footer ——— */}
        <div className="mt-8 flex items-center gap-4 pb-6 text-xs text-white/30">
          <Home className="h-4 w-4" />
          <a
            href="https://ha.aser.dk/config/automation/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-white/50"
          >
            View Automation
          </a>
          <span>|</span>
          <a
            href="https://ha.aser.dk/config/logs"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-white/50"
          >
            View All Logs
          </a>
        </div>
      </div>
    </div>
  );
}
