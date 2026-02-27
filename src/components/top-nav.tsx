"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import { UserNav } from "@/components/user-nav";
import {
  Home,
  ExternalLink,
  ChevronDown,
  Shield,
} from "lucide-react";
import { generalLinks } from "@/data/links";

const tabs = [
  { name: "Dashboard", href: "/", icon: Home },
];

export function TopNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = (session?.user as { isAdmin?: boolean })?.isAdmin ?? false;

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on route change
  useEffect(() => {
    setDropdownOpen(false);
  }, [pathname]);

  const openDropdown = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setDropdownOpen(true);
  };

  const closeDropdown = () => {
    timeoutRef.current = setTimeout(() => setDropdownOpen(false), 200);
  };

  const linksActive = pathname === "/links";
  const adminActive = pathname === "/admin";

  return (
    <nav className="relative z-50 mb-6">
      <div className="flex items-center justify-between rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-2 backdrop-blur-xl">
        {/* Left: Logo + tabs */}
        <div className="flex items-center gap-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20">
              <Home className="h-4 w-4 text-blue-400" />
            </div>
            <span className="text-sm font-bold text-white hidden sm:block">
              Home Portal
            </span>
          </Link>

          {/* Tab items */}
          <div className="flex items-center gap-1">
            {tabs.map((tab) => {
              const active = pathname === tab.href;
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-white/[0.1] text-white"
                      : "text-white/60 hover:bg-white/[0.06] hover:text-white/80"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.name}
                </Link>
              );
            })}

            {/* Home Services tab with hover dropdown */}
            <div
              ref={containerRef}
              className="relative"
              onMouseEnter={openDropdown}
              onMouseLeave={closeDropdown}
            >
              <Link
                href="/links"
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  linksActive
                    ? "bg-white/[0.1] text-white"
                    : "text-white/60 hover:bg-white/[0.06] hover:text-white/80"
                }`}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Home Services
                <ChevronDown
                  className={`h-3 w-3 transition-transform ${
                    dropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </Link>

              {/* Hover dropdown */}
              {dropdownOpen && (
                <div
                  className="absolute left-0 top-full z-[100] mt-1 min-w-[280px] rounded-xl border border-white/[0.1] bg-black/90 p-2 shadow-2xl backdrop-blur-2xl"
                  onMouseEnter={openDropdown}
                  onMouseLeave={closeDropdown}
                >
                  {/* General links */}
                  <div className="mb-1">
                    <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wider text-white/45">
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
                          className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-white/80 transition-colors hover:bg-white/[0.08] hover:text-white"
                        >
                          <div className={`flex h-6 w-6 items-center justify-center rounded-md ${link.iconBg}`}>
                            <Icon className={`h-3.5 w-3.5 ${link.iconColor}`} />
                          </div>
                          {link.name}
                        </a>
                      );
                    })}
                  </div>

                  {/* Footer link to full page */}
                  <div className="mx-2 mt-1 border-t border-white/[0.06] pt-1">
                    <Link
                      href="/links"
                      className="flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium text-white/55 transition-colors hover:bg-white/[0.06] hover:text-white/80"
                      onClick={() => setDropdownOpen(false)}
                    >
                      View all services
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Admin tab (separate, admin only) */}
            {isAdmin && (
              <Link
                href="/admin"
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  adminActive
                    ? "bg-red-500/15 text-red-300 ring-1 ring-red-500/20"
                    : "text-red-400/60 hover:bg-red-500/10 hover:text-red-300"
                }`}
              >
                <Shield className="h-3.5 w-3.5" />
                Admin
              </Link>
            )}
          </div>
        </div>

        {/* Right: User nav */}
        <UserNav />
      </div>
    </nav>
  );
}
