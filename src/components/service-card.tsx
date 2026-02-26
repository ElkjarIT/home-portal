import Link from "next/link";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  ExternalLink,
  Image,
  Film,
  Home,
  Server,
  Wifi,
  Activity,
  Wrench,
  MonitorDot,
  Shield,
  HardDrive,
  Globe,
  Lock,
  Container,
  Users,
  Cloud,
  Github,
} from "lucide-react";
import type { Service, ServiceColor } from "@/data/services";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Image,
  Film,
  Home,
  Server,
  Wifi,
  Activity,
  Wrench,
  MonitorDot,
  Shield,
  HardDrive,
  Globe,
  Lock,
  Container,
  Users,
  Cloud,
  Github,
};

// Per-color style maps — icon bg, icon text, hover border, hover icon bg
const colorStyles: Record<
  ServiceColor,
  { iconBg: string; iconText: string; hoverBorder: string; hoverIconBg: string; hoverIconText: string; accentBorder: string }
> = {
  blue: {
    iconBg: "bg-blue-100 dark:bg-blue-950/40",
    iconText: "text-blue-600 dark:text-blue-400",
    hoverBorder: "hover:border-blue-400/60 dark:hover:border-blue-500/40",
    hoverIconBg: "group-hover:bg-blue-600 dark:group-hover:bg-blue-500",
    hoverIconText: "group-hover:text-white",
    accentBorder: "border-l-blue-500",
  },
  sky: {
    iconBg: "bg-sky-100 dark:bg-sky-950/40",
    iconText: "text-sky-600 dark:text-sky-400",
    hoverBorder: "hover:border-sky-400/60 dark:hover:border-sky-500/40",
    hoverIconBg: "group-hover:bg-sky-600 dark:group-hover:bg-sky-500",
    hoverIconText: "group-hover:text-white",
    accentBorder: "border-l-sky-500",
  },
  red: {
    iconBg: "bg-red-100 dark:bg-red-950/40",
    iconText: "text-red-600 dark:text-red-400",
    hoverBorder: "hover:border-red-400/60 dark:hover:border-red-500/40",
    hoverIconBg: "group-hover:bg-red-600 dark:group-hover:bg-red-500",
    hoverIconText: "group-hover:text-white",
    accentBorder: "border-l-red-500",
  },
  rose: {
    iconBg: "bg-rose-100 dark:bg-rose-950/40",
    iconText: "text-rose-600 dark:text-rose-400",
    hoverBorder: "hover:border-rose-400/60 dark:hover:border-rose-500/40",
    hoverIconBg: "group-hover:bg-rose-600 dark:group-hover:bg-rose-500",
    hoverIconText: "group-hover:text-white",
    accentBorder: "border-l-rose-500",
  },
  amber: {
    iconBg: "bg-amber-100 dark:bg-amber-950/40",
    iconText: "text-amber-600 dark:text-amber-400",
    hoverBorder: "hover:border-amber-400/60 dark:hover:border-amber-500/40",
    hoverIconBg: "group-hover:bg-amber-600 dark:group-hover:bg-amber-500",
    hoverIconText: "group-hover:text-white",
    accentBorder: "border-l-amber-500",
  },
  orange: {
    iconBg: "bg-orange-100 dark:bg-orange-950/40",
    iconText: "text-orange-600 dark:text-orange-400",
    hoverBorder: "hover:border-orange-400/60 dark:hover:border-orange-500/40",
    hoverIconBg: "group-hover:bg-orange-600 dark:group-hover:bg-orange-500",
    hoverIconText: "group-hover:text-white",
    accentBorder: "border-l-orange-500",
  },
  emerald: {
    iconBg: "bg-emerald-100 dark:bg-emerald-950/40",
    iconText: "text-emerald-600 dark:text-emerald-400",
    hoverBorder: "hover:border-emerald-400/60 dark:hover:border-emerald-500/40",
    hoverIconBg: "group-hover:bg-emerald-600 dark:group-hover:bg-emerald-500",
    hoverIconText: "group-hover:text-white",
    accentBorder: "border-l-emerald-500",
  },
  teal: {
    iconBg: "bg-teal-100 dark:bg-teal-950/40",
    iconText: "text-teal-600 dark:text-teal-400",
    hoverBorder: "hover:border-teal-400/60 dark:hover:border-teal-500/40",
    hoverIconBg: "group-hover:bg-teal-600 dark:group-hover:bg-teal-500",
    hoverIconText: "group-hover:text-white",
    accentBorder: "border-l-teal-500",
  },
  cyan: {
    iconBg: "bg-cyan-100 dark:bg-cyan-950/40",
    iconText: "text-cyan-600 dark:text-cyan-400",
    hoverBorder: "hover:border-cyan-400/60 dark:hover:border-cyan-500/40",
    hoverIconBg: "group-hover:bg-cyan-600 dark:group-hover:bg-cyan-500",
    hoverIconText: "group-hover:text-white",
    accentBorder: "border-l-cyan-500",
  },
  indigo: {
    iconBg: "bg-indigo-100 dark:bg-indigo-950/40",
    iconText: "text-indigo-600 dark:text-indigo-400",
    hoverBorder: "hover:border-indigo-400/60 dark:hover:border-indigo-500/40",
    hoverIconBg: "group-hover:bg-indigo-600 dark:group-hover:bg-indigo-500",
    hoverIconText: "group-hover:text-white",
    accentBorder: "border-l-indigo-500",
  },
  violet: {
    iconBg: "bg-violet-100 dark:bg-violet-950/40",
    iconText: "text-violet-600 dark:text-violet-400",
    hoverBorder: "hover:border-violet-400/60 dark:hover:border-violet-500/40",
    hoverIconBg: "group-hover:bg-violet-600 dark:group-hover:bg-violet-500",
    hoverIconText: "group-hover:text-white",
    accentBorder: "border-l-violet-500",
  },
  purple: {
    iconBg: "bg-purple-100 dark:bg-purple-950/40",
    iconText: "text-purple-600 dark:text-purple-400",
    hoverBorder: "hover:border-purple-400/60 dark:hover:border-purple-500/40",
    hoverIconBg: "group-hover:bg-purple-600 dark:group-hover:bg-purple-500",
    hoverIconText: "group-hover:text-white",
    accentBorder: "border-l-purple-500",
  },
  green: {
    iconBg: "bg-green-100 dark:bg-green-950/40",
    iconText: "text-green-600 dark:text-green-400",
    hoverBorder: "hover:border-green-400/60 dark:hover:border-green-500/40",
    hoverIconBg: "group-hover:bg-green-600 dark:group-hover:bg-green-500",
    hoverIconText: "group-hover:text-white",
    accentBorder: "border-l-green-500",
  },
  slate: {
    iconBg: "bg-slate-100 dark:bg-slate-800/40",
    iconText: "text-slate-600 dark:text-slate-400",
    hoverBorder: "hover:border-slate-400/60 dark:hover:border-slate-500/40",
    hoverIconBg: "group-hover:bg-slate-600 dark:group-hover:bg-slate-500",
    hoverIconText: "group-hover:text-white",
    accentBorder: "border-l-slate-500",
  },
};

interface ServiceCardProps {
  service: Service;
}

export function ServiceCard({ service }: ServiceCardProps) {
  const Icon = iconMap[service.icon] ?? Activity;
  const colors = colorStyles[service.color] ?? colorStyles.blue;

  return (
    <Link href={service.url} target="_blank" rel="noopener noreferrer">
      <Card
        className={`group relative overflow-hidden border-l-3 transition-all hover:shadow-md hover:-translate-y-0.5 h-full ${colors.accentBorder} ${colors.hoverBorder}`}
      >
        <CardContent className="flex items-center gap-3 p-3">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-colors ${colors.iconBg} ${colors.iconText} ${colors.hoverIconBg} ${colors.hoverIconText}`}
          >
            <Icon className="h-4.5 w-4.5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium leading-tight flex items-center gap-1.5">
              {service.name}
              <ExternalLink className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-50 shrink-0" />
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {service.description}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
