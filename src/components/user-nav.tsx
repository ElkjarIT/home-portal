"use client";

import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Shield, User } from "lucide-react";
import Link from "next/link";

async function doSignIn() {
  // Fetch CSRF token, then POST via fetch and follow the redirect manually
  const csrfRes = await fetch("/api/auth/csrf");
  const { csrfToken } = await csrfRes.json();
  const res = await fetch("/api/auth/signin/microsoft-entra-id", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ csrfToken, callbackUrl: "/" }),
    redirect: "follow",
  });
  // Auth.js returns HTML with a redirect — use the final URL
  if (res.redirected) {
    window.location.href = res.url;
  } else {
    // Fallback: parse for a redirect URL in the response
    const url = res.url;
    window.location.href = url;
  }
}

async function doSignOut() {
  const csrfRes = await fetch("/api/auth/csrf");
  const { csrfToken } = await csrfRes.json();
  const res = await fetch("/api/auth/signout", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ csrfToken, callbackUrl: "/" }),
    redirect: "follow",
  });
  if (res.redirected) {
    window.location.href = res.url;
  } else {
    window.location.href = "/";
  }
}

function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => doSignOut()}
      className="flex w-full items-center px-2 py-1.5 text-sm"
    >
      <LogOut className="mr-2 h-4 w-4" />
      Sign out
    </button>
  );
}

export function UserNav() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <Button variant="outline" size="sm" disabled>
        Loading...
      </Button>
    );
  }

  if (!session?.user) {
    return (
      <Button variant="outline" size="sm" onClick={() => doSignIn()}>
        Sign in
      </Button>
    );
  }

  const initials = session.user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage src={session.user.image ?? ""} alt={session.user.name ?? ""} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <div className="flex items-center justify-start gap-2 p-2">
          <div className="flex flex-col space-y-1 leading-none">
            <p className="font-medium">{session.user.name}</p>
            <p className="text-xs text-muted-foreground">
              {session.user.email}
            </p>
          </div>
        </div>
        <DropdownMenuSeparator />
        {session.user.isAdmin && (
          <DropdownMenuItem asChild>
            <Link href="/admin">
              <Shield className="mr-2 h-4 w-4" />
              Admin Panel
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <User className="mr-2 h-4 w-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => doSignOut()}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
