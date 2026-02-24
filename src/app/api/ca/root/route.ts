import { NextResponse } from "next/server";

/**
 * GET /api/ca/root
 *
 * Serves the step-ca root CA certificate as a downloadable PEM file.
 * No authentication is required so any device on the network can fetch it
 * and install it before trusting the portal's TLS certificate.
 *
 * Required env var:
 *   STEP_CA_ROOT_CERT_B64 – base64-encoded PEM of the root CA certificate.
 *
 *   Obtain it by running:
 *     docker exec step-ca base64 -w0 /home/step/certs/root_ca.crt
 *   then paste the output into STEP_CA_ROOT_CERT_B64 in .env.local.
 */
export async function GET() {
  const certB64 = process.env.STEP_CA_ROOT_CERT_B64;

  if (!certB64) {
    return NextResponse.json(
      {
        error:
          "Root CA not configured. Set STEP_CA_ROOT_CERT_B64 in your environment.",
      },
      { status: 503 }
    );
  }

  let pem: string;
  try {
    pem = Buffer.from(certB64, "base64").toString("utf-8");
  } catch {
    return NextResponse.json(
      { error: "STEP_CA_ROOT_CERT_B64 is not valid base64." },
      { status: 500 }
    );
  }

  if (!pem.includes("BEGIN CERTIFICATE")) {
    return NextResponse.json(
      { error: "STEP_CA_ROOT_CERT_B64 does not contain a valid PEM certificate." },
      { status: 500 }
    );
  }

  return new NextResponse(pem, {
    headers: {
      "Content-Type": "application/x-pem-file",
      "Content-Disposition": 'attachment; filename="aser-home-ca.crt"',
      "Cache-Control": "public, max-age=3600",
    },
  });
}
