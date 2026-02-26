"use client";

import { signIn, signOut } from "next-auth/react";
import { ShieldX, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/[0.10] bg-white/[0.07] p-8 text-center backdrop-blur-xl">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20 ring-1 ring-red-400/30">
          <ShieldX className="h-8 w-8 text-red-400" />
        </div>

        <h1 className="mb-1 text-2xl font-bold text-white">Access Denied</h1>
        <p className="mb-8 text-sm text-white/50">
          Your account is not authorized to access the Home Portal. Contact an
          administrator if you believe this is an error.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white/[0.10] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/[0.18]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.10] px-4 py-3 text-sm font-medium text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            Sign in with a different account
          </button>
        </div>
      </div>
    </div>
  );
}
