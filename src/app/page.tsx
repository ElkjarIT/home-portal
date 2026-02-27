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
  ThermometerSnowflake,
  Power,
  Search,
  Play,
  Pause,
  Square,
  Navigation,
  Cable,
  Gauge,
  CloudDownload,
  RefreshCw,
  AlertTriangle,
  User,
  CheckCircle2,
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
  key: string;
  name: string;
  active: number;
  waiting: number;
  paused: number;
  failed: number;
  completed: number;
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

interface ICloudPDContainer {
  name: string;
  status: string;
  running: boolean;
  startedAt?: string;
  health?: string;
  logs: {
    lastSyncStart: string | null;
    lastSyncEnd: string | null;
    lastSyncResult: string | null;
    filesDownloaded: number;
    filesDeleted: number;
    totalInCloud: number | null;
    totalTime: string | null;
    nextSyncAt: string | null;
    cookieExpiry: string | null;
    cookieDaysLeft: number | null;
    cookieWarning: boolean;
    errors: string[];
    syncing: boolean;
    user: string | null;
  };
}

interface ICloudPDStatus {
  timestamp: string;
  summary: {
    total: number;
    running: number;
    syncing: number;
    cookieWarnings: number;
  };
  containers: ICloudPDContainer[];
}

// ——— Helper Components ———

function GlassCard({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-xl border border-white/[0.10] bg-white/[0.07] backdrop-blur-xl ${className}`}
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
    <div className="mb-2 flex items-center justify-between">
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
  const [immichJobsPerSec, setImmichJobsPerSec] = useState<number | null>(null);
  const immichPrevSnapshot = useRef<{ waiting: number; active: number; time: number } | null>(null);
  const [evChargeConfirm, setEvChargeConfirm] = useState<"start" | "stop" | null>(null);
  const [immichStats, setImmichStats] = useState<ImmichStats | null>(null);
  const [immichStorage, setImmichStorage] = useState<ImmichStorage | null>(null);
  const [immichLoading, setImmichLoading] = useState(true);
  const [energyDays, setEnergyDays] = useState<EnergyDay[]>([]);
  const [energyTodayKwh, setEnergyTodayKwh] = useState(0);
  const [deviceToday, setDeviceToday] = useState<DeviceEnergy[]>([]);
  const [energyLoading, setEnergyLoading] = useState(true);
  const [togglingEntities, setTogglingEntities] = useState<Set<string>>(new Set());
  const [icloudpdStatus, setIcloudpdStatus] = useState<ICloudPDStatus | null>(null);
  const [icloudpdLoading, setIcloudpdLoading] = useState(true);

  // Helper: call a Home Assistant service via our API
  async function callHaService(domain: string, service: string, entity_id: string) {
    // Also track the media_player entity when toggling the remote (for Apple TV)
    const relatedEntity = entity_id === "remote.stuen_tv" ? APPLE_TV_ENTITY : null;
    setTogglingEntities((prev) => {
      const next = new Set(prev);
      next.add(entity_id);
      if (relatedEntity) next.add(relatedEntity);
      return next;
    });
    try {
      const res = await fetch("/api/ha/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain, service, entity_id }),
      });
      if (res.ok) {
        // Optimistically update local state
        const newState = service.includes("turn_on") ? "on" : service.includes("turn_off") ? "off" : null;
        if (newState) {
          setHaStates((prev) =>
            prev.map((e) => {
              if (e.entity_id === entity_id) return { ...e, state: newState };
              // When turning off remote.stuen_tv, also set media_player to "off"
              // When turning on media_player, it goes to "idle"
              if (relatedEntity && e.entity_id === relatedEntity) {
                return { ...e, state: newState === "off" ? "off" : "idle" };
              }
              return e;
            })
          );
        }
      }
    } catch {
      // ignore
    } finally {
      setTogglingEntities((prev) => {
        const next = new Set(prev);
        next.delete(entity_id);
        if (relatedEntity) next.delete(relatedEntity);
        return next;
      });
    }
  }

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
          const queues: ImmichQueue[] = data.queues ?? [];
          setImmichQueues(queues);
          // Calculate jobs/sec from waiting+active delta (decrease = jobs completed)
          const totalWaiting = queues.reduce((s: number, q: ImmichQueue) => s + q.waiting, 0);
          const totalActive = queues.reduce((s: number, q: ImmichQueue) => s + q.active, 0);
          const now = Date.now();
          if (immichPrevSnapshot.current) {
            const dt = (now - immichPrevSnapshot.current.time) / 1000;
            const prevPending = immichPrevSnapshot.current.waiting + immichPrevSnapshot.current.active;
            const curPending = totalWaiting + totalActive;
            // Jobs processed = decrease in pending (if pending went down, jobs were completed)
            const processed = prevPending - curPending;
            if (dt > 0 && processed > 0) {
              setImmichJobsPerSec(processed / dt);
            } else if (dt > 0) {
              // No decrease (new jobs added or idle) — show 0
              setImmichJobsPerSec(0);
            }
          }
          immichPrevSnapshot.current = { waiting: totalWaiting, active: totalActive, time: now };
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

  // Fetch iCloudPD status
  useEffect(() => {
    async function fetchICloudPD() {
      try {
        const res = await fetch("/api/icloudpd/status");
        if (res.ok) {
          setIcloudpdStatus(await res.json());
        }
      } catch {
        // ignore
      } finally {
        setIcloudpdLoading(false);
      }
    }
    fetchICloudPD();
    const iv = setInterval(fetchICloudPD, 30_000);
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

      <div className="mx-auto max-w-[1600px] px-3 py-3 sm:px-4 lg:px-6">
        <TopNav />

        {/* ——— Welcome Banner ——— */}
        <GlassCard className="mb-3 px-4 py-2.5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/20 ring-1 ring-blue-400/30">
              <Home className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white">
                Welcome{firstName ? `, ${firstName}` : ""}
              </h1>
              <p className="text-xs text-white/60">
                Quick access to your home services
              </p>
            </div>
          </div>
        </GlassCard>

        {/* ——— Two-column grid ——— */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_340px]">
          {/* === LEFT COLUMN === */}
          <div className="space-y-3">
            {/* — SMART HOME DEVICES — */}
            <section>
              <SectionLabel icon={Wifi} iconColor="text-sky-400">
                Smart Home Devices
              </SectionLabel>
              <div className="space-y-2">
                {/* Room Lights + Climate side by side */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
                  {/* Room Lights — 2/3 */}
                  <GlassCard className="p-3 lg:col-span-2">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/20">
                        <Lightbulb className="h-5 w-5 text-amber-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-medium text-white">Room Lights</span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-bold tabular-nums text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]">
                          {loading ? "—" : onCount}
                        </span>
                        <span className="text-[10px] text-white/40">/ {ROOM_LIGHTS.length} on</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 sm:grid-cols-3">
                      {ROOM_LIGHTS.map((room) => {
                        const state = lights.find((l) => l.entity_id === room.entity_id);
                        const isOn = state?.state === "on";
                        const isUnavailable = !state || state.state === "unavailable";
                        const isToggling = togglingEntities.has(room.entity_id);
                        return (
                          <button
                            key={room.entity_id}
                            onClick={() => {
                              if (isUnavailable || isToggling) return;
                              callHaService("light", isOn ? "turn_off" : "turn_on", room.entity_id);
                            }}
                            disabled={isUnavailable || isToggling}
                            className={`flex items-center gap-2 rounded-lg px-2 py-1.5 transition-all duration-200 cursor-pointer select-none ${
                              isOn
                                ? "bg-amber-400/10 hover:bg-amber-400/20 active:scale-95"
                                : isUnavailable && !loading
                                  ? "opacity-30 cursor-not-allowed"
                                  : "hover:bg-white/[0.06] active:scale-95"
                            } ${isToggling ? "animate-pulse" : ""}`}
                          >
                            {isToggling ? (
                              <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-amber-300/60" />
                            ) : isOn ? (
                              <Lightbulb className="h-3.5 w-3.5 shrink-0 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]" />
                            ) : (
                              <LightbulbOff className="h-3.5 w-3.5 shrink-0 text-white/35" />
                            )}
                            <span className={`text-xs font-medium truncate ${isOn ? "text-amber-200" : "text-white/55"}`}>
                              {room.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </GlassCard>

                  {/* Climate / Room Temperatures — 1/3 */}
                  <GlassCard className="p-3">
                    <div className="flex items-center gap-2">
                      <Thermometer className="h-3.5 w-3.5 text-rose-400" />
                      <span className="text-sm font-medium text-white">
                        Room Climate
                      </span>
                      <span className="flex-1 text-xs text-white/45">
                        {loading ? "Loading..." : "Roth Touchline"}
                      </span>
                    </div>
                    <div className="mt-2 grid grid-cols-1 gap-y-1">
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
                </div>

                {/* Apple TV + Immich side by side */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
                  {/* Apple TV — 1/3 with TV screen visual */}
                  <GlassCard className="p-3 flex flex-col">
                    <div className="flex items-center gap-2 mb-2">
                      <Tv className="h-4 w-4 text-slate-300" />
                      <span className="text-sm font-medium text-white">Apple TV</span>
                      {/* Power toggle */}
                      {!loading && (() => {
                        const isOff = appleTvState === "off" || appleTvState === "unknown" || !appleTvState;
                        return (
                          <button
                            onClick={() => {
                              if (isOff) {
                                callHaService("media_player", "turn_on", APPLE_TV_ENTITY);
                              } else {
                                callHaService("remote", "turn_off", "remote.stuen_tv");
                              }
                            }}
                            disabled={togglingEntities.has(APPLE_TV_ENTITY) || togglingEntities.has("remote.stuen_tv")}
                            className={`ml-auto flex h-6 w-6 items-center justify-center rounded-md transition-all duration-200 active:scale-90 ${
                              isOff
                                ? "bg-white/[0.06] hover:bg-white/[0.12] text-white/35 hover:text-white/60"
                                : "bg-green-500/15 hover:bg-green-500/25 text-green-400"
                            }`}
                            title={isOff ? "Turn on" : "Turn off"}
                          >
                            {(togglingEntities.has(APPLE_TV_ENTITY) || togglingEntities.has("remote.stuen_tv")) ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Power className="h-3.5 w-3.5" />
                            )}
                          </button>
                        );
                      })()}
                    </div>
                    {/* TV Screen */}
                    <div className={`relative flex-1 min-h-[100px] rounded-lg border-2 overflow-hidden transition-all duration-500 ${
                      appleTvState === "playing"
                        ? "border-green-400/30 animate-tv-glow-playing"
                        : appleTvState === "paused"
                          ? "border-yellow-400/25 shadow-[0_0_10px_rgba(250,204,21,0.08)]"
                          : appleTvState === "idle" || appleTvState === "standby"
                            ? "border-purple-400/20 animate-tv-glow-idle"
                            : "border-white/[0.05]"
                    }`}>
                      {/* Screen background */}
                      <div className={`absolute inset-0 transition-all duration-700 ${
                        appleTvState === "playing"
                          ? "bg-gradient-to-br from-green-900/30 via-emerald-800/20 to-teal-900/30 bg-[length:200%_200%] animate-tv-color-shift"
                          : appleTvState === "paused"
                            ? "bg-gradient-to-br from-yellow-900/20 via-amber-800/15 to-orange-900/20"
                            : appleTvState === "idle" || appleTvState === "standby"
                              ? "bg-gradient-to-br from-indigo-900/25 via-purple-900/20 to-slate-900/30 bg-[length:300%_300%] animate-tv-idle-drift"
                              : "bg-black/40"
                      }`} />
                      {/* Scanline effect when playing */}
                      {appleTvState === "playing" && (
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                          <div className="animate-tv-scanline absolute inset-x-0 h-[2px] bg-white/[0.04]" />
                        </div>
                      )}
                      {/* Floating orbs when idle/standby — screensaver effect */}
                      {(appleTvState === "idle" || appleTvState === "standby") && (
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                          <div className="absolute h-16 w-16 rounded-full bg-purple-500/10 blur-xl animate-tv-orb-1" />
                          <div className="absolute h-12 w-12 rounded-full bg-indigo-400/10 blur-xl animate-tv-orb-2" />
                          <div className="absolute h-10 w-10 rounded-full bg-blue-500/8 blur-lg animate-tv-orb-3" />
                        </div>
                      )}
                      {/* Static noise when off */}
                      {(appleTvState === "off" || appleTvState === "unknown") && (
                        <div className="absolute inset-0 animate-tv-static" style={{
                          backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E\")",
                          backgroundSize: "100px 100px"
                        }} />
                      )}
                      {/* Center content */}
                      <div className="relative flex flex-col items-center justify-center h-full min-h-[100px] p-3">
                        {loading ? (
                          <Loader2 className="h-5 w-5 animate-spin text-white/30" />
                        ) : appleTvState === "playing" ? (
                          <>
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <span className="flex h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                              <span className="text-[10px] font-bold uppercase tracking-widest text-green-400/80">Streaming</span>
                            </div>
                            <p className="text-xs font-semibold text-white/90 text-center truncate max-w-full">
                              {appleTvMedia || "Playing"}
                            </p>
                            {appleTvApp && (
                              <p className="text-[10px] text-white/40 mt-0.5">{appleTvApp}</p>
                            )}
                          </>
                        ) : appleTvState === "paused" ? (
                          <>
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <span className="flex h-2 w-2 rounded-full bg-yellow-400/70" />
                              <span className="text-[10px] font-bold uppercase tracking-widest text-yellow-400/70">Paused</span>
                            </div>
                            {appleTvMedia && (
                              <p className="text-xs text-white/60 text-center truncate max-w-full">{appleTvMedia}</p>
                            )}
                          </>
                        ) : appleTvState === "idle" || appleTvState === "standby" ? (
                          <>
                            <div className="relative mb-1.5">
                              <Tv className="h-5 w-5 text-purple-300/50" />
                              <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400/40" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-400/70" />
                              </span>
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-purple-300/60">Idle</span>
                            {appleTvApp && (
                              <p className="text-[10px] text-white/30 mt-0.5">{appleTvApp}</p>
                            )}
                          </>
                        ) : (
                          <>
                            <div className="h-5 w-5 rounded-full border border-white/10 flex items-center justify-center mb-1">
                              <Power className="h-3 w-3 text-white/15" />
                            </div>
                            <span className="text-[10px] text-white/25">Off</span>
                          </>
                        )}
                      </div>
                    </div>
                    {/* TV stand */}
                    <div className="mx-auto mt-1.5 h-1 w-12 rounded-full bg-white/[0.06]" />
                  </GlassCard>

                {/* Immich card — 2/3 */}
                <a
                  href="https://immich.aser.dk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group lg:col-span-2"
                >
                  <GlassCard className="h-full p-3 transition-all duration-300 hover:bg-white/[0.12] hover:shadow-[0_0_24px_rgba(59,130,246,0.08)]">
                    {/* Header */}
                    <div className="mb-2 flex items-center gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/20 transition-transform duration-300 group-hover:scale-110">
                        <ImageIcon className="h-4 w-4 text-blue-400" />
                      </div>
                      <span className="text-sm font-medium text-white">Immich</span>
                      <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-white/45 transition-transform duration-300 group-hover:translate-x-1" />
                    </div>

                    {immichLoading ? (
                      <div className="flex items-center gap-2 text-xs text-white/45">
                        <Loader2 className="h-3 w-3 animate-spin" /> Loading…
                      </div>
                    ) : (
                      <div className="flex">
                        {/* Section 1: Library counts */}
                        <div className="relative flex-1 flex flex-col rounded-l-lg border border-white/[0.06] bg-white/[0.03] p-3 transition-colors duration-300 group-hover:border-blue-400/15 group-hover:bg-blue-500/[0.04]">
                          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/20 to-transparent" />
                          <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-blue-400/70">
                            <Camera className="h-3 w-3" /> Library
                          </p>
                          {immichStats ? (
                            <>
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-white/50">Photos</span>
                                  <span className="text-xs font-semibold tabular-nums text-white/85">{immichStats.photos.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-white/50">Videos</span>
                                  <span className="text-xs font-semibold tabular-nums text-white/85">{immichStats.videos.toLocaleString()}</span>
                                </div>
                              </div>
                              <div className="mt-auto flex items-center justify-between border-t border-blue-400/10 pt-1.5">
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-400/50">Total</span>
                                <span className="text-xs font-bold tabular-nums text-blue-300">{(immichStats.photos + immichStats.videos).toLocaleString()}</span>
                              </div>
                            </>
                          ) : (
                            <p className="text-xs text-white/40">—</p>
                          )}
                        </div>

                        {/* Divider */}
                        <div className="w-px self-stretch bg-gradient-to-b from-transparent via-blue-400/20 to-transparent" />
                        {/* Section 2: Storage */}
                        <div className="relative flex-1 flex flex-col border-y border-white/[0.06] bg-white/[0.03] p-3 transition-colors duration-300 group-hover:border-blue-400/15 group-hover:bg-blue-500/[0.04]">
                          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/20 to-transparent" />
                          <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-blue-400/70">
                            <HardDrive className="h-3 w-3" /> Storage
                          </p>
                          {immichStorage ? (
                            <>
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-white/50">Used</span>
                                  <span className="text-xs font-semibold tabular-nums text-white/85">{immichStorage.diskUse}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-white/50">Free</span>
                                  <span className="text-xs font-semibold tabular-nums text-white/85">{immichStorage.diskAvailable}</span>
                                </div>
                              </div>
                              <div className="mt-auto">
                                <div className="flex items-center justify-between border-t border-blue-400/10 pt-1.5">
                                  <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-400/50">Total</span>
                                  <span className="text-xs font-bold tabular-nums text-blue-300">{immichStorage.diskSize}</span>
                                </div>
                                {/* Storage usage bar — animated dual segment */}
                                {(() => {
                                  const usedMatch = immichStorage.diskUse.match(/([\d.]+)/);
                                  const totalMatch = immichStorage.diskSize.match(/([\d.]+)/);
                                  const usedTB = usedMatch ? parseFloat(usedMatch[1]) : 0;
                                  const totalTB = totalMatch ? parseFloat(totalMatch[1]) : 1;
                                  const usagePct = Math.min(100, (usedTB / totalTB) * 100);
                                  const freePct = 100 - usagePct;
                                  return (
                                    <div className="mt-1.5 space-y-1">
                                      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-white/[0.04]">
                                        <div
                                          className={`h-full transition-all duration-[1500ms] ease-out rounded-l-full ${
                                            usagePct > 90 ? "bg-gradient-to-r from-red-500/70 to-red-400/50" : usagePct > 70 ? "bg-gradient-to-r from-yellow-500/60 to-yellow-400/40" : "bg-gradient-to-r from-blue-500/60 to-blue-400/40"
                                          }`}
                                          style={{ width: `${usagePct}%` }}
                                        />
                                        <div
                                          className="h-full bg-gradient-to-r from-emerald-500/25 to-emerald-400/15 transition-all duration-[1500ms] ease-out rounded-r-full"
                                          style={{ width: `${freePct}%` }}
                                        />
                                      </div>
                                      <div className="flex justify-between text-[9px] tabular-nums">
                                        <span className={usagePct > 90 ? "text-red-300/60" : usagePct > 70 ? "text-yellow-300/60" : "text-blue-300/60"}>{usagePct.toFixed(0)}% used</span>
                                        <span className="text-emerald-300/50">{freePct.toFixed(0)}% free</span>
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>
                            </>
                          ) : (
                            <p className="text-xs text-white/40">—</p>
                          )}
                        </div>

                        {/* Divider */}
                        <div className="w-px self-stretch bg-gradient-to-b from-transparent via-blue-400/20 to-transparent" />
                        {/* Section 3: Top 3 job queues */}
                        <div className="relative flex-1 flex flex-col rounded-r-lg border border-white/[0.06] bg-white/[0.03] p-3 transition-colors duration-300 group-hover:border-blue-400/15 group-hover:bg-blue-500/[0.04]">
                          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/20 to-transparent" />
                          <div className="mb-2 flex items-center gap-1.5">
                            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-blue-400/70">
                              <ListTodo className="h-3 w-3" /> Jobs
                            </p>
                            {/* Action buttons */}
                            <div className="ml-auto flex items-center gap-1">
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  fetch("/api/immich/jobs/command", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ jobName: "smartSearch", command: "start", force: false }),
                                  });
                                }}
                                className="flex h-5 w-5 items-center justify-center rounded bg-blue-500/10 text-blue-400/70 hover:bg-blue-500/20 hover:text-blue-300 active:scale-90 transition-all"
                                title="Start Smart Search"
                              >
                                <Search className="h-2.5 w-2.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  fetch("/api/immich/jobs/command", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ jobName: "__all__", command: "start", force: false }),
                                  });
                                }}
                                className="flex h-5 w-5 items-center justify-center rounded bg-green-500/10 text-green-400/70 hover:bg-green-500/20 hover:text-green-300 active:scale-90 transition-all"
                                title="Start All Missing"
                              >
                                <Play className="h-2.5 w-2.5" />
                              </button>
                            </div>
                          </div>
                          {immichQueues.length > 0 ? (
                            <>
                              <div className="space-y-1.5">
                                {(() => {
                                  // Tier 1: active (non-paused) with pending jobs
                                  // Tier 2: paused with pending jobs
                                  // Tier 3: empty queues (no pending), active first then paused
                                  const sorted = [...immichQueues].sort((a, b) => {
                                    const aPending = a.active + a.waiting + a.paused;
                                    const bPending = b.active + b.waiting + b.paused;
                                    const aTier = aPending > 0 ? (a.isPaused ? 2 : 1) : (a.isPaused ? 4 : 3);
                                    const bTier = bPending > 0 ? (b.isPaused ? 2 : 1) : (b.isPaused ? 4 : 3);
                                    if (aTier !== bTier) return aTier - bTier;
                                    return bPending - aPending;
                                  });
                                  return sorted.slice(0, 3).map((q) => (
                                    <div key={q.name} className="flex items-center justify-between">
                                      <div className="flex items-center gap-1.5 truncate mr-2">
                                        <span className={`text-xs truncate ${q.isPaused ? "text-white/30 italic" : "text-white/50"}`}>{q.name}</span>
                                        {q.isPaused ? (
                                          <button
                                            onClick={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              fetch("/api/immich/jobs/command", {
                                                method: "POST",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify({ jobName: q.key, command: "resume", force: false }),
                                              });
                                            }}
                                            className="flex h-3.5 items-center gap-0.5 rounded bg-orange-500/15 px-1 text-[8px] font-bold uppercase tracking-wider text-orange-400/80 hover:bg-orange-500/25 hover:text-orange-300 active:scale-90 transition-all"
                                            title={`Resume ${q.name}`}
                                          >
                                            <Play className="h-2 w-2" /> {q.paused > 0 ? q.paused.toLocaleString() : "Paused"}
                                          </button>
                                        ) : (q.active + q.waiting + q.paused) > 0 ? (
                                          <button
                                            onClick={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              fetch("/api/immich/jobs/command", {
                                                method: "POST",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify({ jobName: q.key, command: "pause", force: false }),
                                              });
                                            }}
                                            className="flex h-3.5 items-center gap-0.5 rounded bg-white/[0.05] px-1 text-[8px] font-bold uppercase tracking-wider text-white/30 hover:bg-orange-500/15 hover:text-orange-400/80 active:scale-90 transition-all"
                                            title={`Pause ${q.name}`}
                                          >
                                            <Pause className="h-2 w-2" />
                                          </button>
                                        ) : null}
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        {q.active > 0 ? (
                                          <span className="flex items-center gap-0.5 text-[10px] font-semibold tabular-nums text-yellow-300">
                                            <span className="inline-block h-1 w-1 rounded-full bg-yellow-400 animate-pulse" />
                                            {q.active}
                                          </span>
                                        ) : (
                                          <span className="text-[10px] tabular-nums text-white/25">0</span>
                                        )}
                                        <span className="text-[9px] text-white/20">/</span>
                                        {q.waiting > 0 ? (
                                          <span className="text-[10px] font-semibold tabular-nums text-blue-300">{q.waiting}</span>
                                        ) : (
                                          <span className="text-[10px] tabular-nums text-white/25">0</span>
                                        )}
                                      </div>
                                    </div>
                                  ));
                                })()}
                              </div>
                              <div className="mt-auto flex items-center justify-between border-t border-blue-400/10 pt-1.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-400/50">Total</span>
                                  {immichJobsPerSec !== null && (
                                    <span className="text-[9px] tabular-nums text-emerald-400/70">
                                      {immichJobsPerSec >= 1
                                        ? `${immichJobsPerSec.toFixed(1)} /s`
                                        : immichJobsPerSec > 0
                                          ? `${(immichJobsPerSec * 60).toFixed(1)} /m`
                                          : "idle"}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-bold tabular-nums text-yellow-300">{immichQueues.reduce((s, q) => s + q.active, 0).toLocaleString()}</span>
                                  <span className="text-[9px] text-white/20">/</span>
                                  <span className="text-[10px] font-bold tabular-nums text-blue-300">{immichQueues.reduce((s, q) => s + q.waiting, 0).toLocaleString()}</span>
                                </div>
                              </div>
                            </>
                          ) : (
                            <p className="text-xs text-white/40">No jobs</p>
                          )}
                        </div>
                      </div>
                    )}
                  </GlassCard>
                </a>
                </div>

                {/* iCloudPD card — full width */}
                <GlassCard className="p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-purple-500/20">
                      <CloudDownload className="h-4 w-4 text-purple-400" />
                    </div>
                    <span className="text-sm font-medium text-white">iCloud Photos Sync</span>
                    {icloudpdStatus && icloudpdStatus.summary.syncing > 0 && (
                      <span className="ml-auto flex items-center gap-1 rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-400">
                        <RefreshCw className="h-3 w-3 animate-spin" /> Syncing
                      </span>
                    )}
                  </div>

                  {icloudpdLoading ? (
                    <div className="flex items-center gap-2 text-xs text-white/45">
                      <Loader2 className="h-3 w-3 animate-spin" /> Loading…
                    </div>
                  ) : !icloudpdStatus ? (
                    <p className="text-xs text-white/40">Status API unreachable</p>
                  ) : (() => {
                    // Group containers by account
                    const accounts = new Map<string, { personal: ICloudPDContainer | null; shared: ICloudPDContainer | null }>();
                    for (const c of icloudpdStatus.containers) {
                      const baseName = c.name.replace(/^icloudpd-/, "").replace(/-shared$/, "");
                      const isShared = c.name.includes("shared");
                      if (!accounts.has(baseName)) accounts.set(baseName, { personal: null, shared: null });
                      const entry = accounts.get(baseName)!;
                      if (isShared) entry.shared = c; else entry.personal = c;
                    }

                    // Relative time helper
                    const relTime = (iso: string | null) => {
                      if (!iso) return null;
                      try {
                        const ms = Date.now() - new Date(iso).getTime();
                        if (ms < 0) return "just now";
                        const mins = Math.floor(ms / 60000);
                        if (mins < 1) return "just now";
                        if (mins < 60) return `${mins}m ago`;
                        const hrs = Math.floor(mins / 60);
                        if (hrs < 24) return `${hrs}h ago`;
                        return `${Math.floor(hrs / 24)}d ago`;
                      } catch { return null; }
                    };

                    // Next sync countdown
                    const nextIn = (iso: string | null) => {
                      if (!iso) return null;
                      try {
                        const secs = (new Date(iso).getTime() - Date.now()) / 1000;
                        if (secs <= 0) return "soon";
                        const h = Math.floor(secs / 3600);
                        const m = Math.floor((secs % 3600) / 60);
                        return h > 0 ? `${h}h ${m}m` : `${m}m`;
                      } catch { return null; }
                    };

                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {Array.from(accounts.entries()).map(([name, { personal, shared }]) => {
                          const primary = personal ?? shared;
                          if (!primary) return null;
                          const displayName = name.charAt(0).toUpperCase() + name.slice(1);
                          const allRunning = [personal, shared].filter(Boolean).every(c => c!.running);
                          const anySyncing = [personal, shared].filter(Boolean).some(c => c!.logs.syncing);
                          const cookieDays = primary.logs.cookieDaysLeft;
                          const cookieWarn = primary.logs.cookieWarning;

                          // Aggregate totals
                          const totalItems = [personal, shared].reduce((sum, c) => sum + (c?.logs.totalInCloud ?? 0), 0);
                          const totalDownloaded = [personal, shared].reduce((sum, c) => sum + (c?.logs.filesDownloaded ?? 0), 0);
                          const totalDeleted = [personal, shared].reduce((sum, c) => sum + (c?.logs.filesDeleted ?? 0), 0);
                          const lastSync = personal?.logs.lastSyncEnd ?? shared?.logs.lastSyncEnd;
                          const nextSync = personal?.logs.nextSyncAt ?? shared?.logs.nextSyncAt;
                          const hasErrors = [personal, shared].some(c => c && c.logs.errors.length > 0);

                          return (
                            <div
                              key={name}
                              className={`relative rounded-lg border p-3 transition-colors ${
                                anySyncing
                                  ? "border-blue-400/20 bg-blue-500/[0.06]"
                                  : cookieWarn
                                    ? "border-orange-400/20 bg-orange-500/[0.04]"
                                    : !allRunning
                                      ? "border-red-400/15 bg-red-500/[0.03]"
                                      : "border-white/[0.06] bg-white/[0.03]"
                              }`}
                            >
                              {/* Account header */}
                              <div className="flex items-center gap-2 mb-2.5">
                                <span className={`inline-block h-2 w-2 rounded-full ${
                                  anySyncing ? "bg-blue-400 animate-pulse" : allRunning ? "bg-emerald-400" : "bg-red-400"
                                }`} />
                                <span className="text-sm font-semibold text-white">{displayName}</span>
                                {/* Container count */}
                                <span className="text-[10px] text-white/30">
                                  {[personal, shared].filter(Boolean).length === 2 ? "Personal + Shared" : "Personal"}
                                </span>
                              </div>

                              {/* Key info rows */}
                              <div className="space-y-2">
                                {/* Last sync row */}
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-white/45">Last Sync</span>
                                  <div className="flex items-center gap-1.5">
                                    {anySyncing ? (
                                      <span className="flex items-center gap-1 text-xs font-medium text-blue-400">
                                        <RefreshCw className="h-3 w-3 animate-spin" /> Running now
                                      </span>
                                    ) : lastSync ? (
                                      <>
                                        <span className="text-xs font-medium text-white/75">{relTime(lastSync)}</span>
                                        {totalDownloaded > 0 && (
                                          <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">
                                            +{totalDownloaded} new
                                          </span>
                                        )}
                                        {totalDeleted > 0 && (
                                          <span className="rounded bg-red-500/15 px-1.5 py-0.5 text-[10px] font-bold text-red-400">
                                            -{totalDeleted} deleted
                                          </span>
                                        )}
                                      </>
                                    ) : (
                                      <span className="text-xs text-white/30">—</span>
                                    )}
                                  </div>
                                </div>

                                {/* iCloud library size */}
                                {totalItems > 0 && (
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-white/45">iCloud Photos</span>
                                    <span className="text-xs font-medium tabular-nums text-white/75">{totalItems.toLocaleString()}</span>
                                  </div>
                                )}

                                {/* Next sync */}
                                {!anySyncing && nextSync && (
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-white/45">Next Sync</span>
                                    <span className="text-xs text-white/55">{nextIn(nextSync)}</span>
                                  </div>
                                )}

                                {/* Cookie / status row */}
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-white/45">Cookie</span>
                                  {cookieDays !== null ? (
                                    <span className={`text-xs font-medium ${
                                      cookieWarn ? "text-orange-400" : cookieDays <= 14 ? "text-yellow-300/70" : "text-emerald-400/70"
                                    }`}>
                                      {cookieWarn && <AlertTriangle className="inline h-3 w-3 mr-1 -translate-y-px" />}
                                      {cookieDays} days left
                                    </span>
                                  ) : (
                                    <span className="text-xs text-white/30">—</span>
                                  )}
                                </div>

                                {/* Errors indicator */}
                                {hasErrors && (
                                  <div className="flex items-center gap-1 rounded bg-red-500/10 px-2 py-1">
                                    <AlertTriangle className="h-3 w-3 text-red-400/70 shrink-0" />
                                    <span className="text-[10px] text-red-300/70 truncate">
                                      {[personal, shared].flatMap(c => c?.logs.errors ?? []).pop()?.replace(/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}\s+ERROR\s+/, "")}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </GlassCard>

              </div>
            </section>

            {/* — ENERGY MONITORING — */}
            <section>
              <SectionLabel icon={Zap} iconColor="text-yellow-400">
                Energy Monitoring
              </SectionLabel>
              <GlassCard className="p-3">
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
                        <div className="mb-3">
                          <div className="flex items-baseline gap-2">
                            <Zap className="h-3.5 w-3.5 text-green-400" />
                            <span className="text-xl font-bold tabular-nums text-green-400">
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

                    {/* Bilskirner + 7-day chart side by side */}
                    <div className="mb-3 grid grid-cols-1 gap-2 lg:grid-cols-2">
                    {/* EV Charger — Bilskirner (hero section) */}
                    {(() => {
                      const chargingBin = haStates.find((e) => e.entity_id === "binary_sensor.bilskirner_charging");
                      const chargingEnum = haStates.find((e) => e.entity_id === "sensor.bilskirner_charging");
                      const chargeSwitch = haStates.find((e) => e.entity_id === "switch.bilskirner_charge");
                      const chargerPower = haStates.find((e) => e.entity_id === "sensor.bilskirner_charger_power");
                      const energyAdded = haStates.find((e) => e.entity_id === "sensor.bilskirner_charge_energy_added");
                      const battLevel = haStates.find((e) => e.entity_id === "sensor.bilskirner_battery_level");
                      const rangeRated = haStates.find((e) => e.entity_id === "sensor.bilskirner_battery_range");
                      const rangeEst = haStates.find((e) => e.entity_id === "sensor.bilskirner_battery_range_estimate");
                      const rangeIdeal = haStates.find((e) => e.entity_id === "sensor.bilskirner_battery_range_ideal");
                      const insideTemp = haStates.find((e) => e.entity_id === "sensor.bilskirner_inside_temperature");
                      const outsideTemp = haStates.find((e) => e.entity_id === "sensor.bilskirner_outside_temperature");
                      const chargeLimit = haStates.find((e) => e.entity_id === "number.bilskirner_charge_limit");
                      const chargeCable = haStates.find((e) => e.entity_id === "binary_sensor.bilskirner_charge_cable");
                      const shiftState = haStates.find((e) => e.entity_id === "sensor.bilskirner_shift_state");
                      const speedSensor = haStates.find((e) => e.entity_id === "sensor.bilskirner_speed");
                      const isCharging = chargingBin?.state === "on";
                      const statusText = chargingEnum?.state ?? "unknown";
                      const isCableConnected = chargeCable?.state === "on";
                      const shiftVal = shiftState?.state ?? "p";
                      const isDriving = shiftVal === "d" || shiftVal === "r" || shiftVal === "n";
                      const speedKmh = speedSensor ? parseFloat(speedSensor.state) : 0;
                      const powerKw = chargerPower ? parseFloat(chargerPower.state) : 0;
                      const addedKwh = energyAdded ? parseFloat(energyAdded.state) : 0;
                      const battery = battLevel ? parseInt(battLevel.state, 10) : NaN;
                      const battPct = isNaN(battery) ? 0 : Math.min(100, Math.max(0, battery));
                      const battColor = battPct >= 20 ? "green" : battPct >= 11 ? "yellow" : "red";
                      const ratedKm = rangeRated ? parseFloat(rangeRated.state) : NaN;
                      const estKm = rangeEst ? parseFloat(rangeEst.state) : NaN;
                      const idealKm = rangeIdeal ? parseFloat(rangeIdeal.state) : NaN;
                      const insideC = insideTemp ? parseFloat(insideTemp.state) : NaN;
                      const outsideC = outsideTemp ? parseFloat(outsideTemp.state) : NaN;
                      const limitPct = chargeLimit ? parseInt(chargeLimit.state, 10) : NaN;
                      const statusLabel = statusText === "disconnected" ? "Disconnected" : statusText === "stopped" ? "Stopped" : statusText === "complete" ? "Complete" : statusText.charAt(0).toUpperCase() + statusText.slice(1);
                      const chargeEnabled = chargeSwitch?.state === "on";
                      return (
                        <div className={`rounded-xl border-2 p-3 ${
                          isCharging
                            ? "border-green-400/30 bg-gradient-to-br from-green-500/[0.08] via-emerald-500/[0.04] to-transparent shadow-[0_0_24px_rgba(74,222,128,0.08)]"
                            : isDriving
                              ? "border-blue-400/25 bg-gradient-to-br from-blue-500/[0.08] via-cyan-500/[0.04] to-transparent shadow-[0_0_24px_rgba(59,130,246,0.08)]"
                              : "border-white/[0.12] bg-gradient-to-br from-white/[0.06] via-white/[0.03] to-transparent"
                        }`}>
                          <div className="mb-2 flex items-center gap-2">
                            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                              isCharging ? "bg-green-500/20" : isDriving ? "bg-blue-500/20" : "bg-white/[0.08]"
                            }`}>
                              {isDriving ? (
                                <Navigation className="h-4 w-4 text-blue-400 animate-ev-drive-icon" />
                              ) : (
                                <Car className={`h-4 w-4 ${isCharging ? "text-green-400" : "text-white/60"}`} />
                              )}
                            </div>
                            <span className="text-sm font-semibold text-white">Bilskirner</span>

                            {/* Contextual status badge */}
                            {isDriving ? (
                              <span className="flex items-center gap-1 text-blue-400 animate-pulse">
                                <Gauge className="h-3.5 w-3.5" />
                                <span className="text-xs font-bold tabular-nums">{speedKmh > 0 ? `${speedKmh.toFixed(0)} km/h` : shiftVal === "r" ? "Reverse" : shiftVal === "n" ? "Neutral" : "Driving"}</span>
                              </span>
                            ) : isCharging ? (
                              <span className="flex items-center gap-1 animate-pulse text-green-400">
                                <Zap className="h-3.5 w-3.5" />
                                <span className="text-xs font-bold">CHARGING</span>
                              </span>
                            ) : isCableConnected ? (
                              <span className="flex items-center gap-1.5 text-yellow-300/80">
                                <Cable className="h-3.5 w-3.5" />
                                <span className="text-[11px] font-semibold">Plugged In{statusText === "complete" ? " — Complete" : statusText === "stopped" ? " — Idle" : ""}</span>
                              </span>
                            ) : (
                              <span className="flex items-center gap-1.5 text-white/35">
                                <Plug className="h-3.5 w-3.5" />
                                <span className="text-[11px] font-medium">Not Plugged In</span>
                              </span>
                            )}

                            {/* Charge toggle button */}
                            {statusText !== "disconnected" && !isDriving && (
                              <button
                                onClick={() => setEvChargeConfirm(chargeEnabled ? "stop" : "start")}
                                disabled={togglingEntities.has("switch.bilskirner_charge")}
                                className={`ml-auto flex h-7 items-center gap-1.5 rounded-lg px-3 text-[11px] font-bold uppercase tracking-wider transition-all duration-200 active:scale-90 ring-1 ${
                                  chargeEnabled
                                    ? "bg-green-500/20 text-green-400 ring-green-400/25 hover:bg-red-500/20 hover:text-red-400 hover:ring-red-400/25 shadow-[0_0_10px_rgba(74,222,128,0.1)]"
                                    : "bg-yellow-500/15 text-yellow-300 ring-yellow-400/20 hover:bg-yellow-500/25 hover:text-yellow-200 hover:ring-yellow-400/30 shadow-[0_0_10px_rgba(234,179,8,0.08)]"
                                }`}
                                title={chargeEnabled ? "Stop charging" : "Start charging"}
                              >
                                {togglingEntities.has("switch.bilskirner_charge") ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : chargeEnabled ? (
                                  <><Square className="h-3 w-3 fill-current" /> Stop Charge</>
                                ) : (
                                  <><Play className="h-3 w-3 fill-current" /> Start Charge</>
                                )}
                              </button>
                            )}
                          </div>

                          {/* Driving road animation */}
                          {isDriving && (
                            <div className="mb-2 relative h-6 rounded-lg overflow-hidden bg-slate-800/50">
                              <div className="absolute inset-0 flex items-center animate-ev-road">
                                <div className="flex gap-6 w-[200%]">
                                  {Array.from({ length: 20 }).map((_, i) => (
                                    <div key={i} className="h-[2px] w-8 flex-shrink-0 rounded-full bg-yellow-400/40" />
                                  ))}
                                </div>
                              </div>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-300/70">On the Road</span>
                              </div>
                            </div>
                          )}

                          <div className="flex items-stretch gap-3">
                            {/* LEFT — Battery visual + charge info */}
                            <div className="flex flex-col items-center gap-2">
                              <div className="relative flex-shrink-0" style={{ width: 82, height: 42 }}>
                                <div className={`absolute inset-0 rounded-lg border-2 overflow-hidden ${
                                  isCharging ? "border-green-400/60 shadow-[0_0_10px_rgba(74,222,128,0.2)]" : battColor === "green" ? "border-green-400/40" : battColor === "yellow" ? "border-yellow-400/40" : "border-red-400/50"
                                }`}>
                                  <div
                                    className={`absolute bottom-0 left-0 top-0 transition-all duration-1000 ${
                                      isCharging
                                        ? "bg-gradient-to-r from-green-500/60 to-green-400/40"
                                        : battColor === "green"
                                          ? "bg-gradient-to-r from-green-500/50 to-green-400/30"
                                          : battColor === "yellow"
                                            ? "bg-gradient-to-r from-yellow-500/50 to-yellow-400/30"
                                            : "bg-gradient-to-r from-red-500/60 to-red-400/40"
                                    }`}
                                    style={{ width: `${battPct}%` }}
                                  >
                                    {isCharging && (
                                      <div className="absolute inset-0 overflow-hidden">
                                        <div className="animate-battery-wave absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className={`absolute right-[-6px] top-[13px] h-[22px] w-[5px] rounded-r-sm ${
                                  isCharging ? "bg-green-400/50" : battColor === "green" ? "bg-green-400/30" : battColor === "yellow" ? "bg-yellow-400/30" : "bg-red-400/40"
                                }`} />
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className={`text-base font-bold tabular-nums ${
                                    isCharging ? "text-green-300 animate-battery-pulse" : battColor === "green" ? "text-green-300" : battColor === "yellow" ? "text-yellow-300" : "text-red-300"
                                  }`}>
                                    {isNaN(battery) ? "—" : `${battery}%`}
                                  </span>
                                </div>
                                {isCharging && (
                                  <div className="absolute -right-2 -top-2">
                                    <Zap className="h-4 w-4 text-green-400 animate-pulse drop-shadow-[0_0_4px_rgba(74,222,128,0.6)]" />
                                  </div>
                                )}
                                {!isNaN(limitPct) && (
                                  <div
                                    className="absolute top-0 bottom-0 w-px border-l border-dashed border-white/30"
                                    style={{ left: `${Math.min(100, limitPct)}%` }}
                                    title={`Charge limit: ${limitPct}%`}
                                  />
                                )}
                              </div>
                              {addedKwh > 0 && (
                                <span className="text-[10px] tabular-nums text-white/45">+{addedKwh.toFixed(1)} kWh added</span>
                              )}
                            </div>

                            {/* Vertical divider */}
                            <div className="w-px self-stretch bg-gradient-to-b from-transparent via-white/[0.10] to-transparent" />

                            {/* MIDDLE — Status + temps */}
                            <div className="flex flex-1 flex-col items-center justify-center gap-2 min-w-0">
                              {isCharging ? (
                                <span className="flex items-center gap-1.5 rounded-full bg-green-500/15 px-2.5 py-1 text-xs font-semibold text-green-400 ring-1 ring-green-400/20 animate-ev-glow">
                                  <BatteryCharging className="h-3.5 w-3.5 animate-ev-charge-icon" />
                                  {powerKw} kW
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
                              {(!isNaN(insideC) || !isNaN(outsideC)) && (
                                <div className="flex flex-col items-center gap-0.5 text-[11px] text-white/45">
                                  {!isNaN(insideC) && (
                                    <span className="flex items-center gap-1">
                                      <Thermometer className="h-3 w-3" /> {insideC.toFixed(0)}°C inside
                                    </span>
                                  )}
                                  {!isNaN(outsideC) && (
                                    <span className="flex items-center gap-1">
                                      <ThermometerSnowflake className="h-3 w-3" /> {outsideC.toFixed(0)}°C outside
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Vertical divider */}
                            <div className="w-px self-stretch bg-gradient-to-b from-transparent via-white/[0.10] to-transparent" />

                            {/* RIGHT — Range data stacked */}
                            <div className="flex flex-col justify-center gap-1.5 min-w-[80px]">
                              <p className="text-[9px] font-bold uppercase tracking-widest text-white/35 text-center">Range</p>
                              {!isNaN(estKm) && (
                                <div className="flex items-baseline justify-between gap-2">
                                  <span className="text-[10px] text-white/40">Est</span>
                                  <span className="text-xs font-semibold tabular-nums text-white/80">{estKm.toFixed(0)} km</span>
                                </div>
                              )}
                              {!isNaN(ratedKm) && (
                                <div className="flex items-baseline justify-between gap-2">
                                  <span className="text-[10px] text-white/40">Rated</span>
                                  <span className="text-xs font-semibold tabular-nums text-white/80">{ratedKm.toFixed(0)} km</span>
                                </div>
                              )}
                              {!isNaN(idealKm) && (
                                <div className="flex items-baseline justify-between gap-2">
                                  <span className="text-[10px] text-white/40">Ideal</span>
                                  <span className="text-xs tabular-nums text-white/55">{idealKm.toFixed(0)} km</span>
                                </div>
                              )}
                            </div>
                          </div>
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
                        <div className="rounded-lg bg-white/[0.03] p-2.5">
                          <div className="mb-2 flex items-center justify-between">
                            <p className="text-xs font-semibold uppercase tracking-wider text-white/50">
                              <BarChart3 className="mr-1 inline h-3 w-3 -translate-y-px" />
                              Daily Consumption
                            </p>
                            <span className="text-xs tabular-nums text-white/40">avg {avgKwh.toFixed(1)} kWh</span>
                          </div>

                          {/* Bar chart area */}
                          <div className="relative flex items-end gap-1.5" style={{ height: 72 }}>
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
                                  <div className="relative flex w-full items-end justify-center" style={{ height: 48 }}>
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
                    </div>

                    {/* Today's usage + Live power side by side */}
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {/* Today's usage per device */}
                    {deviceToday.length > 0 && (
                      <div className="rounded-lg bg-white/[0.03] p-2.5">
                        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-white/50">
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
                    <div className="rounded-lg bg-white/[0.03] p-2.5">
                      <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-white/50">
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
                  </>
                )}
              </GlassCard>
            </section>

            {/* — PRINTER + INFRASTRUCTURE (side by side) — */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <section>
              <SectionLabel icon={Printer} iconColor="text-orange-400">
                Canon Printer
              </SectionLabel>
              <GlassCard className="p-3">
                {loading ? (
                  <div className="flex items-center gap-2 text-xs text-white/45">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Loading…
                  </div>
                ) : (
                  <>
                    {/* Printer status */}
                    {(() => {
                      const tracker = haStates.find((e) => e.entity_id === "device_tracker.cannon");
                      const statusSensor = haStates.find((e) => e.entity_id === "sensor.cnmf633c_635c");
                      const isOnline = tracker?.state === "home";
                      const printerState = statusSensor?.state ?? "unknown";
                      const statusConfig: Record<string, { label: string; color: string; dot: string; bg: string; pulse?: boolean }> = {
                        printing: { label: "Printing", color: "text-green-400", dot: "fill-green-400 text-green-400", bg: "bg-green-500/10 ring-1 ring-green-400/20", pulse: true },
                        idle: { label: "Idle / Sleep", color: "text-amber-300", dot: "fill-amber-400 text-amber-400", bg: "bg-amber-500/10 ring-1 ring-amber-400/15" },
                        stopped: { label: "Stopped", color: "text-red-400", dot: "fill-red-400 text-red-400", bg: "bg-red-500/10 ring-1 ring-red-400/15" },
                      };
                      const cfg = !isOnline
                        ? { label: "Offline", color: "text-red-400", dot: "fill-red-400/50 text-red-400/50", bg: "bg-white/[0.04]" }
                        : statusConfig[printerState] ?? { label: printerState, color: "text-white/60", dot: "fill-white/40 text-white/40", bg: "bg-white/[0.04]" };
                      return (
                        <div className={`mb-3 flex items-center gap-2 rounded-lg px-2.5 py-1.5 ${cfg.bg}`}>
                          <Circle className={`h-2 w-2 shrink-0 ${cfg.dot} ${cfg.pulse ? "animate-pulse" : ""}`} />
                          <span className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
                          {printerState === "printing" && <Loader2 className="ml-auto h-3 w-3 animate-spin text-green-400/60" />}
                        </div>
                      );
                    })()}

                    {/* Toner bars — colorful with glow */}
                    <div className="space-y-2.5">
                      {TONER_SENSORS.map((toner) => {
                        const entity = haStates.find((e) => e.entity_id === toner.entity_id);
                        const level = entity ? parseInt(entity.state, 10) : NaN;
                        const pct = isNaN(level) ? 0 : Math.min(100, Math.max(0, level));
                        const isLow = !isNaN(level) && level <= 15;
                        return (
                          <div key={toner.entity_id}>
                            <div className="mb-1 flex items-center justify-between text-xs">
                              <div className="flex items-center gap-1.5">
                                <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: toner.color, boxShadow: `0 0 6px ${toner.color}60` }} />
                                <span className="font-medium text-white/70">{toner.name}</span>
                              </div>
                              <span className={`tabular-nums font-semibold ${isLow ? "text-red-300 animate-pulse" : "text-white/60"}`}>
                                {isNaN(level) ? "N/A" : `${level}%`}
                              </span>
                            </div>
                            <div className="relative h-2.5 overflow-hidden rounded-full bg-white/[0.06]">
                              <div
                                className="h-full rounded-full transition-all duration-1000 ease-out"
                                style={{
                                  width: `${pct}%`,
                                  background: `linear-gradient(90deg, ${toner.color}90, ${toner.color}50)`,
                                  boxShadow: isLow ? `0 0 8px ${toner.color}40, inset 0 1px 0 rgba(255,255,255,0.15)` : `0 0 4px ${toner.color}20, inset 0 1px 0 rgba(255,255,255,0.1)`,
                                }}
                              />
                              {/* Shimmer overlay */}
                              <div className="absolute inset-0 overflow-hidden rounded-full">
                                <div
                                  className="h-full w-[200%] animate-[toner-shimmer_3s_ease-in-out_infinite]"
                                  style={{ background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)" }}
                                />
                              </div>
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
              <GlassCard className="p-3">
                {loading ? (
                  <div className="flex items-center gap-2 text-xs text-white/45">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Loading…
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                    {INFRA_DEVICES.map((device) => {
                      const tracker = haStates.find((e) => e.entity_id === device.entity_id);
                      const isOnline = tracker?.state === "home";
                      const uptimeEntity = device.uptimeEntity
                        ? haStates.find((e) => e.entity_id === device.uptimeEntity)
                        : null;

                      let uptimeStr = "";
                      let bootTime = NaN;
                      if (uptimeEntity && uptimeEntity.state !== "unavailable" && uptimeEntity.state !== "unknown") {
                        bootTime = new Date(uptimeEntity.state).getTime();
                      } else if (isOnline && tracker?.last_changed) {
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
                        <div key={device.entity_id} className="flex items-center gap-1.5 rounded-md px-1.5 py-1">
                          <Circle className={`h-1.5 w-1.5 shrink-0 ${isOnline ? "fill-green-400 text-green-400" : "fill-red-400 text-red-400"}`} />
                          <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-white/75">{device.name}</span>
                          {uptimeStr && (
                            <span className="text-[10px] tabular-nums text-white/35 shrink-0">{uptimeStr}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
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
                <div className="relative h-32 sm:h-40">
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
          <div className="space-y-3">
          </div>
        </div>

        {/* ——— Footer ——— */}
        <div className="mt-4 flex items-center gap-4 pb-4 text-xs text-white/45">
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

      {/* EV Charge confirmation modal */}
      {evChargeConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setEvChargeConfirm(null)}>
          <div
            className="mx-4 w-full max-w-sm rounded-2xl border border-white/[0.12] bg-slate-900/95 p-6 shadow-2xl backdrop-blur-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                evChargeConfirm === "stop" ? "bg-red-500/20" : "bg-green-500/20"
              }`}>
                {evChargeConfirm === "stop" ? (
                  <Square className={`h-5 w-5 text-red-400 fill-red-400`} />
                ) : (
                  <Play className="h-5 w-5 text-green-400 fill-green-400" />
                )}
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">
                  {evChargeConfirm === "stop" ? "Stop Charging?" : "Start Charging?"}
                </h3>
                <p className="text-xs text-white/50">Bilskirner</p>
              </div>
            </div>
            <p className="mb-5 text-sm text-white/60">
              {evChargeConfirm === "stop"
                ? "This will stop the active charging session. You can restart it later."
                : "This will start a new charging session for Bilskirner."}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setEvChargeConfirm(null)}
                className="flex-1 rounded-lg border border-white/[0.10] bg-white/[0.05] py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/[0.10] hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const action = evChargeConfirm;
                  setEvChargeConfirm(null);
                  callHaService("switch", action === "stop" ? "turn_off" : "turn_on", "switch.bilskirner_charge");
                }}
                className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
                  evChargeConfirm === "stop"
                    ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                    : "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                }`}
              >
                {evChargeConfirm === "stop" ? "Stop Charging" : "Start Charging"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
