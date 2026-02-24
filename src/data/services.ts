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
    url: "http://immich01:2283",
    icon: "Image",
    category: "media",
  },
  {
    name: "Home Assistant",
    description: "Home automation dashboard",
    url: "http://homeassistant.local:8123",
    icon: "Home",
    category: "infra",
  },
  {
    name: "Proxmox VE",
    description: "Virtual environment management",
    url: "https://proxmox.local:8006",
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
