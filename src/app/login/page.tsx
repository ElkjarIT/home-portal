import { signIn } from "@/lib/auth";
import { Shield } from "lucide-react";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl = "/" } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/[0.10] bg-white/[0.07] p-8 text-center backdrop-blur-xl">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/20 ring-1 ring-blue-400/30">
          <Shield className="h-8 w-8 text-blue-400" />
        </div>

        <h1 className="mb-1 text-2xl font-bold text-white">Home Portal</h1>
        <p className="mb-8 text-sm text-white/50">
          Sign in to access your home dashboard
        </p>

        <form
          action={async (formData: FormData) => {
            "use server";
            const redirectTo = (formData.get("redirectTo") as string) || "/";
            await signIn("microsoft-entra-id", { redirectTo });
          }}
        >
          <input type="hidden" name="redirectTo" value={callbackUrl} />
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
          >
            <svg className="h-5 w-5" viewBox="0 0 21 21" fill="none">
              <rect x="1" y="1" width="9" height="9" fill="#F25022" />
              <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
              <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
              <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
            </svg>
            Sign in with Microsoft
          </button>
        </form>
      </div>
    </div>
  );
}
