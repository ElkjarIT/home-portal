# Immich GPU Worker Node — Chappie

Deploys a **GPU-only** Immich worker on Chappie (Windows 11 / Docker Desktop / WSL2) that offloads **GPU-accelerated** background jobs from the primary Immich server on the Proxmox VM:

- **Video transcoding** — NVENC hardware encode on the RTX 3080
- **Smart search** — CLIP embeddings via CUDA
- **Face detection / recognition** — CUDA-accelerated ML inference
- **Thumbnail generation** — image processing

I/O-heavy workers (metadata extraction, sidecar, library scanning, migrations) remain on the primary server where storage is local via iSCSI. This avoids exiftool timeouts reading large .MOV files over the 1 GbE NFS link.

No state lives on this node. Chappie can be started or stopped at any time; the primary server continues serving the web UI and API uninterrupted, and any in-flight jobs re-queue automatically.

---

## Architecture

```
Proxmox VM (primary)              Chappie (GPU worker)
─────────────────────             ────────────────────────────────
immich-server  (API + all workers)  immich-worker  (GPU workers only)
immich-machine-learning             immich-machine-learning (CUDA)
postgres  ◄──────────────────────── shared ─────────────────────►
redis     ◄──────────────────────── shared ─────────────────────►
upload/library (local/iSCSI) ◄───── mounted via NFS ────────────►
```

All instances share the same Postgres database, Redis queue, and uploaded files.
Immich routes GPU jobs (transcode, ML inference, thumbnails) to Chappie when it's online; everything else stays on the primary.

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

We use a Docker-native NFS volume. Docker Desktop's WSL2 VM handles the NFS mount in the Linux kernel — no WSL2 fstab entries needed.

### 1a — Set up the NFS export on the Proxmox VM (one-time)

```bash
sudo apt install nfs-kernel-server
echo '/data/immich *(rw,sync,no_subtree_check,no_root_squash,insecure)' | sudo tee -a /etc/exports
sudo exportfs -ra
sudo systemctl enable --now nfs-server
```

Verify: `showmount -e localhost` should list `/data/immich`.

### 1b — Create the Docker NFS volume on Chappie (one-time)

```powershell
docker volume create --driver local --opt type=nfs `
  --opt "o=addr=10.10.40.40,rw,nfsvers=4.1,rsize=1048576,wsize=1048576,hard,timeo=600,retrans=2,noresvport" `
  --opt device=":/data/immich" `
  immich-data
```

This mounts the full `/data/immich` tree so that all asset paths (`uploads/`, `icloud/`, `messages/`) match the primary server's container layout at `/opt/immich`.

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

## Step 3b — Recommended Admin UI concurrency (RTX 3080 12 GB)

The compose files control how many ML workers and NVENC sessions are *available*, but the actual job concurrency is controlled in the Immich web UI.

Go to **Administration → Jobs** and set these concurrency values:

| Job type | Default | Recommended | Notes |
|----------|---------|-------------|-------|
| **Thumbnail Generation** | 3 | **5** | CPU-bound, but more parallelism keeps GPU fed |
| **Video Transcoding** | 1 | **3–4** | RTX 3080 NVENC handles multiple encodes easily |
| **Smart Search** | 2 | **4** | CLIP embeddings run on GPU (CUDA ML image) |
| **Face Detection** | 2 | **4** | Also GPU-accelerated with CUDA ML image |
| **Sidecar Metadata** | 3 | **3** | Runs on primary only (not offloaded to Chappie) |
| **Background Task** | 5 | **5** | Keep default |

> **Tip:** After changing concurrency, monitor GPU usage with `nvidia-smi -l 1` inside WSL2 or `nvidia-smi dmon`. Target ~70–85 % GPU utilisation — if it stays below 50 %, bump transcoding or ML concurrency up further. If VRAM usage approaches 12 GB or you see OOM errors, dial back ML concurrency first (face detection and smart search compete for VRAM).

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
| Transcode jobs fail with file errors | Write permission denied on NFS mount | Use `no_root_squash` in the NFS export; check ownership on `/data/immich` |
| `mount.nfs: access denied` | NFS export not configured or wrong subnet | Check `/etc/exports` on Proxmox; run `exportfs -ra`; verify with `showmount -e 10.10.40.40` |
| NVENC jobs fail | Driver/CUDA not visible in WSL2 | Ensure NVIDIA driver ≥ 530 is installed; run `nvidia-smi` in WSL2 |
| Stale NFS handle errors | Proxmox NFS server restarted | `docker compose down; docker volume rm immich-data`; recreate volume and `up -d` |
| BullMQ lock errors / stalled jobs | I/O-heavy jobs blocking event loop | Verify `IMMICH_WORKERS_INCLUDE` excludes metadata/sidecar; those belong on the primary |
| `exiftool timeout: waited 120000ms` | Large .MOV reads over NFS saturate 1 GbE | Keep metadataExtraction on primary (iSCSI); do not run it on Chappie |
