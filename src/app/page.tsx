"use client";

import { useSession } from "next-auth/react";
import { ServiceCard } from "@/components/service-card";
import { HaStateCard } from "@/components/ha-state-card";
import { SystemStatusCard } from "@/components/system-status-card";
import { UserNav } from "@/components/user-nav";
import { Separator } from "@/components/ui/separator";
import { services, categories } from "@/data/services";
import type { Service } from "@/data/services";

// Customize these entity IDs to match your HA setup
const watchEntities = [
  "sensor.proxmox_cpu_usage",
  "sensor.proxmox_memory_usage",
  "binary_sensor.iscsi_target",
  "sensor.immich_server_status",
];

export default function DashboardPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.isAdmin ?? false;

  // Filter services: hide admin-only from non-admins
  const visibleServices = services.filter(
    (s) => !s.adminOnly || isAdmin
  );

  const grouped = visibleServices.reduce(
    (acc, service) => {
      if (!acc[service.category]) acc[service.category] = [];
      acc[service.category].push(service);
      return acc;
    },
    {} as Record<string, Service[]>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight">
              Home Portal
            </h1>
          </div>
          <UserNav />
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold tracking-tight">
            Welcome{session?.user?.name ? `, ${session.user.name.split(" ")[0]}` : ""}
          </h2>
          <p className="text-muted-foreground">
            Quick access to your home services and live system status.
          </p>
        </div>

        {/* Status cards row */}
        <div className="mb-8 grid gap-6 md:grid-cols-2">
          <HaStateCard entities={watchEntities} />
          <SystemStatusCard />
        </div>

        <Separator className="mb-8" />

        {/* Service cards by category */}
        {Object.entries(grouped).map(([category, items]) => (
          <section key={category} className="mb-8">
            <h3 className="mb-4 text-lg font-semibold">
              {categories[category as Service["category"]] ?? category}
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((service) => (
                <ServiceCard key={service.name} service={service} />
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
