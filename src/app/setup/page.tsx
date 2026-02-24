import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Download,
  Monitor,
  Smartphone,
  Terminal,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";

interface Platform {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  steps: string[];
}

const platforms: Platform[] = [
  {
    id: "windows",
    label: "Windows",
    icon: Monitor,
    steps: [
      'Download the certificate file using the button above.',
      'Double-click the downloaded file and click "Install Certificate…".',
      'Choose "Local Machine" and click Next.',
      'Select "Place all certificates in the following store", then click Browse.',
      'Choose "Trusted Root Certification Authorities" and click OK.',
      'Click Next, then Finish.',
    ],
  },
  {
    id: "macos",
    label: "macOS",
    icon: Monitor,
    steps: [
      "Download the certificate file.",
      "Double-click the file — Keychain Access opens and imports it.",
      'Find "Aser Home CA" in the Login or System keychain.',
      'Double-click the certificate, expand "Trust", and set "When using this certificate" to "Always Trust".',
      "Close and confirm with your password.",
    ],
  },
  {
    id: "ios",
    label: "iOS / iPadOS",
    icon: Smartphone,
    steps: [
      'Open this page in Safari on your iPhone/iPad and tap "Download Certificate".',
      'A prompt appears — tap "Allow" to download the profile.',
      "Go to Settings → General → VPN & Device Management.",
      'Tap the downloaded profile and tap "Install".',
      "After installing, go to Settings → General → About → Certificate Trust Settings.",
      'Toggle on "Aser Home CA" under Enable Full Trust For Root Certificates.',
    ],
  },
  {
    id: "android",
    label: "Android",
    icon: Smartphone,
    steps: [
      "Download the certificate file.",
      "Go to Settings → Security (or Biometrics & security) → Install from device storage.",
      "Locate and tap the downloaded file.",
      'When prompted, name the certificate (e.g. "Aser Home CA") and set it as a CA certificate.',
      "Tap OK.",
    ],
  },
  {
    id: "linux",
    label: "Linux (Debian / Ubuntu)",
    icon: Terminal,
    steps: [
      "Download the certificate file.",
      "Copy it to the system CA store:",
      "sudo cp aser-home-ca.crt /usr/local/share/ca-certificates/",
      "sudo update-ca-certificates",
    ],
  },
];

export default function SetupPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" className="mr-1">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold tracking-tight">
              Install Root CA Certificate
            </h1>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight">
            Trust the home network CA
          </h2>
          <p className="mt-1 text-muted-foreground">
            Install the root certificate below on each device so that browsers
            and apps trust HTTPS services on <strong>*.aser.dk</strong> without
            security warnings.
          </p>
        </div>

        {/* Download button */}
        <div className="mb-8 flex flex-col items-start gap-3 rounded-lg border bg-card p-5 shadow-sm">
          <p className="text-sm font-medium">
            Step 1 — Download the root CA certificate
          </p>
          <a href="/api/ca/root" download="aser-home-ca.crt">
            <Button>
              <Download className="mr-2 h-4 w-4" />
              Download aser-home-ca.crt
            </Button>
          </a>
          <p className="text-xs text-muted-foreground">
            The file is signed by your internal step-ca and is safe to install
            on trusted devices only.
          </p>
        </div>

        {/* Per-platform instructions */}
        <p className="mb-4 text-sm font-medium">
          Step 2 — Install on your device
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {platforms.map((p) => {
            const Icon = p.icon;
            return (
              <Card key={p.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary" />
                    <CardTitle className="text-base">{p.label}</CardTitle>
                  </div>
                  <CardDescription className="sr-only">
                    Installation steps for {p.label}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-1.5 text-sm text-muted-foreground list-decimal list-outside ml-4">
                    {p.steps.map((step, i) =>
                      step.startsWith("sudo ") ? (
                        <li key={i} className="list-none -ml-4 mt-1">
                          <code className="block rounded bg-muted px-2 py-1 text-xs font-mono text-foreground">
                            {step}
                          </code>
                        </li>
                      ) : (
                        <li key={i}>{step}</li>
                      )
                    )}
                  </ol>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <p className="mt-8 text-xs text-muted-foreground">
          Certificate served by{" "}
          <a
            href="https://ca.aser.dk"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2"
          >
            step-ca
          </a>
          . Once installed, all <strong>*.aser.dk</strong> HTTPS connections
          will be trusted automatically.
        </p>
      </main>
    </div>
  );
}
