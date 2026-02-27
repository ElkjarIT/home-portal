import {
  Home,
  Shield,
  HardDrive,
  Server,
  Globe,
  Users,
  Cloud,
  Github,
  Wifi,
  Mail,
  Lock,
  Container,
  Film,
  BookOpen,
  type LucideIcon,
  ImageIcon,
} from "lucide-react";

export interface ServiceLink {
  name: string;
  description: string;
  url: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  children?: { name: string; url: string }[];
}

// ——— General / External service links ———
export const generalLinks: ServiceLink[] = [
  {
    name: "Immich",
    description: "Photo & video library",
    url: "https://immich.aser.dk",
    icon: ImageIcon,
    iconBg: "bg-blue-500/20",
    iconColor: "text-blue-400",
  },
  {
    name: "Home Assistant",
    description: "Dashboard & automations",
    url: "https://ha.aser.dk",
    icon: Home,
    iconBg: "bg-sky-500/20",
    iconColor: "text-sky-400",
  },
  {
    name: "Outlook",
    description: "Email & calendar",
    url: "https://outlook.office.com",
    icon: Mail,
    iconBg: "bg-blue-600/20",
    iconColor: "text-blue-400",
  },
  {
    name: "Cloudflare",
    description: "DNS & CDN management",
    url: "https://dash.cloudflare.com",
    icon: Cloud,
    iconBg: "bg-orange-500/20",
    iconColor: "text-orange-400",
  },
  {
    name: "GitHub",
    description: "Source code & repositories",
    url: "https://github.com",
    icon: Github,
    iconBg: "bg-violet-500/20",
    iconColor: "text-violet-400",
  },
];

// ——— Admin-only links ———
export const adminLinks: ServiceLink[] = [
  {
    name: "UniFi Network",
    description: "Network management & monitoring",
    url: "https://unifi.ui.com/consoles/F4E2C6EDA3D60000000007D7CE7400000000083F74BA0000000065639621:621370638",
    icon: Wifi,
    iconBg: "bg-indigo-500/20",
    iconColor: "text-indigo-400",
  },
  {
    name: "Proxmox VE",
    description: "Virtual machine environment",
    url: "https://pve.aser.dk",
    icon: Server,
    iconBg: "bg-purple-500/20",
    iconColor: "text-purple-400",
  },
  {
    name: "NAS",
    description: "Network attached storage",
    url: "https://nas01.aser.dk",
    icon: HardDrive,
    iconBg: "bg-blue-500/20",
    iconColor: "text-blue-400",
  },
  {
    name: "Nginx Proxy",
    description: "Reverse proxy & SSL manager",
    url: "https://nginx.aser.dk",
    icon: Globe,
    iconBg: "bg-emerald-500/20",
    iconColor: "text-emerald-400",
  },
  {
    name: "Pi-hole",
    description: "DNS & ad blocking",
    url: "https://pihole.aser.dk/admin",
    icon: Shield,
    iconBg: "bg-red-500/20",
    iconColor: "text-red-400",
    children: [
      { name: "Primary", url: "https://pihole.aser.dk/admin" },
      { name: "Secondary", url: "https://pihole2.aser.dk/admin" },
    ],
  },
  {
    name: "Portainer",
    description: "Docker container management",
    url: "https://portainer.aser.dk",
    icon: Container,
    iconBg: "bg-cyan-500/20",
    iconColor: "text-cyan-400",
  },
  {
    name: "Step-CA",
    description: "Internal certificate authority",
    url: "https://ca.aser.dk",
    icon: Lock,
    iconBg: "bg-teal-500/20",
    iconColor: "text-teal-400",
  },
  {
    name: "Plex",
    description: "Media server",
    url: "https://plex.aser.dk",
    icon: Film,
    iconBg: "bg-amber-500/20",
    iconColor: "text-amber-400",
  },
  {
    name: "Entra ID",
    description: "Microsoft identity & access",
    url: "https://portal.azure.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/~/Overview",
    icon: Users,
    iconBg: "bg-blue-600/20",
    iconColor: "text-blue-400",
  },
  {
    name: "GitHub",
    description: "Source code & repositories",
    url: "https://github.com/ElkjarIT",
    icon: Github,
    iconBg: "bg-violet-500/20",
    iconColor: "text-violet-400",
  },
  {
    name: "Cloudflare",
    description: "DNS & CDN management",
    url: "https://dash.cloudflare.com",
    icon: Cloud,
    iconBg: "bg-orange-500/20",
    iconColor: "text-orange-400",
  },
  {
    name: "Documentation",
    description: "Project docs & README files",
    url: "https://github.com/ElkjarIT/home-portal#readme",
    icon: BookOpen,
    iconBg: "bg-green-500/20",
    iconColor: "text-green-400",
  },
];

// All links combined for dropdown preview
export const allLinks = [...generalLinks, ...adminLinks];
