#!/usr/bin/env bash
set -Eeuo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

# Render can provide the CA either as plain text or base64.
# We write it to a temp file and point MYSQL_ATTR_SSL_CA to it.
SSL_CA_PATH="${MYSQL_ATTR_SSL_CA:-/tmp/aiven-ca.pem}"

if [[ -n "${DB_SSL_CA_CONTENT:-}" ]]; then
  printf "%s\n" "${DB_SSL_CA_CONTENT}" > "${SSL_CA_PATH}"
  chmod 600 "${SSL_CA_PATH}"
  export MYSQL_ATTR_SSL_CA="${SSL_CA_PATH}"
elif [[ -n "${DB_SSL_CA_BASE64:-}" ]]; then
  printf "%s" "${DB_SSL_CA_BASE64}" | base64 --decode > "${SSL_CA_PATH}"
  chmod 600 "${SSL_CA_PATH}"
  export MYSQL_ATTR_SSL_CA="${SSL_CA_PATH}"
fi

php artisan storage:link || true
php artisan migrate --force

exec php artisan serve --host=0.0.0.0 --port="${PORT:-10000}"

