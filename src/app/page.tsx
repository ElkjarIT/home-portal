"use client";

import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { TopNav } from "@/components/top-nav";
import {
  Home,
  Lightbulb,
  LightbulbOff,
  Wifi,
  ChevronRight,
  Tv,
  Image as ImageIcon,
  Loader2,
  Printer,
  Activity,
  Circle,
  Clock,
  Zap,
  Car,
  Flame,
  BarChart3,
  Plug,
  BatteryCharging,
  Thermometer,
  HardDrive,
  Film,
  Camera,
  ListTodo,
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
  { entity_id: "light.udendors", name: "Udendørs" },
  { entity_id: "light.trappe", name: "Trappe" },
  // Shelly dimmers
  { entity_id: "light.trappe_ceiling", name: "Trappe Loftlys" },
  { entity_id: "light.entre_ceiling", name: "Entré Loftlys" },
  { entity_id: "light.koekken_window", name: "Køkken Vindue" },
];

// ——— Roth Touchline floor heating zones ———

const CLIMATE_ROOMS = [
  { entity_id: "climate.spisestue_k_lkken", name: "Spisestue / Køkken" },
  { entity_id: "climate.stue", name: "Stue" },
  { entity_id: "climate.gang", name: "Gang" },
  { entity_id: "climate.freja", name: "Freja" },
  { entity_id: "climate.thor", name: "Thor" },
];

// HA entity for Apple TV
const APPLE_TV_ENTITY = "media_player.stuen_tv";

// Canon printer toner sensors
const TONER_SENSORS = [
  { entity_id: "sensor.cnmf633c_635c_canon_cartridge_045_black_toner", name: "Black", color: "#333" },
  { entity_id: "sensor.cnmf633c_635c_canon_cartridge_045_cyan_toner", name: "Cyan", color: "#06b6d4" },
  { entity_id: "sensor.cnmf633c_635c_canon_cartridge_045_magenta_to", name: "Magenta", color: "#d946ef" },
  { entity_id: "sensor.cnmf633c_635c_canon_cartridge_045_yellow_ton", name: "Yellow", color: "#eab308" },
];

// Infrastructure devices to monitor
const INFRA_DEVICES = [
  { entity_id: "device_tracker.ha", name: "Home Assistant", uptimeEntity: null },
  { entity_id: "device_tracker.pve_1", name: "Proxmox VE", uptimeEntity: null },
  { entity_id: "device_tracker.valhalla", name: "Valhalla (Docker)", uptimeEntity: "sensor.valhalla_uptime" },
  { entity_id: "device_tracker.nas01", name: "NAS01", uptimeEntity: null },
  { entity_id: "device_tracker.immich01", name: "Immich Server", uptimeEntity: null },
  { entity_id: "device_tracker.pihole_secondary", name: "Pi-hole Secondary", uptimeEntity: null },
  { entity_id: "device_tracker.stuen", name: "Stuen AP (U7-Pro)", uptimeEntity: "sensor.stuen_uptime" },
  { entity_id: "device_tracker.freja", name: "Kontor AP (AC-LR)", uptimeEntity: "sensor.freja_uptime" },
  { entity_id: "device_tracker.garagen", name: "Garagen AP (AC-LR)", uptimeEntity: "sensor.garagen_uptime" },
  { entity_id: "device_tracker.usw2", name: "USW1 (Switch)", uptimeEntity: "sensor.usw2_uptime" },
  { entity_id: "device_tracker.cannon", name: "Canon Printer", uptimeEntity: null },
];

// ——— Energy monitor devices ———

const ENERGY_APPLIANCES = [
  { entity_id: "sensor.stue_pm_power", name: "Stue" },
  { entity_id: "sensor.krybekaelder_pm_network_rack_power", name: "Network Rack" },
  { entity_id: "sensor.fyrrum_pm_tumbler_power", name: "Tørretumbler" },
  { entity_id: "sensor.bryggers_pm_washing_machine_power", name: "Vaskemaskine" },
  { entity_id: "sensor.koekken_pm_dishwasher_power", name: "Opvaskemaskine" },
  { entity_id: "sensor.krybekaelder_pm_circulation_pump_power", name: "Cirk. Pumpe" },
];



// ——— Types ———

interface HAState {
  entity_id: string;
  state: string;
  last_changed?: string;
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

interface EnergyDay {
  date: string;
  kwh: number;
}

interface DeviceEnergy {
  name: string;
  kwh: number;
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
        <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-white/60">
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
  const [energyDays, setEnergyDays] = useState<EnergyDay[]>([]);
  const [energyTodayKwh, setEnergyTodayKwh] = useState(0);
  const [deviceToday, setDeviceToday] = useState<DeviceEnergy[]>([]);
  const [energyLoading, setEnergyLoading] = useState(true);

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

  // Fetch energy history (daily kWh)
  useEffect(() => {
    async function fetchEnergy() {
      try {
        const res = await fetch("/api/ha/energy");
        if (res.ok) {
          const data = await res.json();
          setEnergyDays(data.dailyKwh ?? []);
          setEnergyTodayKwh(data.todayKwh ?? 0);
          setDeviceToday(data.deviceToday ?? []);
        }
      } catch {
        // ignore
      } finally {
        setEnergyLoading(false);
      }
    }
    fetchEnergy();
    const iv = setInterval(fetchEnergy, 60_000); // refresh every 60s (history is heavy)
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

  return (
    <div className="min-h-screen">

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <TopNav />

        {/* ——— Welcome Banner ——— */}
        <GlassCard className="mb-6 p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-500/20 ring-1 ring-blue-400/30">
              <Home className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white sm:text-2xl">
                Welcome{firstName ? `, ${firstName}` : ""}
              </h1>
              <p className="text-sm text-white/60">
                Quick access to your home services
              </p>
            </div>
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
                      <p className="text-xs text-white/55">
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
                      <p className="truncate text-xs text-white/55">
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
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/20">
                        <ImageIcon className="h-4 w-4 text-blue-400" />
                      </div>
                      <span className="text-sm font-medium text-white">Immich</span>
                      <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-white/45" />
                    </div>

                    {immichLoading ? (
                      <div className="flex items-center gap-2 text-xs text-white/45">
                        <Loader2 className="h-3 w-3 animate-spin" /> Loading…
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-3">
                        {/* Section 1: Library counts */}
                        <div className="rounded-lg bg-white/[0.04] p-2.5">
                          <p className="mb-1.5 flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-white/45">
                            <Camera className="h-3 w-3" /> Library
                          </p>
                          {immichStats ? (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-white/55">Photos</span>
                                <span className="text-xs font-semibold tabular-nums text-white/80">{immichStats.photos.toLocaleString()}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-white/55">Videos</span>
                                <span className="text-xs font-semibold tabular-nums text-white/80">{immichStats.videos.toLocaleString()}</span>
                              </div>
                              <div className="flex items-center justify-between border-t border-white/[0.06] pt-1">
                                <span className="text-xs text-white/55">Total</span>
                                <span className="text-xs font-bold tabular-nums text-blue-300">{(immichStats.photos + immichStats.videos).toLocaleString()}</span>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-white/40">—</p>
                          )}
                        </div>

                        {/* Section 2: Storage */}
                        <div className="rounded-lg bg-white/[0.04] p-2.5">
                          <p className="mb-1.5 flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-white/45">
                            <HardDrive className="h-3 w-3" /> Storage
                          </p>
                          {immichStorage ? (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-white/55">Used</span>
                                <span className="text-xs font-semibold tabular-nums text-white/80">{immichStorage.diskUse}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-white/55">Free</span>
                                <span className="text-xs font-semibold tabular-nums text-white/80">{immichStorage.diskAvailable}</span>
                              </div>
                              <div className="flex items-center justify-between border-t border-white/[0.06] pt-1">
                                <span className="text-xs text-white/55">Total</span>
                                <span className="text-xs font-bold tabular-nums text-blue-300">{immichStorage.diskSize}</span>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-white/40">—</p>
                          )}
                        </div>

                        {/* Section 3: Top 3 job queues */}
                        <div className="rounded-lg bg-white/[0.04] p-2.5">
                          <p className="mb-1.5 flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-white/45">
                            <ListTodo className="h-3 w-3" /> Jobs
                          </p>
                          {immichQueues.length > 0 ? (
                            <div className="space-y-1">
                              {[...immichQueues]
                                .sort((a, b) => (b.active + b.waiting) - (a.active + a.waiting))
                                .slice(0, 3)
                                .map((q) => {
                                  const total = q.active + q.waiting;
                                  return (
                                    <div key={q.name} className="flex items-center justify-between">
                                      <span className="text-xs text-white/55 truncate mr-1">{q.name}</span>
                                      <span className={`text-xs font-semibold tabular-nums ${
                                        total > 0 ? "text-yellow-300" : "text-white/40"
                                      }`}>{total}</span>
                                    </div>
                                  );
                                })}
                            </div>
                          ) : (
                            <p className="text-xs text-white/40">No jobs</p>
                          )}
                        </div>
                      </div>
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
                    <span className="flex-1 text-xs text-white/45">
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
                            <LightbulbOff className="h-3.5 w-3.5 shrink-0 text-white/35" />
                          )}
                          <span
                            className={`text-xs font-medium truncate ${
                              isOn ? "text-amber-200" : "text-white/55"
                            }`}
                          >
                            {room.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </GlassCard>

                {/* Climate / Room Temperatures */}
                <GlassCard className="p-4">
                  <div className="flex items-center gap-3">
                    <Thermometer className="h-4 w-4 text-rose-400" />
                    <span className="text-sm font-medium text-white">
                      Room Climate
                    </span>
                    <span className="flex-1 text-xs text-white/45">
                      {loading ? "Loading..." : "Roth Touchline"}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3">
                    {CLIMATE_ROOMS.map((room) => {
                      const entity = haStates.find(
                        (e) => e.entity_id === room.entity_id
                      );
                      const current = entity?.attributes?.current_temperature as number | undefined;
                      const target = entity?.attributes?.temperature as number | undefined;
                      const isUnavailable = !entity || entity.state === "unavailable";
                      const isAboveTarget = current != null && target != null && current > target;
                      const isBelowTarget = current != null && target != null && current < target - 0.5;
                      return (
                        <div
                          key={room.entity_id}
                          className={`flex items-center justify-between rounded-lg px-2 py-1.5 transition-colors ${
                            isUnavailable && !loading ? "opacity-30" : ""
                          }`}
                        >
                          <span className="text-xs font-medium text-white/55 truncate">
                            {room.name}
                          </span>
                          <div className="flex items-baseline gap-1">
                            <span
                              className={`text-xs font-semibold tabular-nums ${
                                isBelowTarget
                                  ? "text-blue-300"
                                  : isAboveTarget
                                    ? "text-rose-300"
                                    : "text-white/80"
                              }`}
                            >
                              {current != null ? `${current.toFixed(1)}°` : "—"}
                            </span>
                            {target != null && (
                              <span className="text-xs tabular-nums text-white/35">
                                / {target.toFixed(0)}°
                              </span>
                            )}
                          </div>
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
                  <span className="flex-1 truncate text-xs text-white/45">
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
                  <ChevronRight className="h-4 w-4 shrink-0 text-white/45" />
                </GlassCard>
              </div>
            </section>

            {/* — ENERGY MONITORING — */}
            <section>
              <SectionLabel icon={Zap} iconColor="text-yellow-400">
                Energy Monitoring
              </SectionLabel>
              <GlassCard className="p-4">
                {loading && energyLoading ? (
                  <div className="flex items-center gap-2 text-xs text-white/45">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Loading…
                  </div>
                ) : (
                  <>
                    {/* Live grid power */}
                    {(() => {
                      const gridPower = haStates.find((e) => e.entity_id === "sensor.grid_connection_import_power");
                      const watts = gridPower ? parseInt(gridPower.state, 10) : NaN;
                      const l1 = parseInt(haStates.find((e) => e.entity_id === "sensor.grid_connection_import_power_l1")?.state ?? "", 10);
                      const l2 = parseInt(haStates.find((e) => e.entity_id === "sensor.grid_connection_import_power_l2")?.state ?? "", 10);
                      const l3 = parseInt(haStates.find((e) => e.entity_id === "sensor.grid_connection_import_power_l3")?.state ?? "", 10);
                      return (
                        <div className="mb-4">
                          <div className="flex items-baseline gap-2">
                            <Zap className="h-4 w-4 text-green-400" />
                            <span className="text-2xl font-bold tabular-nums text-green-400">
                              {isNaN(watts) ? "—" : watts.toLocaleString()}
                            </span>
                            <span className="text-sm text-green-400/70">W</span>
                            <span className="ml-auto text-xs tabular-nums text-white/45">
                              Today: {energyTodayKwh.toFixed(1)} kWh
                            </span>
                          </div>
                          {!isNaN(l1) && (
                            <div className="mt-1 flex gap-3 text-xs text-white/45">
                              <span>L1: {l1}W</span>
                              <span>L2: {isNaN(l2) ? "—" : l2}W</span>
                              <span>L3: {isNaN(l3) ? "—" : l3}W</span>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* 7-day energy graph */}
                    {energyDays.length > 0 && (() => {
                      const last7 = energyDays.slice(-7);
                      const maxKwh = Math.max(...last7.map((d) => d.kwh), 1);
                      const avgKwh = last7.reduce((s, d) => s + d.kwh, 0) / last7.length;
                      const todayStr = new Date().toISOString().split("T")[0];
                      return (
                        <div className="mb-4 rounded-xl bg-white/[0.03] p-3">
                          <div className="mb-3 flex items-center justify-between">
                            <p className="text-xs font-semibold uppercase tracking-wider text-white/50">
                              <BarChart3 className="mr-1 inline h-3 w-3 -translate-y-px" />
                              Daily Consumption
                            </p>
                            <span className="text-xs tabular-nums text-white/40">avg {avgKwh.toFixed(1)} kWh</span>
                          </div>

                          {/* Bar chart area */}
                          <div className="relative flex items-end gap-2" style={{ height: 96 }}>
                            {/* Avg reference line */}
                            <div
                              className="pointer-events-none absolute left-0 right-0 border-t border-dashed border-white/[0.07]"
                              style={{ bottom: `${(avgKwh / maxKwh) * 100}%` }}
                            />

                            {last7.map((d) => {
                              const pct = (d.kwh / maxKwh) * 100;
                              const isToday = d.date === todayStr;
                              const dayLabel = new Date(d.date + "T12:00:00").toLocaleDateString("da-DK", { weekday: "short" });

                              return (
                                <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
                                  {/* kWh value on top */}
                                  <span
                                    className={`text-xs font-semibold tabular-nums ${
                                      isToday ? "text-green-300" : "text-white/60"
                                    }`}
                                  >
                                    {d.kwh.toFixed(1)}
                                  </span>

                                  {/* Bar */}
                                  <div className="relative flex w-full items-end justify-center" style={{ height: 64 }}>
                                    <div
                                      className={`w-full rounded-md transition-all duration-500 ${
                                        isToday
                                          ? "bg-gradient-to-t from-green-500/70 to-green-300/50 shadow-[0_0_12px_rgba(74,222,128,0.2)] ring-1 ring-green-400/30"
                                          : "bg-gradient-to-t from-yellow-500/50 to-yellow-300/30"
                                      }`}
                                      style={{ height: `${Math.max(6, pct)}%` }}
                                    />
                                  </div>

                                  {/* Day label */}
                                  <span
                                    className={`text-xs font-medium ${
                                      isToday ? "text-green-300" : "text-white/45"
                                    }`}
                                  >
                                    {isToday ? "I dag" : dayLabel}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Today's usage + Live power side by side */}
                    <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {/* Today's usage per device */}
                    {deviceToday.length > 0 && (
                      <div className="rounded-xl bg-white/[0.03] p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/50">
                          <Zap className="mr-1 inline h-3 w-3 -translate-y-px text-yellow-400" />
                          Today&apos;s Usage by Device
                        </p>
                        <div className="space-y-1.5">
                          {[...deviceToday].sort((a, b) => b.kwh - a.kwh).map((dev) => {
                            const maxDevKwh = Math.max(...deviceToday.map((d) => d.kwh), 0.1);
                            const pct = (dev.kwh / maxDevKwh) * 100;
                            return (
                              <div key={dev.name} className="group">
                                <div className="flex items-center justify-between mb-0.5">
                                  <span className="text-xs text-white/70">{dev.name}</span>
                                  <span className="text-xs font-semibold tabular-nums text-white/80">{dev.kwh.toFixed(2)} kWh</span>
                                </div>
                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.05]">
                                  <div
                                    className="h-full rounded-full bg-gradient-to-r from-yellow-500/60 to-yellow-300/40 transition-all duration-700"
                                    style={{ width: `${Math.max(2, pct)}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Appliances — live power */}
                    <div className="rounded-xl bg-white/[0.03] p-3">
                      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-white/50">
                        <Plug className="h-3 w-3" /> Live Power
                      </p>
                      <div className="grid grid-cols-1 gap-y-1">
                        {ENERGY_APPLIANCES.map((dev) => {
                          const entity = haStates.find((e) => e.entity_id === dev.entity_id);
                          const w = entity ? parseFloat(entity.state) : NaN;
                          const isActive = !isNaN(w) && w > 5;
                          return (
                            <div key={dev.entity_id} className="flex items-center justify-between rounded-lg px-2 py-1">
                              <span className={`text-xs truncate ${isActive ? "text-white/80" : "text-white/45"}`}>{dev.name}</span>
                              <span className={`text-xs tabular-nums ${isActive ? "text-green-300" : "text-white/40"}`}>
                                {isNaN(w) ? "—" : `${Math.round(w)}W`}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    </div>

                    {/* EV Charger section */}
                    {(() => {
                      const chargingBin = haStates.find((e) => e.entity_id === "binary_sensor.bilskirner_charging");
                      const chargingEnum = haStates.find((e) => e.entity_id === "sensor.bilskirner_charging");
                      const chargerPower = haStates.find((e) => e.entity_id === "sensor.bilskirner_charger_power");
                      const energyAdded = haStates.find((e) => e.entity_id === "sensor.bilskirner_charge_energy_added");
                      const battLevel = haStates.find((e) => e.entity_id === "sensor.bilskirner_battery_level");
                      const isCharging = chargingBin?.state === "on";
                      const statusText = chargingEnum?.state ?? "unknown";
                      const powerKw = chargerPower ? parseFloat(chargerPower.state) : 0;
                      const addedKwh = energyAdded ? parseFloat(energyAdded.state) : 0;
                      const battery = battLevel ? parseInt(battLevel.state, 10) : NaN;
                      const battPct = isNaN(battery) ? 0 : Math.min(100, Math.max(0, battery));
                      const battColor = isCharging ? "green" : battPct > 20 ? "yellow" : "red";
                      const statusLabel = statusText === "disconnected" ? "Disconnected" : statusText === "stopped" ? "Stopped" : statusText === "complete" ? "Complete" : statusText.charAt(0).toUpperCase() + statusText.slice(1);
                      return (
                        <div className="mt-4 rounded-xl border border-white/[0.08] bg-white/[0.04] p-4">
                          <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/55">
                            <Car className="h-3.5 w-3.5" /> EV Charger — Bilskirner
                          </p>
                          <div className="flex items-center gap-5">
                            {/* Large battery visual */}
                            <div className="relative flex-shrink-0" style={{ width: 88, height: 44 }}>
                              {/* Battery body */}
                              <div className={`absolute inset-0 rounded-lg border-2 overflow-hidden ${
                                isCharging ? "border-green-400/60" : battPct > 20 ? "border-yellow-400/40" : "border-red-400/50"
                              }`}>
                                {/* Fill level */}
                                <div
                                  className={`absolute bottom-0 left-0 top-0 transition-all duration-1000 ${
                                    isCharging
                                      ? "bg-gradient-to-r from-green-500/60 to-green-400/40"
                                      : battPct > 20
                                        ? "bg-gradient-to-r from-yellow-500/50 to-yellow-400/30"
                                        : "bg-gradient-to-r from-red-500/60 to-red-400/40"
                                  }`}
                                  style={{ width: `${battPct}%` }}
                                >
                                  {/* Animated wave overlay when charging */}
                                  {isCharging && (
                                    <div className="absolute inset-0 overflow-hidden">
                                      <div className="animate-battery-wave absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                                    </div>
                                  )}
                                </div>
                              </div>
                              {/* Battery cap */}
                              <div className={`absolute right-[-6px] top-[12px] h-[20px] w-[4px] rounded-r-sm ${
                                isCharging ? "bg-green-400/50" : battPct > 20 ? "bg-yellow-400/30" : "bg-red-400/40"
                              }`} />
                              {/* Percentage text centered */}
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className={`text-sm font-bold tabular-nums ${
                                  isCharging ? "text-green-300 animate-battery-pulse" : battPct > 20 ? "text-yellow-300" : "text-red-300"
                                }`}>
                                  {isNaN(battery) ? "—" : `${battery}%`}
                                </span>
                              </div>
                              {/* Charging bolt icon */}
                              {isCharging && (
                                <div className="absolute -right-2 -top-2">
                                  <Zap className="h-4 w-4 text-green-400 animate-pulse drop-shadow-[0_0_4px_rgba(74,222,128,0.6)]" />
                                </div>
                              )}
                            </div>

                            {/* Status info */}
                            <div className="flex-1 space-y-1.5">
                              <div className="flex items-center gap-2">
                                {isCharging ? (
                                  <span className="flex items-center gap-1.5 rounded-full bg-green-500/15 px-2.5 py-1 text-xs font-semibold text-green-400 ring-1 ring-green-400/20">
                                    <BatteryCharging className="h-3.5 w-3.5 animate-pulse" />
                                    Charging — {powerKw} kW
                                  </span>
                                ) : (
                                  <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                                    statusText === "disconnected"
                                      ? "bg-white/[0.05] text-white/45"
                                      : "bg-yellow-500/10 text-yellow-300 ring-1 ring-yellow-400/15"
                                  }`}>
                                    <Circle className={`h-2 w-2 ${
                                      statusText === "disconnected" ? "fill-white/20 text-white/30" : "fill-yellow-400/50 text-yellow-400/50"
                                    }`} />
                                    {statusLabel}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3">
                                {addedKwh > 0 && (
                                  <span className="text-xs tabular-nums text-white/50">
                                    +{addedKwh.toFixed(1)} kWh added
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </>
                )}
              </GlassCard>
            </section>

            {/* — PRINTER + INFRASTRUCTURE (side by side) — */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <section>
              <SectionLabel icon={Printer} iconColor="text-orange-400">
                Canon Printer
              </SectionLabel>
              <GlassCard className="p-4">
                {loading ? (
                  <div className="flex items-center gap-2 text-xs text-white/45">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Loading…
                  </div>
                ) : (
                  <>
                    {/* Printer connectivity */}
                    {(() => {
                      const tracker = haStates.find(
                        (e) => e.entity_id === "device_tracker.cannon"
                      );
                      const isOnline = tracker?.state === "home";
                      return (
                        <div className="mb-4 flex items-center gap-2">
                          <Circle
                            className={`h-2.5 w-2.5 ${
                              isOnline
                                ? "fill-green-400 text-green-400"
                                : "fill-red-400 text-red-400"
                            }`}
                          />
                          <span className="text-xs font-medium text-white/70">
                            {isOnline ? "Online" : "Offline"}
                          </span>
                        </div>
                      );
                    })()}

                    {/* Toner bars */}
                    <div className="space-y-3">
                      {TONER_SENSORS.map((toner) => {
                        const entity = haStates.find(
                          (e) => e.entity_id === toner.entity_id
                        );
                        const level = entity
                          ? parseInt(entity.state, 10)
                          : NaN;
                        const pct = isNaN(level) ? 0 : Math.min(100, Math.max(0, level));
                        return (
                          <div key={toner.entity_id}>
                            <div className="mb-1 flex items-center justify-between text-xs">
                              <span className="font-medium text-white/70">
                                {toner.name}
                              </span>
                              <span className="tabular-nums text-white/55">
                                {isNaN(level) ? "N/A" : `${level}%`}
                              </span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-white/10">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${pct}%`,
                                  backgroundColor: toner.color,
                                  opacity: isNaN(level) ? 0.3 : 0.8,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </GlassCard>
            </section>

            <section>
              <SectionLabel icon={Activity} iconColor="text-emerald-400">
                Infrastructure
              </SectionLabel>
              <GlassCard className="divide-y divide-white/[0.06]">
                {loading ? (
                  <div className="flex items-center gap-2 p-4 text-xs text-white/45">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Loading…
                  </div>
                ) : (
                  INFRA_DEVICES.map((device) => {
                    const tracker = haStates.find(
                      (e) => e.entity_id === device.entity_id
                    );
                    const isOnline = tracker?.state === "home";
                    const uptimeEntity = device.uptimeEntity
                      ? haStates.find((e) => e.entity_id === device.uptimeEntity)
                      : null;

                    // Format uptime — prefer dedicated uptime sensor, fall back to last_changed on device_tracker
                    let uptimeStr = "";
                    let bootTime = NaN;
                    if (uptimeEntity && uptimeEntity.state !== "unavailable" && uptimeEntity.state !== "unknown") {
                      bootTime = new Date(uptimeEntity.state).getTime();
                    } else if (isOnline && tracker?.last_changed) {
                      // Use last_changed as "online since" for devices without a dedicated uptime sensor
                      bootTime = new Date(tracker.last_changed).getTime();
                    }
                    if (!isNaN(bootTime)) {
                      const diffMs = Date.now() - bootTime;
                      const days = Math.floor(diffMs / 86_400_000);
                      const hours = Math.floor((diffMs % 86_400_000) / 3_600_000);
                      const mins = Math.floor((diffMs % 3_600_000) / 60_000);
                      if (days > 0) uptimeStr = `${days}d ${hours}h`;
                      else if (hours > 0) uptimeStr = `${hours}h ${mins}m`;
                      else uptimeStr = `${mins}m`;
                    }

                    return (
                      <div
                        key={device.entity_id}
                        className="flex items-center gap-2 px-3 py-1.5"
                      >
                        <Circle
                          className={`h-2 w-2 shrink-0 ${
                            isOnline
                              ? "fill-green-400 text-green-400"
                              : "fill-red-400 text-red-400"
                          }`}
                        />
                        <span className="min-w-0 flex-1 truncate text-xs font-medium text-white/80">
                          {device.name}
                        </span>
                        {uptimeStr && (
                          <span className="flex items-center gap-1 text-xs tabular-nums text-white/45">
                            <Clock className="h-2.5 w-2.5" />
                            {uptimeStr}
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </GlassCard>
            </section>
            </div>

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
                    <span className="text-white/35">|</span>
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
          </div>
        </div>

        {/* ——— Footer ——— */}
        <div className="mt-8 flex items-center gap-4 pb-6 text-xs text-white/45">
          <Home className="h-4 w-4" />
          <a
            href="https://ha.aser.dk/config/automation/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-white/60"
          >
            View Automation
          </a>
          <span>|</span>
          <a
            href="https://ha.aser.dk/config/logs"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-white/60"
          >
            View All Logs
          </a>
        </div>
      </div>
    </div>
  );
}
