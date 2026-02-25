"use client";

import { useSession } from "next-auth/react";
import { ServiceCard } from "@/components/service-card";
import { UserNav } from "@/components/user-nav";
import { AppSidebar, MobileSidebarTrigger } from "@/components/app-sidebar";
import { services, categories } from "@/data/services";
import type { Service } from "@/data/services";
import { useEffect, useState } from "react";
import {
  Lightbulb,
  LightbulbOff,
  Sun,
  Image as ImageIcon,
  Globe2,
  Home as HomeIcon,
} from "lucide-react";

// Only show non-infra categories on the main page
const mainCategories: Service["category"][] = ["media", "external"];
const categoryOrder: Service["category"][] = ["media", "external"];

// Category icon + color for section headers
const categoryMeta: Record<
  string,
  { icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  media: { icon: ImageIcon, color: "text-blue-500" },
  external: { icon: Globe2, color: "text-violet-500" },
};

// Room light entities to monitor
const ROOM_LIGHTS = [
  { entity_id: "light.stue", name: "Stue", icon: "sofa" },
  { entity_id: "light.kokken", name: "Køkken", icon: "cooking" },
  { entity_id: "light.spisestue", name: "Spisestue", icon: "dining" },
  { entity_id: "light.sovevaerelse", name: "Soveværelse", icon: "bed" },
  { entity_id: "light.entre", name: "Entré", icon: "door" },
  { entity_id: "light.bryggers", name: "Bryggers", icon: "utility" },
  { entity_id: "light.thor", name: "Thor", icon: "child" },
  { entity_id: "light.freja", name: "Freja", icon: "child" },
  { entity_id: "light.walk_in", name: "Walk-in", icon: "closet" },
  { entity_id: "light.krybekaelder", name: "Krybekælder", icon: "basement" },
  { entity_id: "light.udendors", name: "Udendørs", icon: "outdoor" },
  { entity_id: "light.trappe", name: "Trappe", icon: "stairs" },
];

interface LightState {
  entity_id: string;
  state: string;
}

function LightsOverview() {
  const [lights, setLights] = useState<LightState[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLights() {
      try {
        const res = await fetch("/api/ha/states");
        if (res.ok) {
          const all: LightState[] = await res.json();
          const roomIds = ROOM_LIGHTS.map((r) => r.entity_id);
          setLights(all.filter((e) => roomIds.includes(e.entity_id)));
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchLights();
    const interval = setInterval(fetchLights, 15_000);
    return () => clearInterval(interval);
  }, []);

  const onCount = lights.filter((l) => l.state === "on").length;

  if (loading) {
    return (
      <div className="grid gap-2.5 grid-cols-3 sm:grid-cols-4 lg:grid-cols-6">
        {ROOM_LIGHTS.map((r) => (
          <div
            key={r.entity_id}
            className="flex flex-col items-center gap-2 rounded-xl border p-3 animate-pulse"
          >
            <div className="h-8 w-8 rounded-full bg-muted" />
            <div className="h-3 w-14 rounded bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <span className="text-xs text-muted-foreground">
          {onCount} of {ROOM_LIGHTS.length} lights on
        </span>
        {onCount > 0 && (
          <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
        )}
      </div>
      <div className="grid gap-2.5 grid-cols-3 sm:grid-cols-4 lg:grid-cols-6">
        {ROOM_LIGHTS.map((room) => {
          const state = lights.find((l) => l.entity_id === room.entity_id);
          const isOn = state?.state === "on";
          const isUnavailable = !state || state.state === "unavailable";
          return (
            <div
              key={room.entity_id}
              className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-all duration-200 ${
                isOn
                  ? "border-amber-400/60 bg-gradient-to-b from-amber-50 to-yellow-50/50 shadow-sm shadow-amber-200/30 dark:from-amber-950/30 dark:to-yellow-950/10 dark:shadow-amber-900/20"
                  : "bg-card hover:bg-accent/50"
              } ${isUnavailable ? "opacity-30" : ""}`}
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                  isOn
                    ? "bg-amber-400/20 dark:bg-amber-500/20"
                    : "bg-muted/50"
                }`}
              >
                {isOn ? (
                  <Lightbulb className="h-4.5 w-4.5 text-amber-500 drop-shadow-sm" />
                ) : (
                  <LightbulbOff className="h-4.5 w-4.5 text-muted-foreground/60" />
                )}
              </div>
              <span
                className={`text-xs font-medium truncate max-w-full ${
                  isOn ? "text-amber-700 dark:text-amber-300" : ""
                }`}
              >
                {room.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: session } = useSession();

  // Filter to only non-infra services for main page
  const mainServices = services.filter((s) =>
    mainCategories.includes(s.category)
  );

  const grouped = mainServices.reduce(
    (acc, service) => {
      if (!acc[service.category]) acc[service.category] = [];
      acc[service.category].push(service);
      return acc;
    },
    {} as Record<string, Service[]>
  );

  const sortedCategories = Object.entries(grouped).sort(([a], [b]) => {
    const ai = categoryOrder.indexOf(a as Service["category"]);
    const bi = categoryOrder.indexOf(b as Service["category"]);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />

      {/* Main container with sidebar offset */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <MobileSidebarTrigger />
              <h1 className="text-lg font-semibold tracking-tight lg:hidden">
                Home Portal
              </h1>
            </div>
            <UserNav />
          </div>
        </header>

        {/* Main */}
        <main className="px-4 py-4 sm:px-6 lg:px-8">
          {/* Welcome banner */}
          <div className="mb-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white shadow-lg shadow-blue-500/20">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                <HomeIcon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight">
                  Welcome{session?.user?.name ? `, ${session.user.name.split(" ")[0]}` : ""}
                </h2>
                <p className="text-sm text-blue-100">
                  Quick access to your home services
                </p>
              </div>
            </div>
          </div>

          {/* Service cards by category */}
          {sortedCategories.map(([category, items]) => {
            const meta = categoryMeta[category];
            const CatIcon = meta?.icon;
            return (
              <section key={category} className="mb-5">
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  {CatIcon && (
                    <CatIcon className={`h-4 w-4 ${meta.color}`} />
                  )}
                  {categories[category as Service["category"]] ?? category}
                </h3>
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {items.map((service) => (
                    <ServiceCard key={service.name} service={service} />
                  ))}
                </div>
              </section>
            );
          })}

          {/* Lights overview */}
          {session && (
            <section className="mb-5">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                <Sun className="h-4 w-4 text-amber-500" />
                Lights
              </h3>
              <LightsOverview />
            </section>
          )}

          {/* Home Assistant Dashboard */}
          {session && (
            <section className="mb-5">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                <HomeIcon className="h-4 w-4 text-sky-500" />
                Home Assistant
              </h3>
              <div className="rounded-xl border-2 border-sky-200/50 dark:border-sky-800/30 overflow-hidden shadow-sm" style={{ height: "600px" }}>
                <iframe
                  src="https://ha.aser.dk/lovelace/0"
                  className="w-full h-full border-0"
                  title="Home Assistant Dashboard"
                  allow="fullscreen"
                />
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
