"use client";

import { useSession } from "next-auth/react";
import { UserNav } from "@/components/user-nav";
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
  ArrowLeft,
  Container,
  RefreshCw,
  KeyRound,
  Server,
} from "lucide-react";
import Link from "next/link";

export default function AdminPage() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" className="mr-1">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <Shield className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-semibold tracking-tight">
              Admin Panel
            </h1>
            <Badge variant="secondary">Admin</Badge>
          </div>
          <UserNav />
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold tracking-tight">
            Administration
          </h2>
          <p className="text-muted-foreground">
            Manage infrastructure, containers, and authentication.
          </p>
        </div>

        {/* Quick actions */}
        <section className="mb-8">
          <h3 className="mb-4 text-lg font-semibold">Quick Actions</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* iCloudPD Re-auth */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <KeyRound className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">iCloudPD Auth</CardTitle>
                </div>
                <CardDescription>
                  Trigger iCloud re-authentication for expired cookies
                </CardDescription>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Button size="sm" variant="outline" disabled>
                  <RefreshCw className="mr-2 h-3.5 w-3.5" />
                  Steffen
                </Button>
                <Button size="sm" variant="outline" disabled>
                  <RefreshCw className="mr-2 h-3.5 w-3.5" />
                  Violeta
                </Button>
              </CardContent>
            </Card>

            {/* Container Management */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Container className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Containers</CardTitle>
                </div>
                <CardDescription>
                  View and manage Docker containers on immich01
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button size="sm" variant="outline" disabled>
                  View Containers
                </Button>
              </CardContent>
            </Card>

            {/* Proxmox */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Server className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Proxmox</CardTitle>
                </div>
                <CardDescription>
                  VM and storage overview from the Proxmox API
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button size="sm" variant="outline" disabled>
                  View Cluster
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator className="mb-8" />

        {/* Session info */}
        <section>
          <h3 className="mb-4 text-lg font-semibold">Session Info</h3>
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
  );
}
