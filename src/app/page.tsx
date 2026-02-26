"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { UserNav } from "@/components/user-nav";
import {
  Home,
  Lightbulb,
  Wifi,
  Globe2,
  ShieldCheck,
  KeyRound,
  Container,
  RefreshCw,
  ChevronRight,
  Film,
  Image as ImageIcon,
  Shield,
  HardDrive,
  Server,
  Globe,
  Users,
  Cloud,
  Github,
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

// ——— Sidebar data ———

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

interface LightState {
  entity_id: string;
  state: string;
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
  const { data: session } = useSession();
  const [lights, setLights] = useState<LightState[]>([]);
  const [lightsLoading, setLightsLoading] = useState(true);

  useEffect(() => {
    async function fetchLights() {
      try {
        const res = await fetch("/api/ha/states");
        if (res.ok) {
          const all: LightState[] = await res.json();
          const ids = ROOM_LIGHTS.map((r) => r.entity_id);
          setLights(all.filter((e) => ids.includes(e.entity_id)));
        }
      } catch {
        /* ignore */
      } finally {
        setLightsLoading(false);
      }
    }
    fetchLights();
    const iv = setInterval(fetchLights, 15_000);
    return () => clearInterval(iv);
  }, []);

  const onCount = lights.filter((l) => l.state === "on").length;
  const firstName = session?.user?.name?.split(" ")[0] ?? "";
  const isAdmin = (session?.user as { isAdmin?: boolean })?.isAdmin;

  return (
    <div className="relative min-h-screen">
      {/* ——— Fixed background ——— */}
      <div className="fixed inset-0 z-0">
        <img
          src="/bg-smart-home.png"
          alt=""
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/50 to-black/80" />
      </div>

      {/* ——— Scrollable content ——— */}
      <div className="relative z-10 min-h-screen">
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
                          {lightsLoading
                            ? "Loading..."
                            : `${onCount} of ${ROOM_LIGHTS.length}`}
                        </p>
                      </div>
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/25 text-lg font-bold text-amber-300">
                        {lightsLoading ? "-" : onCount}
                      </div>
                    </div>
                  </GlassCard>

                  {/* Plex card */}
                  <Link
                    href="https://plex.aser.dk"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <GlassCard className="h-full p-4 transition-colors hover:bg-white/[0.12]">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-600/20">
                          <Film className="h-5 w-5 text-amber-400" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">
                            PLEX
                          </p>
                          <p className="text-xs text-white/40">Video server</p>
                        </div>
                      </div>
                    </GlassCard>
                  </Link>
                </div>
              </section>

              {/* — SMART HOME DEVICES — */}
              <section>
                <SectionLabel icon={Wifi} iconColor="text-sky-400">
                  Smart Home Devices
                </SectionLabel>
                <div className="space-y-3">
                  {/* Immich + light entities row */}
                  <GlassCard className="p-4">
                    <div className="mb-3 flex items-center gap-3">
                      <ImageIcon className="h-4 w-4 text-blue-400" />
                      <span className="text-sm font-medium text-white">
                        Immich
                      </span>
                      <span className="text-xs text-white/30">
                        Photo & video library
                      </span>
                    </div>
                    <div className="scrollbar-hide flex items-center gap-2 overflow-x-auto pb-1">
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
                            className={`flex shrink-0 flex-col items-center gap-1 ${
                              isUnavailable && !lightsLoading
                                ? "opacity-30"
                                : ""
                            }`}
                            title={room.name}
                          >
                            <Lightbulb
                              className={`h-5 w-5 transition-colors ${
                                isOn
                                  ? "text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]"
                                  : "text-white/20"
                              }`}
                            />
                          </div>
                        );
                      })}
                      <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-white/30" />
                    </div>
                  </GlassCard>

                  {/* Plex row */}
                  <Link
                    href="https://plex.aser.dk"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <GlassCard className="flex items-center gap-3 p-4 transition-colors hover:bg-white/[0.12]">
                      <Film className="h-4 w-4 text-amber-400" />
                      <span className="text-sm font-medium text-white">
                        PLEX
                      </span>
                      <span className="flex-1 truncate text-xs text-white/30">
                        Stream media to network devices
                      </span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-white/30" />
                    </GlassCard>
                  </Link>
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
                      <Link
                        key={svc.name}
                        href={svc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <GlassCard className="p-4 transition-colors hover:bg-white/[0.12]">
                          <div
                            className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${svc.iconBg}`}
                          >
                            <Icon
                              className={`h-4.5 w-4.5 ${svc.iconColor}`}
                            />
                          </div>
                          <p className="text-sm font-medium text-white">
                            {svc.name}
                          </p>
                          <p className="text-xs text-white/40">
                            {svc.description}
                          </p>
                        </GlassCard>
                      </Link>
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
                      <Link
                        href="https://ha.aser.dk/config/automation/dashboard"
                        target="_blank"
                        className="text-blue-400 transition-colors hover:text-blue-300"
                      >
                        View Automation
                      </Link>
                      <span className="text-white/20">|</span>
                      <Link
                        href="https://ha.aser.dk/config/logs"
                        target="_blank"
                        className="text-blue-400 transition-colors hover:text-blue-300"
                      >
                        View All logs
                      </Link>
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
                  <GlassCard className="divide-y divide-white/[0.06] overflow-hidden">
                    {adminPanelItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
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
                        </Link>
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
            <Link
              href="https://ha.aser.dk/config/automation/dashboard"
              target="_blank"
              className="transition-colors hover:text-white/50"
            >
              View Automation
            </Link>
            <span>|</span>
            <Link
              href="https://ha.aser.dk/config/logs"
              target="_blank"
              className="transition-colors hover:text-white/50"
            >
              View All Logs
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
