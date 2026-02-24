# Home Portal

Home infrastructure dashboard built with Next.js, shadcn/ui, and Auth.js. Provides quick-access service links, live Home Assistant entity states, and system health monitoring — all behind Microsoft Entra ID SSO.

## Features

- **Service dashboard** — categorised cards linking to Immich, Home Assistant, Proxmox, etc.
- **Live HA states** — polling Home Assistant REST API for entity status
- **System monitoring** — aggregated up/down checks for infrastructure services
- **Entra ID SSO** — sign in with your Microsoft 365 / Azure AD account
- **Role-based access** — admin pages gated by Entra ID group membership
- **Admin panel** — iCloudPD re-auth triggers, container management (WIP), Proxmox overview (WIP)
- **Dark mode** — automatic via system preference (Tailwind CSS)
- **Docker deployment** — standalone Next.js output, single-container

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
The portal runs on port 3000. For production, add a redirect URI for your real domain in the Azure App Registration.

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
