#!/usr/bin/env bash
#
# generate-certs.sh — Issue TLS certificates for homelab services via step-ca.
#
# Usage:
#   ./generate-certs.sh              # Generate certs for all services
#   ./generate-certs.sh portal ha    # Generate certs for specific services only
#
# Prerequisites:
#   - step-ca container running (docker compose up -d)
#   - Root CA fingerprint available (auto-detected from running container)
#
# Certificates are written to ./certs/<domain>.{crt,key}
# Upload them to Nginx Proxy Manager as Custom SSL Certificates.

set -euo pipefail

DOMAIN="aser.dk"
CA_CONTAINER="step-ca"
CERT_DIR="./certs"
CERT_DURATION="8760h"  # 1 year
PROVISIONER="admin"    # JWK provisioner name (from step ca provisioner list)
PASS_FILE="/home/step/secrets/password"  # Provisioner password inside container

# If the default password doesn't work, set STEP_ADMIN_PASS env var:
#   export STEP_ADMIN_PASS="your-admin-password"
#   ./generate-certs.sh

# Service definitions: name=hostname:port (port is for reference only)
declare -A SERVICES=(
  [portal]="portal.${DOMAIN}"
  [immich]="immich.${DOMAIN}"
  [infisical]="infisical.${DOMAIN}"
  [pihole]="pihole.${DOMAIN}"
  [pihole2]="pihole2.${DOMAIN}"
  [nas01]="nas01.${DOMAIN}"
  [ha]="ha.${DOMAIN}"
  [pve]="pve.${DOMAIN}"
  [ca]="ca.${DOMAIN}"
)

# Colours
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC} $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*" >&2; }

# ---------------------------------------------------------------------------
# Pre-flight checks
# ---------------------------------------------------------------------------

if ! command -v docker &>/dev/null; then
  error "Docker is not installed or not in PATH."
  exit 1
fi

if ! docker ps --format '{{.Names}}' | grep -q "^${CA_CONTAINER}$"; then
  error "step-ca container '${CA_CONTAINER}' is not running."
  error "Start it with: cd $(dirname "$0") && docker compose up -d"
  exit 1
fi

# Auto-detect root CA fingerprint
info "Detecting root CA fingerprint..."
FINGERPRINT=$(docker exec "${CA_CONTAINER}" step certificate fingerprint /home/step/certs/root_ca.crt 2>/dev/null)
if [[ -z "${FINGERPRINT}" ]]; then
  error "Could not retrieve root CA fingerprint from ${CA_CONTAINER}."
  exit 1
fi
info "Root CA fingerprint: ${FINGERPRINT}"

# Create output directory
mkdir -p "${CERT_DIR}"

# ---------------------------------------------------------------------------
# Determine which services to process
# ---------------------------------------------------------------------------

if [[ $# -gt 0 ]]; then
  TARGETS=("$@")
else
  TARGETS=("${!SERVICES[@]}")
fi

# Sort targets for consistent output
IFS=$'\n' TARGETS=($(sort <<<"${TARGETS[*]}")); unset IFS

# ---------------------------------------------------------------------------
# Generate certificates
# ---------------------------------------------------------------------------

ISSUED=0
FAILED=0

for svc in "${TARGETS[@]}"; do
  if [[ -z "${SERVICES[$svc]+x}" ]]; then
    warn "Unknown service '${svc}' — skipping. Valid: ${!SERVICES[*]}"
    ((FAILED++))
    continue
  fi

  FQDN="${SERVICES[$svc]}"
  CRT="${CERT_DIR}/${FQDN}.crt"
  KEY="${CERT_DIR}/${FQDN}.key"

  # Check for existing valid certificate
  if [[ -f "${CRT}" ]]; then
    EXPIRY=$(openssl x509 -enddate -noout -in "${CRT}" 2>/dev/null | cut -d= -f2)
    if openssl x509 -checkend 604800 -noout -in "${CRT}" &>/dev/null; then
      info "Skipping ${FQDN} — certificate valid until ${EXPIRY}"
      info "  (use 'rm ${CRT} ${KEY}' to force re-issue)"
      ((ISSUED++))
      continue
    else
      warn "${FQDN} certificate expires soon (${EXPIRY}) — re-issuing..."
    fi
  fi

  info "Issuing certificate for ${FQDN}..."

  # Determine password file: use env override or default container path
  if [[ -n "${STEP_ADMIN_PASS:-}" ]]; then
    # Write override password to temp file inside container
    docker exec "${CA_CONTAINER}" sh -c "printf '%s' '${STEP_ADMIN_PASS}' > /tmp/step-admin-pass"
    CONTAINER_PASS="/tmp/step-admin-pass"
  else
    CONTAINER_PASS="${PASS_FILE}"
  fi

  # Generate cert inside the step-ca container using JWK provisioner
  if docker exec "${CA_CONTAINER}" \
    step ca certificate "${FQDN}" \
      "/home/step/certs/${FQDN}.crt" \
      "/home/step/certs/${FQDN}.key" \
      --provisioner "${PROVISIONER}" \
      --provisioner-password-file="${CONTAINER_PASS}" \
      --not-after="${CERT_DURATION}" \
      --force 2>&1; then

    # Copy cert and key out of the container
    docker cp "${CA_CONTAINER}:/home/step/certs/${FQDN}.crt" "${CRT}"
    docker cp "${CA_CONTAINER}:/home/step/certs/${FQDN}.key" "${KEY}"

    # Clean up inside container
    docker exec "${CA_CONTAINER}" rm -f "/home/step/certs/${FQDN}.crt" "/home/step/certs/${FQDN}.key"

    info "  → ${CRT}"
    info "  → ${KEY}"
    ((ISSUED++))
  else
    error "Failed to issue certificate for ${FQDN}"
    error "If password is wrong, set: export STEP_ADMIN_PASS='your-admin-password'"
    ((FAILED++))
  fi
done

# ---------------------------------------------------------------------------
# Extract root CA certificate
# ---------------------------------------------------------------------------

ROOT_CA="${CERT_DIR}/aser-home-ca.crt"
if [[ ! -f "${ROOT_CA}" ]]; then
  info "Extracting root CA certificate..."
  docker cp "${CA_CONTAINER}:/home/step/certs/root_ca.crt" "${ROOT_CA}"
  info "  → ${ROOT_CA}"
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------

echo ""
info "=== Certificate Generation Complete ==="
info "Issued/Valid: ${ISSUED}  |  Failed: ${FAILED}"
echo ""
info "Next steps:"
info "  1. Upload .crt + .key pairs to NPM → SSL Certificates → Custom"
info "  2. Assign certificates to proxy hosts in NPM"
info "  3. Install ${ROOT_CA} on client devices (see README)"
echo ""
info "Root CA fingerprint (save this): ${FINGERPRINT}"
