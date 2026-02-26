import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

interface JobCounts {
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  waiting: number;
  paused: number;
}

interface JobEntry {
  queueStatus: { isPaused: boolean; isActive: boolean };
  jobCounts: JobCounts;
}

// Friendly labels for job queue names
const LABELS: Record<string, string> = {
  thumbnailGeneration: "Thumbnails",
  metadataExtraction: "Metadata",
  videoConversion: "Video Encoding",
  smartSearch: "Smart Search",
  faceDetection: "Face Detection",
  facialRecognition: "Face Recognition",
  duplicateDetection: "Duplicates",
  sidecar: "Sidecar",
  library: "Library",
  storageTemplateMigration: "Storage Migration",
  migration: "Migration",
  backgroundTask: "Background",
  search: "Search",
  notifications: "Notifications",
  backupDatabase: "DB Backup",
  ocr: "OCR",
  workflow: "Workflow",
  editor: "Editor",
};

export async function GET() {
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

  try {
    const res = await fetch(`${immichUrl}/api/jobs`, {
      headers: { "x-api-key": immichKey },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch Immich jobs" },
        { status: res.status }
      );
    }

    const data: Record<string, JobEntry> = await res.json();

    // Build sorted list — top 3 queues by pending work (active + waiting)
    const queues = Object.entries(data)
      .map(([key, entry]) => {
        const c = entry.jobCounts;
        return {
          name: LABELS[key] ?? key,
          active: c.active,
          waiting: c.waiting,
          failed: c.failed,
          isPaused: entry.queueStatus.isPaused,
          isActive: entry.queueStatus.isActive,
          pending: c.active + c.waiting,
        };
      })
      .sort((a, b) => b.pending - a.pending)
      .slice(0, 3);

    return NextResponse.json({ queues });
  } catch {
    return NextResponse.json(
      { error: "Cannot reach Immich" },
      { status: 502 }
    );
  }
}
