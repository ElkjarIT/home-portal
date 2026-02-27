"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState, useRef, useEffect, useCallback } from "react";
import { UserNav } from "@/components/user-nav";
import {
  Home,
  ExternalLink,
  ChevronDown,
  Shield,
  LayoutDashboard,
  Wrench,
} from "lucide-react";
import { generalLinks, adminLinks } from "@/data/links";

// ——— Section definitions ———
interface NavSection {
  key: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgActive: string;
  adminOnly?: boolean;
}

const sections: NavSection[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    color: "text-blue-400",
    bgActive: "bg-blue-500/15",
  },
  {
    key: "services",
    label: "Home Services",
    href: "/links",
    icon: ExternalLink,
    color: "text-violet-400",
    bgActive: "bg-violet-500/15",
  },
  {
    key: "admin",
    label: "Admin Panel",
    href: "/admin",
    icon: Shield,
    color: "text-red-400",
    bgActive: "bg-red-500/15",
    adminOnly: true,
  },
];

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const isAdmin = (session?.user as { isAdmin?: boolean })?.isAdmin ?? false;

  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const openMenu = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(true);
  }, []);

  const closeMenu = useCallback(() => {
    timeoutRef.current = setTimeout(() => setOpen(false), 250);
  }, []);

  // Determine current section
  const visibleSections = sections.filter((s) => !s.adminOnly || isAdmin);
  const current =
    visibleSections.find((s) => s.href !== "/" && pathname.startsWith(s.href)) ??
    visibleSections.find((s) => s.href === "/") ??
    visibleSections[0];

  const CurrentIcon = current.icon;

  return (
    <nav className="relative z-50 mb-6">
      <div className="flex items-center justify-between rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-2 backdrop-blur-xl">
        {/* Left: Logo + navigation dropdown */}
        <div className="flex items-center gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20">
              <Home className="h-4 w-4 text-blue-400" />
            </div>
            <span className="text-sm font-bold text-white hidden sm:block">
              Home Portal
            </span>
          </Link>

          {/* Unified navigation trigger */}
          <div ref={containerRef} className="relative" onMouseEnter={openMenu} onMouseLeave={closeMenu}>
            <button
              onClick={() => setOpen((v) => !v)}
              className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-medium transition-all duration-200 ${current.bgActive} ${current.color} hover:brightness-125`}
            >
              <CurrentIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{current.label}</span>
              <ChevronDown
                className={`h-3 w-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
              />
            </button>

            {/* Mega dropdown */}
            {open && (
              <div
                className="absolute left-0 top-full z-[100] mt-2 w-[420px] rounded-2xl border border-white/[0.10] bg-black/90 p-3 shadow-2xl backdrop-blur-2xl"
                onMouseEnter={openMenu}
                onMouseLeave={closeMenu}
              >
                {/* Section tabs */}
                <div className="mb-3 flex gap-1 rounded-xl bg-white/[0.04] p-1">
                  {visibleSections.map((sec) => {
                    const Icon = sec.icon;
                    const isActive = sec.key === current.key;
                    return (
                      <button
                        key={sec.key}
                        onClick={() => {
                          router.push(sec.href);
                          setOpen(false);
                        }}
                        className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold tracking-wide transition-all duration-200 ${
                          isActive
                            ? `${sec.bgActive} ${sec.color} ring-1 ring-current/20 shadow-sm`
                            : "text-white/45 hover:bg-white/[0.06] hover:text-white/70"
                        }`}
                      >
                        <Icon className="h-3 w-3" />
                        {sec.label}
                      </button>
                    );
                  })}
                </div>

                {/* Dynamic content based on current section */}
                {current.key === "dashboard" && (
                  <div className="space-y-1">
                    <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-white/35">
                      Navigation
                    </p>
                    <button
                      onClick={() => { router.push("/"); setOpen(false); }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2.5 text-sm text-white/80 transition-colors hover:bg-white/[0.08] hover:text-white"
                    >
                      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-500/20">
                        <LayoutDashboard className="h-3.5 w-3.5 text-blue-400" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium">Dashboard</p>
                        <p className="text-[11px] text-white/40">Smart home overview</p>
                      </div>
                    </button>
                    <button
                      onClick={() => { router.push("/links"); setOpen(false); }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2.5 text-sm text-white/80 transition-colors hover:bg-white/[0.08] hover:text-white"
                    >
                      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-violet-500/20">
                        <ExternalLink className="h-3.5 w-3.5 text-violet-400" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium">Home Services</p>
                        <p className="text-[11px] text-white/40">External tools & services</p>
                      </div>
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => { router.push("/admin"); setOpen(false); }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2.5 text-sm text-white/80 transition-colors hover:bg-white/[0.08] hover:text-white"
                      >
                        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-red-500/20">
                          <Shield className="h-3.5 w-3.5 text-red-400" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium">Admin Panel</p>
                          <p className="text-[11px] text-white/40">Infrastructure management</p>
                        </div>
                      </button>
                    )}
                  </div>
                )}

                {current.key === "services" && (
                  <div className="space-y-1">
                    <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-white/35">
                      Services
                    </p>
                    {generalLinks.map((link) => {
                      const Icon = link.icon;
                      return (
                        <a
                          key={link.name}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2.5 rounded-lg px-2 py-2.5 text-sm text-white/80 transition-colors hover:bg-white/[0.08] hover:text-white"
                        >
                          <div className={`flex h-7 w-7 items-center justify-center rounded-md ${link.iconBg}`}>
                            <Icon className={`h-3.5 w-3.5 ${link.iconColor}`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium">{link.name}</p>
                            <p className="text-[11px] text-white/40 truncate">{link.description}</p>
                          </div>
                          <ExternalLink className="h-3 w-3 shrink-0 text-white/25" />
                        </a>
                      );
                    })}
                  </div>
                )}

                {current.key === "admin" && isAdmin && (
                  <div className="space-y-1">
                    <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-red-400/50">
                      <span className="flex items-center gap-1"><Shield className="h-2.5 w-2.5" /> Admin Services</span>
                    </p>
                    {adminLinks.map((link) => {
                      const Icon = link.icon;
                      if (link.children) {
                        return link.children.map((child) => (
                          <a
                            key={child.name}
                            href={child.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2.5 rounded-lg px-2 py-2.5 text-sm text-white/80 transition-colors hover:bg-white/[0.08] hover:text-white"
                          >
                            <div className={`flex h-7 w-7 items-center justify-center rounded-md ${link.iconBg}`}>
                              <Icon className={`h-3.5 w-3.5 ${link.iconColor}`} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium">{link.name} — {child.name}</p>
                              <p className="text-[11px] text-white/40 truncate">{child.url.replace(/^https?:\/\//, "").replace(/\/admin$/, "")}</p>
                            </div>
                            <ExternalLink className="h-3 w-3 shrink-0 text-white/25" />
                          </a>
                        ));
                      }
                      return (
                        <a
                          key={link.name}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2.5 rounded-lg px-2 py-2.5 text-sm text-white/80 transition-colors hover:bg-white/[0.08] hover:text-white"
                        >
                          <div className={`flex h-7 w-7 items-center justify-center rounded-md ${link.iconBg}`}>
                            <Icon className={`h-3.5 w-3.5 ${link.iconColor}`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium">{link.name}</p>
                            <p className="text-[11px] text-white/40 truncate">{link.description}</p>
                          </div>
                          <ExternalLink className="h-3 w-3 shrink-0 text-white/25" />
                        </a>
                      );
                    })}
                    {/* Admin page link */}
                    <div className="mx-1 mt-2 border-t border-red-500/15 pt-2">
                      <button
                        onClick={() => { router.push("/admin"); setOpen(false); }}
                        className="flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium text-red-400/60 transition-colors hover:bg-red-500/10 hover:text-red-300"
                      >
                        <Wrench className="h-3 w-3" />
                        Open Admin Panel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: User nav */}
        <UserNav />
      </div>
    </nav>
  );
}
