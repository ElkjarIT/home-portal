import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Image, Home, Server, Wifi, Activity, Wrench, MonitorDot, Shield } from "lucide-react";
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
};

interface ServiceCardProps {
  service: Service;
}

export function ServiceCard({ service }: ServiceCardProps) {
  const Icon = iconMap[service.icon] ?? Activity;

  return (
    <Link href={service.url} target="_blank" rel="noopener noreferrer">
      <Card className="group relative overflow-hidden transition-all hover:shadow-lg hover:border-primary/50 hover:-translate-y-0.5">
        <CardHeader className="flex flex-row items-center gap-4 pb-2">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="flex items-center gap-2 text-lg">
              {service.name}
              <ExternalLink className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-60" />
            </CardTitle>
            <CardDescription className="truncate">
              {service.description}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {service.category}
            </Badge>
            {service.adminOnly && (
              <Badge variant="outline" className="text-xs">
                Admin
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
