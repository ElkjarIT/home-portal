"use client";

import { useSession } from "next-auth/react";
import { ServiceCard } from "@/components/service-card";
import { UserNav } from "@/components/user-nav";
import { AppSidebar, MobileSidebarTrigger } from "@/components/app-sidebar";
import { services, categories } from "@/data/services";
import type { Service } from "@/data/services";
import { useEffect, useState } from "react";
import { Lightbulb, LightbulbOff } from "lucide-react";

// Only show non-infra categories on the main page
const mainCategories: Service["category"][] = ["media", "external"];
const categoryOrder: Service["category"][] = ["media", "external"];

// Room light entities to monitor
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

  if (loading) {
    return (
      <div className="grid gap-2 grid-cols-3 sm:grid-cols-4 lg:grid-cols-6">
        {ROOM_LIGHTS.map((r) => (
          <div
            key={r.entity_id}
            className="flex items-center gap-2 rounded-lg border p-3 animate-pulse"
          >
            <div className="h-4 w-4 rounded-full bg-muted" />
            <div className="h-3 w-16 rounded bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-2 grid-cols-3 sm:grid-cols-4 lg:grid-cols-6">
      {ROOM_LIGHTS.map((room) => {
        const state = lights.find((l) => l.entity_id === room.entity_id);
        const isOn = state?.state === "on";
        const isUnavailable = !state || state.state === "unavailable";
        return (
          <div
            key={room.entity_id}
            className={`flex items-center gap-2 rounded-lg border p-3 transition-colors ${
              isOn
                ? "border-yellow-400/50 bg-yellow-50 dark:bg-yellow-950/20"
                : "bg-card"
            } ${isUnavailable ? "opacity-40" : ""}`}
          >
            {isOn ? (
              <Lightbulb className="h-4 w-4 text-yellow-500 flex-shrink-0" />
            ) : (
              <LightbulbOff className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            )}
            <span className="text-xs font-medium truncate">{room.name}</span>
          </div>
        );
      })}
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
          {/* Welcome */}
          <div className="mb-4">
            <h2 className="text-xl font-bold tracking-tight">
              Welcome{session?.user?.name ? `, ${session.user.name.split(" ")[0]}` : ""}
            </h2>
            <p className="text-sm text-muted-foreground">
              Quick access to your home services.
            </p>
          </div>

          {/* Service cards by category */}
          {sortedCategories.map(([category, items]) => (
            <section key={category} className="mb-4">
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {categories[category as Service["category"]] ?? category}
              </h3>
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {items.map((service) => (
                  <ServiceCard key={service.name} service={service} />
                ))}
              </div>
            </section>
          ))}

          {/* Lights overview */}
          {session && (
            <section className="mb-4">
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Lights
              </h3>
              <LightsOverview />
            </section>
          )}

          {/* Home Assistant Dashboard */}
          {session && (
            <section className="mb-4">
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Home Assistant
              </h3>
              <div className="rounded-lg border overflow-hidden" style={{ height: "600px" }}>
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
