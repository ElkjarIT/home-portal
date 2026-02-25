export interface Service {
  name: string;
  description: string;
  url: string;
  icon: string; // Lucide icon name
  category: "media" | "infra" | "monitoring" | "tools" | "external";
  adminOnly?: boolean;
}

export const services: Service[] = [
  // Media
  {
    name: "Immich",
    description: "Photo & video library",
    url: "https://immich.aser.dk",
    icon: "Image",
    category: "media",
  },

  // Infrastructure — general
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
    url: "https://pihole.aser.dk/admin",
    icon: "Shield",
    category: "infra",
    adminOnly: true,
  },
  {
    name: "Pi-hole Secondary",
    description: "Secondary DNS & ad blocking",
    url: "https://pihole2.aser.dk/admin",
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
    name: "Nginx Proxy Manager",
    description: "Reverse proxy & SSL management",
    url: "https://npm.aser.dk",
    icon: "Globe",
    category: "infra",
    adminOnly: true,
  },
  {
    name: "Step-CA",
    description: "Internal certificate authority",
    url: "https://ca.aser.dk",
    icon: "Lock",
    category: "infra",
    adminOnly: true,
  },
  {
    name: "Portainer",
    description: "Docker container management",
    url: "https://portainer.aser.dk",
    icon: "Container",
    category: "infra",
    adminOnly: true,
  },
  {
    name: "UniFi Network",
    description: "Network management console",
    url: "https://unifi.ui.com/consoles/F4E2C6EDA3D60000000007D7CE7400000000083F74BA0000000065639621:621370638",
    icon: "Wifi",
    category: "infra",
    adminOnly: true,
  },

  // External
  {
    name: "Entra ID",
    description: "Microsoft identity & access management",
    url: "https://portal.azure.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/~/Overview",
    icon: "Users",
    category: "external",
    adminOnly: true,
  },
  {
    name: "Cloudflare",
    description: "DNS & CDN management",
    url: "https://dash.cloudflare.com",
    icon: "Cloud",
    category: "external",
    adminOnly: true,
  },
  {
    name: "GitHub",
    description: "Source code & repositories",
    url: "https://github.com",
    icon: "Github",
    category: "external",
  },
];

export const categories: Record<Service["category"], string> = {
  media: "Media",
  infra: "Infrastructure",
  monitoring: "Monitoring",
  tools: "Tools",
  external: "External Services",
};
