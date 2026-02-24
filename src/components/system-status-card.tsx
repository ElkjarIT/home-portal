"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
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

  const statusDot: Record<string, string> = {
    online: "bg-emerald-500",
    offline: "bg-red-500",
    degraded: "bg-amber-500",
    unknown: "bg-gray-400",
  };

  if (systems.length === 0) {
    return (
      <Card>
        <CardContent className="p-3">
          <p className="text-xs text-muted-foreground">
            No monitoring data available.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {systems.map((sys) => (
            <div key={sys.name} className="flex items-center gap-1.5">
              <span
                className={`h-2 w-2 rounded-full ${statusDot[sys.status] ?? statusDot.unknown}`}
                title={sys.detail ?? sys.status}
              />
              <span className="text-xs font-medium">{sys.name}</span>
              {sys.status !== "online" && (
                <Badge
                  variant={sys.status === "offline" ? "destructive" : "secondary"}
                  className="text-[10px] px-1 py-0 h-4"
                >
                  {sys.status}
                </Badge>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
