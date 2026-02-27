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
  ChevronRight,
  Shield,
  LayoutDashboard,
  MoreHorizontal,
} from "lucide-react";
import { generalLinks, adminLinks } from "@/data/links";

// Primary admin links (shown directly) vs secondary (in "More" submenu)
const PRIMARY_ADMIN = new Set(["UniFi Network", "Proxmox VE", "NAS", "Nginx Proxy", "Pi-hole", "Portainer", "Entra ID", "Root CA Setup"]);

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const isAdmin = (session?.user as { isAdmin?: boolean })?.isAdmin ?? false;

  const [open, setOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  // Close on route change
  useEffect(() => { setOpen(false); setMoreOpen(false); }, [pathname]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const openMenu = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(true);
  }, []);

  const closeMenu = useCallback(() => {
    timeoutRef.current = setTimeout(() => setOpen(false), 300);
  }, []);

  const dashActive = pathname === "/";
  const servicesActive = pathname === "/links";
  const adminActive = pathname === "/admin";

  // Tab definitions
  const tabs = [
    { key: "dashboard", label: "Dashboard", href: "/", icon: LayoutDashboard, active: dashActive, color: "text-blue-400", bg: "bg-blue-500/15" },
    { key: "services", label: "Home Services", href: "/links", icon: ExternalLink, active: servicesActive, color: "text-violet-400", bg: "bg-violet-500/15" },
    ...(isAdmin ? [{ key: "admin", label: "Admin", href: "/admin", icon: Shield, active: adminActive, color: "text-red-400", bg: "bg-red-500/15" }] : []),
  ];

  return (
    <nav className="relative z-50 mb-6" ref={navRef}>
      <div className="flex items-center justify-between rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-2 backdrop-blur-xl">
        {/* Left: Logo + tabs */}
        <div className="flex items-center gap-5">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20">
              <Home className="h-4 w-4 text-blue-400" />
            </div>
            <span className="text-sm font-bold text-white hidden sm:block">Home Portal</span>
          </Link>

          {/* Visible tabs — first click opens dropdown, second click navigates */}
          <div className="flex items-center gap-1" onMouseEnter={openMenu} onMouseLeave={closeMenu}>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => {
                    if (!open) {
                      openMenu();
                    } else {
                      setOpen(false);
                      router.push(tab.href);
                    }
                  }}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
                    tab.active
                      ? `${tab.bg} ${tab.color}`
                      : "text-white/55 hover:bg-white/[0.06] hover:text-white/80"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
            <button
              onClick={() => setOpen((v) => !v)}
              className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-200 ${
                open ? "bg-white/[0.10] text-white" : "text-white/40 hover:bg-white/[0.06] hover:text-white/60"
              }`}
            >
              <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
            </button>
          </div>
        </div>

        {/* Right: User nav */}
        <UserNav />
      </div>

      {/* Mega dropdown — all sections side by side */}
      {open && (
        <div
          className="absolute left-0 right-0 top-full z-[100] mt-2 rounded-2xl border border-white/[0.10] bg-black/90 p-4 shadow-2xl backdrop-blur-2xl"
          onMouseEnter={openMenu}
          onMouseLeave={closeMenu}
        >
          <div className={`grid gap-4 ${isAdmin ? "grid-cols-3" : "grid-cols-2"}`}>
            {/* ——— Dashboard column ——— */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 border-b border-blue-400/15 pb-2">
                <LayoutDashboard className="h-3.5 w-3.5 text-blue-400" />
                <span className="text-xs font-bold uppercase tracking-widest text-blue-400/70">Dashboard</span>
              </div>
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-white/75 transition-colors hover:bg-white/[0.07] hover:text-white"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-500/15">
                  <LayoutDashboard className="h-3.5 w-3.5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">Smart Home</p>
                  <p className="text-[11px] text-white/35">Lights, climate, energy</p>
                </div>
              </Link>
              <Link
                href="/links"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-white/75 transition-colors hover:bg-white/[0.07] hover:text-white"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-violet-500/15">
                  <ExternalLink className="h-3.5 w-3.5 text-violet-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">All Services</p>
                  <p className="text-[11px] text-white/35">Full services & tools page</p>
                </div>
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-white/75 transition-colors hover:bg-white/[0.07] hover:text-white"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-red-500/15">
                    <Shield className="h-3.5 w-3.5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Admin Panel</p>
                    <p className="text-[11px] text-white/35">Infrastructure management</p>
                  </div>
                </Link>
              )}
            </div>

            {/* ——— Vertical divider ——— */}
            {/* (handled by gap + border on next column) */}

            {/* ——— Home Services column ——— */}
            <div className="space-y-2 border-l border-white/[0.06] pl-4">
              <div className="flex items-center gap-2 border-b border-violet-400/15 pb-2">
                <ExternalLink className="h-3.5 w-3.5 text-violet-400" />
                <span className="text-xs font-bold uppercase tracking-widest text-violet-400/70">Home Services</span>
              </div>
              {generalLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <a
                    key={link.name}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-white/75 transition-colors hover:bg-white/[0.07] hover:text-white"
                  >
                    <div className={`flex h-7 w-7 items-center justify-center rounded-md ${link.iconBg}`}>
                      <Icon className={`h-3.5 w-3.5 ${link.iconColor}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{link.name}</p>
                      <p className="text-[11px] text-white/35 truncate">{link.description}</p>
                    </div>
                    <ExternalLink className="h-3 w-3 shrink-0 text-white/20" />
                  </a>
                );
              })}
            </div>

            {/* ——— Admin column (if admin) ——— */}
            {isAdmin && (() => {
              const primary = adminLinks.filter((l) => PRIMARY_ADMIN.has(l.name));
              const secondary = adminLinks.filter((l) => !PRIMARY_ADMIN.has(l.name));
              return (
                <div className="space-y-2 border-l border-white/[0.06] pl-4">
                  <div className="flex items-center gap-2 border-b border-red-400/15 pb-2">
                    <Shield className="h-3.5 w-3.5 text-red-400" />
                    <span className="text-xs font-bold uppercase tracking-widest text-red-400/60">Admin</span>
                  </div>
                  {/* Two-column compact grid */}
                  <div className="grid grid-cols-2 gap-1">
                    {primary.map((link) => {
                      const Icon = link.icon;
                      // Pi-hole: split button
                      if (link.children) {
                        return (
                          <div key={link.name} className="col-span-2 flex overflow-hidden rounded-md border border-white/[0.06]">
                            {link.children.map((child, i) => (
                              <a
                                key={child.name}
                                href={child.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex flex-1 items-center justify-center gap-1.5 px-2 py-1.5 text-xs text-white/70 transition-colors hover:bg-white/[0.07] hover:text-white ${
                                  i > 0 ? "border-l border-white/[0.06]" : ""
                                }`}
                              >
                                <Icon className={`h-3 w-3 ${link.iconColor}`} />
                                <span className="font-medium">{link.name} {child.name}</span>
                              </a>
                            ))}
                          </div>
                        );
                      }
                      if (link.internal) {
                        return (
                          <Link
                            key={link.name}
                            href={link.url}
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-white/70 transition-colors hover:bg-white/[0.07] hover:text-white"
                          >
                            <Icon className={`h-3 w-3 shrink-0 ${link.iconColor}`} />
                            <span className="font-medium truncate">{link.name}</span>
                          </Link>
                        );
                      }
                      return (
                        <a
                          key={link.name}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-white/70 transition-colors hover:bg-white/[0.07] hover:text-white"
                        >
                          <Icon className={`h-3 w-3 shrink-0 ${link.iconColor}`} />
                          <span className="font-medium truncate">{link.name}</span>
                        </a>
                      );
                    })}
                  </div>
                  {/* "More" collapsible for less-used services */}
                  {secondary.length > 0 && (
                    <div className="pt-1">
                      <button
                        onClick={() => setMoreOpen((v) => !v)}
                        className="flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/35 transition-colors hover:bg-white/[0.05] hover:text-white/55"
                      >
                        <MoreHorizontal className="h-3 w-3" />
                        <span>More Services</span>
                        <ChevronRight className={`ml-auto h-3 w-3 transition-transform duration-200 ${moreOpen ? "rotate-90" : ""}`} />
                      </button>
                      {moreOpen && (
                        <div className="mt-1 grid grid-cols-2 gap-1">
                          {secondary.map((link) => {
                            const Icon = link.icon;
                            if (link.internal) {
                              return (
                                <Link
                                  key={link.name}
                                  href={link.url}
                                  onClick={() => setOpen(false)}
                                  className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-white/70 transition-colors hover:bg-white/[0.07] hover:text-white"
                                >
                                  <Icon className={`h-3 w-3 shrink-0 ${link.iconColor}`} />
                                  <span className="font-medium truncate">{link.name}</span>
                                </Link>
                              );
                            }
                            return (
                              <a
                                key={link.name}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-white/70 transition-colors hover:bg-white/[0.07] hover:text-white"
                              >
                                <Icon className={`h-3 w-3 shrink-0 ${link.iconColor}`} />
                                <span className="font-medium truncate">{link.name}</span>
                              </a>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </nav>
  );
}
