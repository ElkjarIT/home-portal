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
              <p className="text-sm text-white/50">
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
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/20">
                        <ImageIcon className="h-4 w-4 text-blue-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-medium text-white">Immich</span>
                        {immichLoading ? (
                          <p className="text-[11px] text-white/30">Loading…</p>
                        ) : immichStats ? (
                          <p className="text-[11px] text-white/40">
                            {immichStats.photos.toLocaleString()} photos · {immichStats.videos.toLocaleString()} videos
                          </p>
                        ) : (
                          <p className="text-[11px] text-white/30">Photo & video library</p>
                        )}
                      </div>
                      {immichStorage && (
                        <span className="text-[11px] tabular-nums text-white/40">
                          {immichStorage.diskUsagePercentage.toFixed(0)}%
                        </span>
                      )}
                      <ChevronRight className="h-4 w-4 shrink-0 text-white/30" />
                    </div>
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

            {/* — ENERGY MONITORING — */}
            <section>
              <SectionLabel icon={Zap} iconColor="text-yellow-400">
                Energy Monitoring
              </SectionLabel>
              <GlassCard className="p-4">
                {loading && energyLoading ? (
                  <div className="flex items-center gap-2 text-xs text-white/30">
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
                            <Zap className="h-4 w-4 text-yellow-400" />
                            <span className="text-2xl font-bold tabular-nums text-white">
                              {isNaN(watts) ? "—" : watts.toLocaleString()}
                            </span>
                            <span className="text-sm text-white/40">W</span>
                            <span className="ml-auto text-xs tabular-nums text-white/30">
                              Today: {energyTodayKwh.toFixed(1)} kWh
                            </span>
                          </div>
                          {!isNaN(l1) && (
                            <div className="mt-1 flex gap-3 text-[10px] text-white/30">
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
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/35">
                              <BarChart3 className="mr-1 inline h-3 w-3 -translate-y-px" />
                              Daily Consumption
                            </p>
                            <span className="text-[10px] tabular-nums text-white/25">avg {avgKwh.toFixed(1)} kWh</span>
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
                                    className={`text-[11px] font-semibold tabular-nums ${
                                      isToday ? "text-yellow-300" : "text-white/50"
                                    }`}
                                  >
                                    {d.kwh.toFixed(1)}
                                  </span>

                                  {/* Bar */}
                                  <div className="relative flex w-full items-end justify-center" style={{ height: 64 }}>
                                    <div
                                      className={`w-full rounded-md transition-all duration-500 ${
                                        isToday
                                          ? "bg-gradient-to-t from-yellow-500/70 to-yellow-300/50 shadow-[0_0_12px_rgba(250,204,21,0.2)] ring-1 ring-yellow-400/30"
                                          : "bg-white/[0.08] hover:bg-white/[0.12]"
                                      }`}
                                      style={{ height: `${Math.max(6, pct)}%` }}
                                    />
                                  </div>

                                  {/* Day label */}
                                  <span
                                    className={`text-[10px] font-medium ${
                                      isToday ? "text-yellow-300" : "text-white/30"
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

                    {/* Today's usage per device */}
                    {deviceToday.length > 0 && (
                      <div className="mb-4 rounded-xl bg-white/[0.03] p-3">
                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-white/35">
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
                                  <span className="text-xs text-white/60">{dev.name}</span>
                                  <span className="text-xs font-semibold tabular-nums text-white/70">{dev.kwh.toFixed(2)} kWh</span>
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
                    <div className="border-t border-white/[0.06] pt-3">
                      <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/35">
                        <Plug className="h-3 w-3" /> Live Power
                      </p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
                        {ENERGY_APPLIANCES.map((dev) => {
                          const entity = haStates.find((e) => e.entity_id === dev.entity_id);
                          const w = entity ? parseFloat(entity.state) : NaN;
                          const isActive = !isNaN(w) && w > 5;
                          return (
                            <div key={dev.entity_id} className="flex items-center justify-between rounded-lg px-2 py-1">
                              <span className={`text-xs truncate ${isActive ? "text-white/70" : "text-white/30"}`}>{dev.name}</span>
                              <span className={`text-xs tabular-nums ${isActive ? "text-yellow-300" : "text-white/25"}`}>
                                {isNaN(w) ? "—" : `${Math.round(w)}W`}
                              </span>
                            </div>
                          );
                        })}
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
                      return (
                        <div className="mt-3 border-t border-white/[0.06] pt-3">
                          <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/35">
                            <Car className="h-3 w-3" /> EV Charger — Bilskirner
                          </p>
                          <div className="flex items-center gap-3">
                            {isCharging ? (
                              <span className="flex items-center gap-1.5 rounded-full bg-green-500/15 px-2.5 py-1 text-xs font-medium text-green-400">
                                <BatteryCharging className="h-3.5 w-3.5 animate-pulse" />
                                Charging — {powerKw} kW
                              </span>
                            ) : (
                              <span className="flex items-center gap-1.5 rounded-full bg-white/[0.05] px-2.5 py-1 text-xs text-white/40">
                                <Circle className="h-2 w-2 fill-white/20 text-white/20" />
                                {statusText === "disconnected" ? "Disconnected" : statusText === "stopped" ? "Stopped" : statusText === "complete" ? "Complete" : statusText.charAt(0).toUpperCase() + statusText.slice(1)}
                              </span>
                            )}
                            {!isNaN(battery) && (
                              <span className="text-xs tabular-nums text-white/40">
                                Battery: {battery}%
                              </span>
                            )}
                            {addedKwh > 0 && (
                              <span className="text-xs tabular-nums text-white/30">
                                +{addedKwh.toFixed(1)} kWh
                              </span>
                            )}
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
                  <div className="flex items-center gap-2 text-xs text-white/30">
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
                          <span className="text-xs font-medium text-white/60">
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
                              <span className="font-medium text-white/60">
                                {toner.name}
                              </span>
                              <span className="tabular-nums text-white/40">
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
                  <div className="flex items-center gap-2 p-4 text-xs text-white/30">
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
                        className="flex items-center gap-3 px-4 py-3"
                      >
                        <Circle
                          className={`h-2.5 w-2.5 shrink-0 ${
                            isOnline
                              ? "fill-green-400 text-green-400"
                              : "fill-red-400 text-red-400"
                          }`}
                        />
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-white/70">
                          {device.name}
                        </span>
                        {uptimeStr && (
                          <span className="flex items-center gap-1 text-[11px] tabular-nums text-white/35">
                            <Clock className="h-3 w-3" />
                            {uptimeStr}
                          </span>
                        )}
                        <span
                          className={`text-[11px] font-medium ${
                            isOnline ? "text-green-400/70" : "text-red-400/70"
                          }`}
                        >
                          {isOnline ? "Online" : "Offline"}
                        </span>
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
