import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

const ICLOUDPD_STATUS_URL =
  process.env.ICLOUDPD_STATUS_URL ?? "http://10.10.40.40:8780";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const res = await fetch(`${ICLOUDPD_STATUS_URL}/status`, {
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Status API returned ${res.status}` },
        { status: 502 },
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to reach iCloudPD status API: ${message}` },
      { status: 502 },
    );
  }
}
