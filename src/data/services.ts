export interface Service {
  name: string;
  description: string;
  url: string;
  icon: string; // Lucide icon name
  category: "media" | "infra" | "monitoring" | "tools";
  adminOnly?: boolean;
}

export const services: Service[] = [
  {
    name: "Immich",
    description: "Photo & video library",
    url: "https://immich.aser.dk",
    icon: "Image",
    category: "media",
  },
  {
    name: "Home Assistant",
    description: "Home automation dashboard",
    url: "https://ha.aser.dk",
    icon: "Home",
    category: "infra",
  },
  {
    name: "Pi-hole",
    description: "Primary DNS & ad blocking",
    url: "https://pihole.aser.dk",
    icon: "Shield",
    category: "infra",
    adminOnly: true,
  },
  {
    name: "Pi-hole Secondary",
    description: "Secondary DNS & ad blocking",
    url: "https://pihole2.aser.dk",
    icon: "Shield",
    category: "infra",
    adminOnly: true,
  },
  {
    name: "NAS",
    description: "Network attached storage",
    url: "https://nas01.aser.dk",
    icon: "HardDrive",
    category: "infra",
    adminOnly: true,
  },
  {
    name: "Proxmox VE",
    description: "Virtual environment management",
    url: "https://pve.aser.dk",
    icon: "Server",
    category: "infra",
    adminOnly: true,
  },
  {
    name: "Router",
    description: "Network management",
    url: "http://192.168.1.1",
    icon: "Wifi",
    category: "infra",
    adminOnly: true,
  },
];

export const categories: Record<Service["category"], string> = {
  media: "Media",
  infra: "Infrastructure",
  monitoring: "Monitoring",
  tools: "Tools",
};
