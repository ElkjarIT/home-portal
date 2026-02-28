"use client";

import { useSession } from "next-auth/react";
import { UserNav } from "@/components/user-nav";
import { AppSidebar, MobileSidebarTrigger } from "@/components/app-sidebar";
import { ServiceCard } from "@/components/service-card";
import { SystemStatusCard } from "@/components/system-status-card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Shield,
  Container,
  RefreshCw,
  KeyRound,
  Server as ServerIcon,
  ShieldCheck,
  Activity,
  Wrench,
  Globe2,
  Vault,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { services, categories } from "@/data/services";
import type { Service } from "@/data/services";

// Categories to show on admin page
const adminCategories: Service["category"][] = ["infra", "external"];

// Category icon + color for section headers
const categoryMeta: Record<
  string,
  { icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  infra: { icon: Wrench, color: "text-emerald-500" },
  external: { icon: Globe2, color: "text-violet-500" },
};

export default function AdminPage() {
  const { data: session } = useSession();

  const adminServices = services.filter((s) =>
    adminCategories.includes(s.category)
  );

  const grouped = adminServices.reduce(
    (acc, service) => {
      if (!acc[service.category]) acc[service.category] = [];
      acc[service.category].push(service);
      return acc;
    },
    {} as Record<string, Service[]>
  );

  const sortedCategories = Object.entries(grouped).sort(([a], [b]) => {
    const ai = adminCategories.indexOf(a as Service["category"]);
    const bi = adminCategories.indexOf(b as Service["category"]);
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
              <Shield className="h-5 w-5 text-red-500" />
              <h1 className="text-xl font-semibold tracking-tight">
                Admin Panel
              </h1>
              <Badge className="bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 border-red-200 dark:border-red-800/40">
                Admin
              </Badge>
            </div>
            <UserNav />
          </div>
        </header>

        {/* Main */}
        <main className="px-4 py-6 sm:px-6 lg:px-8">
          {/* Infrastructure & External service cards */}
          {sortedCategories.map(([category, items]) => {
            const meta = categoryMeta[category];
            const CatIcon = meta?.icon;
            return (
              <section key={category} className="mb-6">
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

          <Separator className="mb-6" />

          {/* System Status */}
          <section className="mb-6">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <Activity className="h-4 w-4 text-emerald-500" />
              System Status
            </h3>
            <SystemStatusCard />
          </section>

          <Separator className="mb-6" />

          {/* Vault */}
          <section className="mb-6">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <Vault className="h-4 w-4 text-amber-500" />
              Vault
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Card className="border-l-3 border-l-amber-500 hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-100 dark:bg-amber-950/40">
                      <Vault className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <CardTitle className="text-lg">Infisical</CardTitle>
                  </div>
                  <CardDescription>
                    Secrets management — runtime injection for all services
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="https://infisical.aser.dk" target="_blank" rel="noopener noreferrer">
                    <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white">
                      <ExternalLink className="mr-2 h-3.5 w-3.5" />
                      Open Vault
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </section>

          <Separator className="mb-6" />

          {/* Quick actions */}
          <section className="mb-6">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <Wrench className="h-4 w-4 text-orange-500" />
              Quick Actions
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Root CA deployment */}
              <Card className="border-l-3 border-l-teal-500 hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-teal-100 dark:bg-teal-950/40">
                      <ShieldCheck className="h-4.5 w-4.5 text-teal-600 dark:text-teal-400" />
                    </div>
                    <CardTitle className="text-lg">Root CA</CardTitle>
                  </div>
                  <CardDescription>
                    Install the step-ca root certificate on network devices
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/setup">
                    <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white">
                      Setup Instructions
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* iCloudPD Re-auth */}
              <Card className="border-l-3 border-l-blue-500 hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-950/40">
                      <KeyRound className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <CardTitle className="text-lg">iCloudPD Auth</CardTitle>
                  </div>
                  <CardDescription>
                    Trigger iCloud re-authentication for expired cookies
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex gap-2">
                  <Button size="sm" variant="outline" disabled className="border-blue-300 dark:border-blue-700">
                    <RefreshCw className="mr-2 h-3.5 w-3.5 text-blue-500" />
                    Steffen
                  </Button>
                  <Button size="sm" variant="outline" disabled className="border-blue-300 dark:border-blue-700">
                    <RefreshCw className="mr-2 h-3.5 w-3.5 text-blue-500" />
                    Violeta
                  </Button>
                </CardContent>
              </Card>

              {/* Container Management */}
              <Card className="border-l-3 border-l-cyan-500 hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-cyan-100 dark:bg-cyan-950/40">
                      <Container className="h-4.5 w-4.5 text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <CardTitle className="text-lg">Containers</CardTitle>
                  </div>
                  <CardDescription>
                    View and manage Docker containers on immich01
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button size="sm" variant="outline" disabled className="border-cyan-300 dark:border-cyan-700">
                    View Containers
                  </Button>
                </CardContent>
              </Card>

              {/* Proxmox */}
              <Card className="border-l-3 border-l-orange-500 hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-orange-100 dark:bg-orange-950/40">
                      <ServerIcon className="h-4.5 w-4.5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <CardTitle className="text-lg">Proxmox</CardTitle>
                  </div>
                  <CardDescription>
                    VM and storage overview from the Proxmox API
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button size="sm" variant="outline" disabled className="border-orange-300 dark:border-orange-700">
                    View Cluster
                  </Button>
                </CardContent>
              </Card>
            </div>
          </section>

          <Separator className="mb-6" />

          {/* Session info */}
          <section>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Session Info
            </h3>
            <Card>
              <CardContent className="pt-6">
                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="font-medium text-muted-foreground">User</dt>
                    <dd>{session?.user?.name ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-muted-foreground">Email</dt>
                    <dd>{session?.user?.email ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-muted-foreground">Role</dt>
                    <dd>
                      <Badge variant="default">Admin</Badge>
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-muted-foreground">
                      User ID
                    </dt>
                    <dd className="font-mono text-xs">
                      {session?.user?.id ?? "—"}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </section>
        </main>
      </div>
    </div>
  );
}
