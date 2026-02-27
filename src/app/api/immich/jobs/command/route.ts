import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Allowed Immich job commands.
 * Immich API: PUT /api/jobs/{jobName} with body { "command": "<cmd>" }
 * Commands: "start", "pause", "resume", "empty"
 * We only allow "start" for safety.
 */
const ALLOWED_COMMANDS = new Set(["start"]);

/**
 * Known Immich job names that we allow triggering.
 */
const ALLOWED_JOBS = new Set([
  "thumbnailGeneration",
  "metadataExtraction",
  "videoConversion",
  "smartSearch",
  "faceDetection",
  "facialRecognition",
  "duplicateDetection",
  "sidecar",
  "library",
  "storageTemplateMigration",
  "migration",
  "backgroundTask",
  "search",
  "notifications",
  "backupDatabase",
  "ocr",
  "workflow",
  "editor",
]);

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const immichUrl = process.env.IMMICH_URL;
  const immichKey = process.env.IMMICH_API_KEY;

  if (!immichUrl || !immichKey) {
    return NextResponse.json(
      { error: "Immich not configured" },
      { status: 503 }
    );
  }

  let body: { jobName: string; command: string; force?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { jobName, command, force } = body;

  if (!jobName || !command) {
    return NextResponse.json(
      { error: "Missing jobName or command" },
      { status: 400 }
    );
  }

  if (!ALLOWED_COMMANDS.has(command)) {
    return NextResponse.json(
      { error: `Command "${command}" is not allowed` },
      { status: 403 }
    );
  }

  // Special "all" meta-job: fire start on every known job
  if (jobName === "__all__") {
    const results: { job: string; ok: boolean }[] = [];
    for (const job of ALLOWED_JOBS) {
      try {
        const res = await fetch(`${immichUrl}/api/jobs/${job}`, {
          method: "PUT",
          headers: {
            "x-api-key": immichKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ command, force: force ?? false }),
        });
        results.push({ job, ok: res.ok });
      } catch {
        results.push({ job, ok: false });
      }
    }
    return NextResponse.json({ ok: true, results });
  }

  if (!ALLOWED_JOBS.has(jobName)) {
    return NextResponse.json(
      { error: `Job "${jobName}" is not allowed` },
      { status: 403 }
    );
  }

  try {
    const res = await fetch(`${immichUrl}/api/jobs/${jobName}`, {
      method: "PUT",
      headers: {
        "x-api-key": immichKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ command, force: force ?? false }),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `Immich returned ${res.status}: ${text}` },
        { status: res.status }
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Cannot reach Immich" },
      { status: 502 }
    );
  }
}
