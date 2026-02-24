import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

interface SystemStatus {
  name: string;
  status: "online" | "offline" | "degraded" | "unknown";
  detail?: string;
}

async function checkService(
  name: string,
  url: string,
  headers?: Record<string, string>
): Promise<SystemStatus> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url, {
      headers,
      signal: controller.signal,
      // Skip TLS verification for self-signed certs (Proxmox)
    });

    clearTimeout(timeout);

    return {
      name,
      status: res.ok ? "online" : "degraded",
      detail: res.ok ? undefined : `HTTP ${res.status}`,
    };
  } catch {
    return { name, status: "offline", detail: "Unreachable" };
  }
}

export const GET = auth(async function GET(req) {
  if (!req.auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const checks: Promise<SystemStatus>[] = [];

  // Home Assistant
  if (process.env.HASS_URL) {
    checks.push(
      checkService("Home Assistant", `${process.env.HASS_URL}/api/`, {
        Authorization: `Bearer ${process.env.HASS_TOKEN ?? ""}`,
      })
    );
  }

  // Immich
  if (process.env.IMMICH_URL) {
    checks.push(
      checkService("Immich", `${process.env.IMMICH_URL}/api/server/ping`)
    );
  }

  // Proxmox (admin only — still shown to all for basic up/down)
  if (process.env.PVE_URL && process.env.PVE_TOKEN_ID) {
    checks.push(
      checkService(
        "Proxmox VE",
        `${process.env.PVE_URL}/api2/json/version`,
        {
          Authorization: `PVEAPIToken=${process.env.PVE_TOKEN_ID}=${process.env.PVE_TOKEN_SECRET}`,
        }
      )
    );
  }

  // Pi-hole (primary)
  if (process.env.PIHOLE_URL) {
    checks.push(
      checkService("Pi-hole", `${process.env.PIHOLE_URL}/admin/api.php?status`)
    );
  }

  // Pi-hole (secondary)
  if (process.env.PIHOLE2_URL) {
    checks.push(
      checkService(
        "Pi-hole Secondary",
        `${process.env.PIHOLE2_URL}/admin/api.php?status`
      )
    );
  }

  // NAS
  if (process.env.NAS_URL) {
    checks.push(checkService("NAS", `${process.env.NAS_URL}`));
  }

  // Nginx Proxy Manager
  if (process.env.NPM_URL) {
    checks.push(checkService("Nginx Proxy Manager", `${process.env.NPM_URL}`));
  }

  // Portainer
  if (process.env.PORTAINER_URL) {
    checks.push(
      checkService("Portainer", `${process.env.PORTAINER_URL}/api/status`)
    );
  }

  const results = await Promise.all(checks);
  return NextResponse.json(results);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
}) as any;
