"use client";

import { useSession } from "next-auth/react";
import { ServiceCard } from "@/components/service-card";
import { SystemStatusCard } from "@/components/system-status-card";
import { UserNav } from "@/components/user-nav";
import { services, categories } from "@/data/services";
import type { Service } from "@/data/services";

// Category display order
const categoryOrder: Service["category"][] = [
  "media",
  "infra",
  "external",
  "monitoring",
  "tools",
];

export default function DashboardPage() {
  const { data: session } = useSession();

  // Show all services — no admin filtering
  const grouped = services.reduce(
    (acc, service) => {
      if (!acc[service.category]) acc[service.category] = [];
      acc[service.category].push(service);
      return acc;
    },
    {} as Record<string, Service[]>
  );

  // Sort categories in defined order
  const sortedCategories = Object.entries(grouped).sort(([a], [b]) => {
    const ai = categoryOrder.indexOf(a as Service["category"]);
    const bi = categoryOrder.indexOf(b as Service["category"]);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <h1 className="text-lg font-semibold tracking-tight">
            Home Portal
          </h1>
          <UserNav />
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
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

        {/* System status — compact row at the bottom */}
        {session && (
          <section className="mt-6">
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              System Status
            </h3>
            <SystemStatusCard />
          </section>
        )}
      </main>
    </div>
  );
}
