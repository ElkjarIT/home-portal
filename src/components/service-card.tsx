import Link from "next/link";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  ExternalLink,
  Image,
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
import type { Service } from "@/data/services";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Image,
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

interface ServiceCardProps {
  service: Service;
}

export function ServiceCard({ service }: ServiceCardProps) {
  const Icon = iconMap[service.icon] ?? Activity;

  return (
    <Link href={service.url} target="_blank" rel="noopener noreferrer">
      <Card className="group relative overflow-hidden transition-all hover:shadow-md hover:border-primary/50 hover:-translate-y-0.5 h-full">
        <CardContent className="flex items-center gap-3 p-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
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
