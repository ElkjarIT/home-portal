"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ShieldX } from "lucide-react";

async function doSignOut() {
  const res = await fetch("/api/auth/csrf");
  const { csrfToken } = await res.json();
  const form = document.createElement("form");
  form.method = "POST";
  form.action = "/api/auth/signout";
  form.style.display = "none";
  for (const [k, v] of Object.entries({ csrfToken, callbackUrl: "/login" })) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = k;
    input.value = v as string;
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
}

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <ShieldX className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Access Denied</CardTitle>
          <CardDescription>
            You don&apos;t have permission to access this page. Please contact
            an administrator to be added to the appropriate group.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Button asChild variant="outline">
            <Link href="/">Back to Dashboard</Link>
          </Button>
          <Button variant="ghost" onClick={() => doSignOut()}>
            Sign in with a different account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
