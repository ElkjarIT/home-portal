"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MonitorDot } from "lucide-react";
import { useEffect, useState } from "react";

interface SystemStatus {
  name: string;
  status: "online" | "offline" | "degraded" | "unknown";
  detail?: string;
}

export function SystemStatusCard() {
  const [systems, setSystems] = useState<SystemStatus[]>([]);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch("/api/monitoring/status");
        if (res.ok) {
          setSystems(await res.json());
        }
      } catch {
        setSystems([]);
      }
    }
    fetchStatus();
    const interval = setInterval(fetchStatus, 60_000);
    return () => clearInterval(interval);
  }, []);

  const statusColor: Record<string, string> = {
    online: "default",
    offline: "destructive",
    degraded: "secondary",
    unknown: "outline",
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <MonitorDot className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">System Status</CardTitle>
        </div>
        <CardDescription>Infrastructure health overview</CardDescription>
      </CardHeader>
      <CardContent>
        {systems.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No status data available. Configure the monitoring API.
          </p>
        ) : (
          <div className="space-y-3">
            {systems.map((sys) => (
              <div
                key={sys.name}
                className="flex items-center justify-between rounded-md border px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium">{sys.name}</p>
                  {sys.detail && (
                    <p className="text-xs text-muted-foreground">
                      {sys.detail}
                    </p>
                  )}
                </div>
                <Badge variant={statusColor[sys.status] as "default" | "destructive" | "secondary" | "outline"}>
                  {sys.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
