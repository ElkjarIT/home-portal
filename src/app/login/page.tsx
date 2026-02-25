"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Shield } from "lucide-react";

async function doSignIn() {
  const csrfRes = await fetch("/api/auth/csrf");
  const { csrfToken } = await csrfRes.json();
  const res = await fetch("/api/auth/signin/microsoft-entra-id", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ csrfToken, callbackUrl: "/" }),
    redirect: "follow",
  });
  if (res.redirected) {
    window.location.href = res.url;
  } else {
    window.location.href = res.url;
  }
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Home Portal</CardTitle>
          <CardDescription>
            Sign in with your Microsoft account to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" size="lg" onClick={() => doSignIn()}>
            Sign in with Microsoft
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
