#!/usr/bin/env bash
set -euo pipefail

CERT_DIR="$(dirname "$0")/../certs"
mkdir -p "$CERT_DIR"
KEY="$CERT_DIR/dev-key.pem"
CERT="$CERT_DIR/dev-cert.pem"

# Use subjectAltName so mobile browsers accept the cert for localhost & optional LAN IP
LAN_IP=${1:-}

OPENSSL_CONF_FILE=$(mktemp)
trap 'rm -f "$OPENSSL_CONF_FILE"' EXIT

cat > "$OPENSSL_CONF_FILE" <<EOF
[req]
default_bits=2048
distinguished_name=dn
prompt=no
x509_extensions=v3
[dn]
C=US
ST=Dev
L=Dev
O=Boxly
OU=Dev
CN=localhost
[v3]
basicConstraints=CA:FALSE
keyUsage = digitalSignature, keyEncipherment
extendedKeyUsage=serverAuth
subjectAltName=@alt_names
[alt_names]
DNS.1=localhost
IP.1=127.0.0.1
EOF

if [[ -n "$LAN_IP" ]]; then
  echo "IP.2=$LAN_IP" >> "$OPENSSL_CONF_FILE"
fi

if [[ -f "$KEY" && -f "$CERT" ]]; then
  echo "Existing certs found. Overwrite? (y/N)" >&2
  read -r ans
  if [[ ! "$ans" =~ ^[Yy]$ ]]; then
    echo "Aborting."
    exit 0
  fi
fi

echo "Generating self-signed certificate (LAN_IP=${LAN_IP:-none})..." >&2
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout "$KEY" \
  -out "$CERT" \
  -config "$OPENSSL_CONF_FILE" >/dev/null 2>&1

echo "Created: $KEY" >&2
echo "Created: $CERT" >&2
echo "Done. Start vite with: VITE_HTTPS=1 npm run dev" >&2
