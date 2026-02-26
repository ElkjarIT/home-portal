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

  const headers = { "x-api-key": immichKey };

  try {
    // Fetch jobs, stats, and storage in parallel
    const [jobsRes, statsRes, storageRes] = await Promise.all([
      fetch(`${immichUrl}/api/jobs`, { headers, cache: "no-store" }),
      fetch(`${immichUrl}/api/server/statistics`, { headers, cache: "no-store" }),
      fetch(`${immichUrl}/api/server/storage`, { headers, cache: "no-store" }),
    ]);

    // Jobs
    let queues: {
      name: string;
      active: number;
      waiting: number;
      failed: number;
      isPaused: boolean;
      isActive: boolean;
      pending: number;
    }[] = [];
    if (jobsRes.ok) {
      const data: Record<string, JobEntry> = await jobsRes.json();
      queues = Object.entries(data)
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
    }

    // Statistics (photos, videos, per-user)
    let stats: { photos: number; videos: number; users: { name: string; photos: number; videos: number }[] } | null = null;
    if (statsRes.ok) {
      const s = await statsRes.json();
      stats = {
        photos: s.photos ?? 0,
        videos: s.videos ?? 0,
        users: Array.isArray(s.usageByUser)
          ? s.usageByUser.map((u: { userName: string; photos: number; videos: number }) => ({
              name: u.userName,
              photos: u.photos,
              videos: u.videos,
            }))
          : [],
      };
    }

    // Storage
    let storage: { diskSize: string; diskUse: string; diskAvailable: string; diskUsagePercentage: number } | null = null;
    if (storageRes.ok) {
      const st = await storageRes.json();
      storage = {
        diskSize: st.diskSize ?? "",
        diskUse: st.diskUse ?? "",
        diskAvailable: st.diskAvailable ?? "",
        diskUsagePercentage: st.diskUsagePercentage ?? 0,
      };
    }

    return NextResponse.json({ queues, stats, storage });
  } catch {
    return NextResponse.json(
      { error: "Cannot reach Immich" },
      { status: 502 }
    );
  }
}
