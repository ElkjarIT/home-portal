# Home Portal

Home infrastructure dashboard built with Next.js, shadcn/ui, and Auth.js. Provides quick-access service links, live Home Assistant entity states, and system health monitoring — all behind Microsoft Entra ID SSO.

## Features

- **Service dashboard** — categorised cards linking to Immich, Home Assistant, Pi-hole, NAS, Proxmox, etc.
- **Live HA states** — polling Home Assistant REST API for entity status
- **System monitoring** — aggregated up/down checks for infrastructure services
- **Entra ID SSO** — sign in with your Microsoft 365 / Azure AD account
- **Role-based access** — admin pages gated by Entra ID group membership
- **Admin panel** — iCloudPD re-auth triggers, container management (WIP), Proxmox overview (WIP)
- **Dark mode** — automatic via system preference (Tailwind CSS)
- **Docker deployment** — standalone Next.js output, single-container
- **Private CA + TLS** — step-ca ACME certificates for all internal services via `generate-certs.sh`

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Auth | Auth.js (next-auth v5) + Microsoft Entra ID |
| Icons | Lucide React |
| Deployment | Docker (node:24-alpine, standalone output) |

## Quick Start

### Prerequisites
- Node.js 24+ and npm
- A Microsoft Entra ID (Azure AD) App Registration

### 1. Clone and install
```bash
git clone https://github.com/ElkjarIT/home-portal.git
cd home-portal
npm install
```

### 2. Configure environment
```bash
cp .env.example .env.local
```
Edit `.env.local` with your values:
- **`AUTH_SECRET`** — generate with `npx auth secret`
- **`AUTH_MICROSOFT_ENTRA_ID_ID`** / `SECRET` / `TENANT_ID` — from your Azure App Registration
- **`HASS_URL`** / `HASS_TOKEN` — Home Assistant URL and long-lived access token
- **`ADMIN_GROUP_ID`** — Object ID of the Entra ID security group whose members get admin access

### 3. Azure App Registration
1. Go to [Azure Portal → Entra ID → App registrations](https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade)
2. **New registration** → name: `Home Portal`, redirect URI: `http://localhost:3000/api/auth/callback/microsoft-entra-id`
3. **Certificates & secrets** → New client secret → copy value to `AUTH_MICROSOFT_ENTRA_ID_SECRET`
4. **Token configuration** → Add optional claim → ID token → `groups` (group membership)
5. **Manifest** → set `"groupMembershipClaims": "SecurityGroup"`
6. Note the **Application (client) ID** and **Directory (tenant) ID**

### 4. Run locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

### 5. Deploy with Docker
```bash
docker compose up -d --build
```
The portal runs on port 3000.

### 6. Deploy behind Nginx Proxy Manager (recommended)
When running behind a reverse proxy with TLS, uncomment the proxy environment variables in `docker-compose.yml`:
```yaml
environment:
  - AUTH_URL=https://portal.aser.dk
  - AUTH_TRUST_HOST=true
```

Then update your **Azure App Registration** redirect URI:
```
https://portal.aser.dk/api/auth/callback/microsoft-entra-id
```

Configure a proxy host in Nginx Proxy Manager:
| Setting | Value |
|---|---|
| Domain | `portal.aser.dk` |
| Scheme | `http` |
| Forward IP | home-portal LXC IP |
| Forward Port | `3000` |
| SSL | Custom certificate from step-ca |
| Websockets | On |
| Block Common Exploits | On |

See [Infrastructure Setup](#infrastructure-setup) for the full proxy + CA stack.

## Project Structure
```
src/
├── app/
│   ├── admin/page.tsx         # Admin panel (role-gated)
│   ├── login/page.tsx         # Microsoft sign-in page
│   ├── unauthorized/page.tsx  # Access denied page
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts  # Auth.js handler
│   │   ├── ha/states/route.ts           # HA state proxy
│   │   └── monitoring/status/route.ts   # System health checks
│   ├── layout.tsx
│   ├── page.tsx               # Main dashboard
│   └── providers.tsx          # Session provider
├── components/
│   ├── ha-state-card.tsx      # Live HA entity display
│   ├── service-card.tsx       # Service link card
│   ├── system-status-card.tsx # Infrastructure health
│   ├── user-nav.tsx           # User avatar + dropdown
│   └── ui/                    # shadcn/ui primitives
├── data/
│   └── services.ts            # Service definitions (edit this!)
├── lib/
│   ├── auth.ts                # Auth.js config + Entra ID provider
│   └── utils.ts               # shadcn/ui utilities
└── middleware.ts               # Route protection
```

## Customisation

### Adding services
Edit `src/data/services.ts` — add entries to the `services` array:
```ts
{
  name: "Nextcloud",
  description: "File sync and sharing",
  url: "https://nextcloud.example.com",
  icon: "Cloud",           // Lucide icon name
  category: "tools",
  adminOnly: false,        // true = visible only to admins
}
```

### Adding HA entities
Edit the `watchEntities` array in `src/app/page.tsx` with your Home Assistant entity IDs.

### Adding monitoring targets
Edit `src/app/api/monitoring/status/route.ts` to add more `checkService()` calls.

## Infrastructure Setup

Network-wide reverse proxy and private CA for your homelab. This runs on a **dedicated Proxmox LXC**, separate from the app containers.

### Architecture

```
Pi-hole/Unbound ──► *.aser.dk → 10.10.10.20 (split-horizon DNS)
                         │
                ┌────────┴────────┐
                │   Proxy LXC     │
                │  Nginx Proxy Mgr│  :80 / :443 / :81
                │  step-ca (ACME) │  :9000
                └────────┬────────┘
                         │
     ┌───────────┬───────┼───────┬───────────┐
     ▼           ▼       ▼       ▼           ▼
 portal.aser.dk immich  ha     pihole    pve.aser.dk
    :3000      :2283  :8123   :80/:53      :8006
```

### 1. Create the Proxy LXC

In Proxmox, create a Debian 12 LXC (or Ubuntu 24.04):
- **Hostname:** `proxy`
- **Cores:** 1–2
- **RAM:** 512 MB–1 GB
- **Disk:** 8 GB
- **Static IP:** e.g. `10.10.10.20/24`
- **Features:** nesting=1 (required for Docker)

```bash
# Inside the LXC:
apt update && apt install -y curl
curl -fsSL https://get.docker.com | sh
```

### 2. Deploy the proxy stack

Create a directory (e.g. `/opt/homelab-proxy/`) and add this `docker-compose.yml`:

```yaml
name: homelab-proxy

services:
  step-ca:
    image: smallstep/step-ca:latest
    container_name: step-ca
    restart: unless-stopped
    ports:
      - "9000:9000"
    volumes:
      - step-ca-data:/home/step
    environment:
      - DOCKER_STEPCA_INIT_NAME=Aser Home CA
      - DOCKER_STEPCA_INIT_DNS_NAMES=ca.aser.dk,localhost
      - DOCKER_STEPCA_INIT_REMOTE_MANAGEMENT=true
      - DOCKER_STEPCA_INIT_ACME=true

  npm:
    image: jc21/nginx-proxy-manager:latest
    container_name: nginx-proxy-manager
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
      - "81:81"
    volumes:
      - npm-data:/data
      - npm-letsencrypt:/etc/letsencrypt
      - step-ca-certs:/etc/step-certs:ro

volumes:
  step-ca-data:
  npm-data:
  npm-letsencrypt:
  step-ca-certs:
```

```bash
cd /opt/homelab-proxy
docker compose up -d
```

### 3. Initialise step-ca

On first start, step-ca auto-initialises. Retrieve the root CA certificate:
```bash
# Get the root CA cert
docker exec step-ca step ca root > /usr/local/share/ca-certificates/aser-home-ca.crt

# Copy the root fingerprint (needed for ACME clients)
docker exec step-ca step certificate fingerprint /home/step/certs/root_ca.crt
```

Issue a certificate for a service:
```bash
# Interactive (one-off)
docker exec -it step-ca step ca certificate portal.aser.dk /home/step/certs/portal.crt /home/step/certs/portal.key

# Or via ACME (automated) from any host with step CLI:
step ca bootstrap --ca-url https://ca.aser.dk:9000 --fingerprint <ROOT_FINGERPRINT>
step ca certificate portal.aser.dk portal.crt portal.key --provisioner acme
```

Upload the generated `.crt` and `.key` files to NPM as a **Custom SSL Certificate** for the proxy host.

#### Batch certificate generation (recommended)

A helper script is provided to issue certificates for all services at once:

```bash
cd /opt/homelab-proxy
# Copy the script from the repo
cp generate-certs.sh /opt/homelab-proxy/

# Generate certs for all services
chmod +x generate-certs.sh
./generate-certs.sh

# Or generate for specific services only
./generate-certs.sh immich ha pihole
```

Certificates are written to `./certs/<domain>.{crt,key}`. The script:
- Auto-detects the root CA fingerprint from the running step-ca container
- Skips services with valid certificates (>7 days until expiry)
- Extracts the root CA cert for client installation
- Falls back to the default JWK provisioner if ACME fails

After generation, upload each `.crt` + `.key` pair to NPM → **SSL Certificates** → **Add Custom Certificate**.

### 4. Trust the root CA

Install the root CA certificate on devices that need to trust your internal services:

| Platform | Command / Location |
|---|---|
| Debian/Ubuntu LXCs | `cp aser-home-ca.crt /usr/local/share/ca-certificates/ && update-ca-certificates` |
| Windows | `certutil -addstore -f "ROOT" aser-home-ca.crt` |
| macOS | `sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain aser-home-ca.crt` |
| iOS | Install via profile (email/web), then trust in Settings → General → About → Certificate Trust |
| Android | Settings → Security → Install from storage |
| UniFi devices | Not needed — traffic to/from controller stays internal |

### 5. Split-horizon DNS (Pi-hole)

In Pi-hole, add **Local DNS Records** (`Local DNS → DNS Records`) pointing your services to the NPM LXC IP:

| Domain | IP |
|---|---|
| `portal.aser.dk` | `10.10.10.20` |
| `immich.aser.dk` | `10.10.10.20` |
| `ha.aser.dk` | `10.10.10.20` |
| `pihole.aser.dk` | `10.10.10.20` |
| `pihole2.aser.dk` | `10.10.10.20` |
| `nas01.aser.dk` | `10.10.10.20` |
| `pve.aser.dk` | `10.10.10.20` |
| `ca.aser.dk` | `10.10.10.20` |

All internal traffic for `*.aser.dk` resolves to NPM, which terminates TLS and forwards to the appropriate backend. External DNS for `aser.dk` stays pointed at Cloudflare / your registrar as normal.

> **Tip:** If you have many subdomains, use a CNAME wildcard. In Pi-hole's `/etc/dnsmasq.d/02-custom.conf`:
> ```
> address=/aser.dk/10.10.10.20
> ```
> This resolves **all** `*.aser.dk` queries to the NPM LXC. The NPM proxy host config determines which services are actually reachable.

### 6. Configure NPM proxy hosts

Access the NPM admin UI at `http://10.10.10.20:81` (default: `admin@example.com` / `changeme`).

For each service, create a **Proxy Host**:

1. **Domain:** `portal.aser.dk`
2. **Scheme:** `http`
3. **Forward Hostname/IP:** `<home-portal-lxc-ip>`
4. **Forward Port:** `3000`
5. **SSL tab:** select the custom certificate from step-ca
6. **Enable:** Force SSL, HTTP/2, Websockets Support

Repeat for all services:

| Domain | Scheme | Backend IP | Port | Notes |
|---|---|---|---|---|
| `portal.aser.dk` | http | `<portal-lxc-ip>` | 3000 | Home Portal |
| `immich.aser.dk` | http | `10.10.40.40` | 2283 | Photo library |
| `ha.aser.dk` | http | `10.10.20.108` | 8123 | Home Assistant |
| `pihole.aser.dk` | http | `10.10.10.12` | 80 | Primary DNS |
| `pihole2.aser.dk` | http | `10.10.10.13` | 80 | Secondary DNS |
| `nas01.aser.dk` | https | `10.10.50.14` | 5001 | Synology NAS |
| `pve.aser.dk` | https | `10.10.10.11` | 8006 | Proxmox VE |

## Roadmap
- [ ] WebSocket connection to HA for real-time updates (replace polling)
- [ ] iCloudPD re-auth via Telegram bot trigger from admin panel
- [ ] Docker container status from Portainer or Docker API
- [ ] Proxmox cluster overview (VMs, storage, backups)
- [ ] Dark/light mode toggle
- [ ] Service status indicators (green/red dots on cards)
- [ ] Editable service list from admin panel (persist to JSON or DB)

## Related Repos
- [ElkjarIT/immich](https://github.com/ElkjarIT/immich) — Immich + iCloudPD deployment
- [ElkjarIT/pve-monitoring](https://github.com/ElkjarIT/pve-monitoring) — Proxmox iSCSI monitoring
- [ElkjarIT/home-assistant-config](https://github.com/ElkjarIT/home-assistant-config) — Home Assistant config
