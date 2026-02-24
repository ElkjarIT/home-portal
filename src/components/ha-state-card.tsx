"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Activity } from "lucide-react";
import { useEffect, useState } from "react";

interface HaEntity {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
  last_changed: string;
}

interface HaStateCardProps {
  /** Entity IDs to display */
  entities: string[];
}

export function HaStateCard({ entities }: HaStateCardProps) {
  const [states, setStates] = useState<HaEntity[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Fetch initial states from our API proxy
    async function fetchStates() {
      try {
        const res = await fetch("/api/ha/states");
        if (res.ok) {
          const all: HaEntity[] = await res.json();
          setStates(all.filter((e) => entities.includes(e.entity_id)));
          setConnected(true);
        }
      } catch {
        setConnected(false);
      }
    }

    fetchStates();
    // Poll every 30 seconds (WebSocket upgrade can be added later)
    const interval = setInterval(fetchStates, 30_000);
    return () => clearInterval(interval);
  }, [entities]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Home Assistant</CardTitle>
          <Badge variant={connected ? "default" : "destructive"} className="ml-auto text-xs">
            {connected ? "Connected" : "Offline"}
          </Badge>
        </div>
        <CardDescription>Live entity states</CardDescription>
      </CardHeader>
      <CardContent>
        {states.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {connected
              ? "No matching entities found."
              : "Unable to connect to Home Assistant."}
          </p>
        ) : (
          <div className="space-y-3">
            {states.map((entity) => (
              <div
                key={entity.entity_id}
                className="flex items-center justify-between rounded-md border px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {(entity.attributes.friendly_name as string) ??
                      entity.entity_id}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {entity.entity_id}
                  </p>
                </div>
                <Badge
                  variant={
                    entity.state === "on" || entity.state === "home"
                      ? "default"
                      : "secondary"
                  }
                >
                  {entity.state}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
