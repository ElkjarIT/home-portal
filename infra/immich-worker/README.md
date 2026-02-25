# Immich Worker Node — Chappie

Deploys a **worker-only** Immich container on Chappie (Windows 11 / Docker Desktop / WSL2) that offloads background jobs — primarily **video transcoding** — from the primary Immich server on the Proxmox VM.

No state lives on this node. Chappie can be started or stopped at any time; the primary server continues serving the web UI and API uninterrupted, and any in-flight jobs re-queue automatically.

---

## Architecture

```
Proxmox VM (primary)              Chappie (worker)
─────────────────────             ────────────────────────────────
immich-server  (API + workers)    immich-worker  (workers only)
immich-machine-learning           immich-machine-learning  ← already running
postgres  ◄────────────────────── shared ──────────────────────►
redis     ◄────────────────────── shared ──────────────────────►
upload/library (NAS/iSCSI) ◄───── mounted via SMB or NFS ──────►
```

All instances share the same Postgres database, Redis queue, and uploaded files.
Immich routes jobs to whichever worker is available.

---

## ML instance consideration

> **Should the existing `immich-machine-learning` container on Chappie be replaced by a full worker?**

Two options:

| Option | Pros | Cons |
|--------|------|------|
| **Keep ML separate** (current) | No changes to existing ML setup; easy rollback | Two containers to manage on Chappie |
| **Consolidate into one worker compose** | Single `docker compose` to manage on Chappie; `immich-server` with `IMMICH_WORKERS_EXCLUDE=api` also runs ML jobs (smart search, face detection) if ML is co-located | Slightly more complex initial migration |

**Recommendation:** Start with the worker alongside the existing ML container (this README). Once stable, you can consolidate by adding `immich-machine-learning` to `docker-compose.yml` here and removing the old standalone ML compose, giving you a single `docker compose down/up` on Chappie.

---

## Prerequisites

- Docker Desktop (WSL2 backend) installed on Chappie.
- NVIDIA Game-Ready or Studio driver ≥ 530 installed (for NVENC — optional).
- Network access from Chappie to the Proxmox VM (Postgres port `5432`, Redis port `6379`).
- The Immich upload/library reachable from Chappie as a local path (see [Step 1](#step-1--mount-the-immich-library-on-chappie)).

---

## Step 1 — Mount the Immich library on Chappie

The worker needs read **and write** access to the same files as the primary server (it writes encoded videos, thumbnails and sidecar metadata).

### Option A — SMB share via WSL2 (recommended for Windows)

1. On the Proxmox VM (or NAS), share the upload directory over SMB.
2. In WSL2:
   ```bash
   sudo mkdir -p /mnt/immich_library
   sudo mount -t cifs //10.10.40.40/immich_library /mnt/immich_library \
     -o username=YOUR_SMB_USER,password=YOUR_SMB_PASS,uid=1000,gid=1000,file_mode=0770,dir_mode=0770
   ```
3. To make the mount persistent, add it to `/etc/fstab` inside WSL2:
   ```
   //10.10.40.40/immich_library  /mnt/immich_library  cifs  username=USER,password=PASS,uid=1000,gid=1000,file_mode=0770,dir_mode=0770,_netdev  0  0
   ```
4. Set `UPLOAD_LOCATION=/mnt/immich_library` in your `.env`.

### Option B — NFS mount via WSL2 (faster for large transfers)

1. On the Proxmox VM, export the upload directory via NFS.
2. In WSL2:
   ```bash
   sudo mkdir -p /mnt/immich_library
   sudo mount -t nfs 10.10.40.40:/srv/immich/library /mnt/immich_library
   ```
3. Set `UPLOAD_LOCATION=/mnt/immich_library` in your `.env`.

> **Note:** Do **not** put Postgres data on a network share. Only the upload/library path is shared.

---

## Step 2 — Configure environment variables

```powershell
# In PowerShell, from this directory:
Copy-Item .env.example .env
notepad .env
```

Fill in the values that match your primary Immich server:

| Variable | Example | Notes |
|----------|---------|-------|
| `IMMICH_VERSION` | `release` | Must match the tag on your primary server |
| `UPLOAD_LOCATION` | `/mnt/immich_library` | Path from Step 1 |
| `DB_HOSTNAME` | `10.10.40.40` | IP/DNS of your Proxmox VM |
| `DB_PASSWORD` | `…` | From your primary server's `.env` |
| `REDIS_HOSTNAME` | `10.10.40.40` | Same host as the primary server |
| `TZ` | `Europe/Copenhagen` | For correct timestamps in logs |

---

## Step 3 — Start the worker

### CPU transcoding (default)

```powershell
docker compose up -d
docker logs -f immich_worker
```

### NVIDIA NVENC hardware acceleration

```powershell
docker compose -f docker-compose.yml -f docker-compose.hwaccel.yml up -d
docker logs -f immich_worker
```

Then in Immich → **Administration → Video Transcoding**, set **Hardware Acceleration** to **NVENC**.

---

## Step 4 — Trigger a transcode run (optional)

In the Immich web UI on your primary server:

1. Go to **Administration → Jobs**.
2. Find **Transcode Video** and click **Start** (or **Resume All**).
3. Watch `docker logs -f immich_worker` on Chappie — you should see jobs being picked up.

---

## Graceful shutdown

When you're done with Chappie (gaming, maintenance, etc.):

```powershell
docker compose down
```

- In-progress jobs are abandoned and automatically re-queued.
- The primary Immich server continues serving the web UI and API without interruption.
- No migration or cleanup is needed — Chappie added compute only, not state.

When Chappie comes back online, simply run `docker compose up -d` again and it resumes pulling jobs.

---

## Updating Immich

Always update the **primary server first**, then update this worker to the same version:

```powershell
docker compose pull
docker compose up -d
```

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| Worker starts but picks up no jobs | Version mismatch with primary | Set `IMMICH_VERSION` to the exact tag used on primary |
| `ECONNREFUSED` on DB or Redis | Firewall blocking ports 5432/6379 | Allow inbound on the Proxmox VM firewall from Chappie's IP |
| Transcode jobs fail with file errors | Write permission denied on mount | Check `uid`/`gid` and `file_mode` on the CIFS/NFS mount |
| NVENC jobs fail | Driver/CUDA not visible in WSL2 | Ensure NVIDIA driver ≥ 530 is installed; run `nvidia-smi` in WSL2 |
| High SMB latency | Network bottleneck | Try NFS instead, or mount inside WSL2 rather than via Windows network drive |
