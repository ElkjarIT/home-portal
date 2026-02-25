"use client";

import { Home, Shield, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from "react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  activeColor: string;
}

const navItems: NavItem[] = [
  {
    title: "Home",
    href: "/",
    icon: Home,
    color: "text-blue-500",
    activeColor: "bg-blue-600 text-white",
  },
  {
    title: "Admin",
    href: "/admin",
    icon: Shield,
    color: "text-red-500",
    activeColor: "bg-red-600 text-white",
  },
];

function NavLinks({
  items,
  pathname,
  onNavigate,
}: {
  items: NavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? item.activeColor
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icon className={cn("h-5 w-5", isActive ? "" : item.color)} />
            {item.title}
          </Link>
        );
      })}
    </>
  );
}

/** Mobile sidebar trigger + sheet — place this in the header */
export function MobileSidebarTrigger() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <SheetHeader className="border-b p-4 bg-gradient-to-r from-blue-600 to-indigo-600">
          <SheetTitle className="text-white">Home Portal</SheetTitle>
        </SheetHeader>
        <nav className="space-y-1 p-2">
          <NavLinks
            items={navItems}
            pathname={pathname}
            onNavigate={() => setOpen(false)}
          />
        </nav>
      </SheetContent>
    </Sheet>
  );
}

/** Desktop sidebar — place this once at top level of the page */
export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:w-64 lg:flex-col border-r bg-background">
      <div className="flex h-14 items-center border-b px-6 bg-gradient-to-r from-blue-600 to-indigo-600">
        <h2 className="text-lg font-semibold tracking-tight text-white">Home Portal</h2>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        <NavLinks items={navItems} pathname={pathname} />
      </nav>
    </aside>
  );
}
