#!/usr/bin/env bash
set -Eeuo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

# Render/Railway can provide the CA either as plain text or base64.
# Always write to a known writable path and export MYSQL_ATTR_SSL_CA from there.
SSL_CA_PATH="/tmp/aiven-ca.pem"

if [[ -n "${DB_SSL_CA_CONTENT:-}" ]]; then
  CERT_CONTENT="${DB_SSL_CA_CONTENT}"
  # Support values pasted with surrounding quotes and escaped newlines (\n).
  CERT_CONTENT="${CERT_CONTENT%\"}"
  CERT_CONTENT="${CERT_CONTENT#\"}"
  printf "%b\n" "${CERT_CONTENT}" | tr -d '\r' > "${SSL_CA_PATH}"
  if grep -q "BEGIN CERTIFICATE" "${SSL_CA_PATH}" && openssl x509 -in "${SSL_CA_PATH}" -noout >/dev/null 2>&1; then
    chmod 600 "${SSL_CA_PATH}"
    export MYSQL_ATTR_SSL_CA="${SSL_CA_PATH}"
  else
    rm -f "${SSL_CA_PATH}"
    unset MYSQL_ATTR_SSL_CA
  fi
elif [[ -n "${DB_SSL_CA_BASE64:-}" ]]; then
  if printf "%s" "${DB_SSL_CA_BASE64}" | base64 --decode > "${SSL_CA_PATH}" 2>/dev/null \
    && grep -q "BEGIN CERTIFICATE" "${SSL_CA_PATH}" \
    && openssl x509 -in "${SSL_CA_PATH}" -noout >/dev/null 2>&1; then
    chmod 600 "${SSL_CA_PATH}"
    export MYSQL_ATTR_SSL_CA="${SSL_CA_PATH}"
  else
    rm -f "${SSL_CA_PATH}"
    unset MYSQL_ATTR_SSL_CA
  fi
else
  unset MYSQL_ATTR_SSL_CA
fi

php artisan storage:link || true
php artisan migrate --force

exec php artisan serve --host=0.0.0.0 --port="${PORT:-10000}"
