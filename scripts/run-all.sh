#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
BACKEND_PORT_IS_SET="${BACKEND_PORT+x}"
FRONTEND_PORT_IS_SET="${FRONTEND_PORT+x}"
BACKEND_HOST="${BACKEND_HOST:-127.0.0.1}"
BACKEND_PORT="${BACKEND_PORT:-8001}"
FRONTEND_HOST="${FRONTEND_HOST:-127.0.0.1}"
FRONTEND_PORT="${FRONTEND_PORT:-3001}"
START_XAMPP="${START_XAMPP:-1}"
XAMPP_CMD="${XAMPP_CMD:-/opt/lampp/lampp}"

PIDS=()
BACKEND_ALREADY_RUNNING=0
FRONTEND_ALREADY_RUNNING=0

cleanup() {
  local status=$?

  if [ "${#PIDS[@]}" -gt 0 ]; then
    printf "\nStopping ImmoFlow services...\n"
    for pid in "${PIDS[@]}"; do
      kill "$pid" 2>/dev/null || true
    done
    wait 2>/dev/null || true
  fi

  exit "$status"
}

trap cleanup EXIT INT TERM

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    printf "Missing required command: %s\n" "$1" >&2
    exit 1
  fi
}

is_port_available() {
  php -r '$s = @stream_socket_server("tcp://".$argv[1].":".$argv[2]); if ($s) { fclose($s); exit(0); } exit(1);' "$1" "$2"
}

is_tcp_listening() {
  command -v php >/dev/null 2>&1 || return 1
  php -r '$s = @fsockopen($argv[1], (int) $argv[2], $errno, $errstr, 0.2); if ($s) { fclose($s); exit(0); } exit(1);' "$1" "$2"
}

fail_port_in_use() {
  local name="$1"
  local host="$2"
  local port="$3"
  local override="$4"

  printf "%s port %s:%s is already in use.\n" "$name" "$host" "$port" >&2
  printf "Stop the running service or use another port: %s=<another-port> npm run dev\n" "$override" >&2
  exit 1
}

select_port() {
  local var_name="$1"
  local name="$2"
  local host="$3"
  local port="$4"
  local override="$5"
  local was_set="$6"
  local candidate

  if is_port_available "$host" "$port"; then
    printf -v "$var_name" "%s" "$port"
    return
  fi

  if [ -n "$was_set" ] || [ "${STRICT_PORTS:-0}" = "1" ]; then
    fail_port_in_use "$name" "$host" "$port" "$override"
  fi

  candidate=$((port + 1))
  while [ "$candidate" -le "$((port + 100))" ]; do
    if is_port_available "$host" "$candidate"; then
      printf "%s port %s:%s is already in use. Using %s:%s instead.\n" "$name" "$host" "$port" "$host" "$candidate"
      printf -v "$var_name" "%s" "$candidate"
      return
    fi

    candidate=$((candidate + 1))
  done

  fail_port_in_use "$name" "$host" "$port" "$override"
}

find_existing_process_port() {
  local dir="$1"
  local pattern="$2"
  local pid
  local cwd
  local args
  local port

  command -v pgrep >/dev/null 2>&1 || return 1

  while IFS= read -r pid; do
    cwd="$(readlink "/proc/$pid/cwd" 2>/dev/null || true)"
    [ "$cwd" = "$dir" ] || continue

    args="$(tr '\0' ' ' <"/proc/$pid/cmdline" 2>/dev/null || true)"
    port="$(printf "%s\n" "$args" | sed -nE 's/.*--port[= ]+([0-9]+).*/\1/p' | head -n 1)"

    if [ -n "$port" ]; then
      printf "%s\n" "$port"
      return 0
    fi
  done < <(pgrep -f "$pattern" || true)

  return 1
}

set_env_value() {
  local file="$1"
  local key="$2"
  local value="$3"

  if grep -q "^$key=" "$file"; then
    sed -i "s|^$key=.*|$key=$value|" "$file"
  else
    printf "%s=%s\n" "$key" "$value" >>"$file"
  fi
}

sync_frontend_env() {
  local file="$FRONTEND_DIR/.env.local"

  set_env_value "$file" NEXT_PUBLIC_API_BASE_URL "http://$BACKEND_HOST:$BACKEND_PORT"
  set_env_value "$file" NEXTAUTH_URL "http://$FRONTEND_HOST:$FRONTEND_PORT"
}

sync_backend_env() {
  local file="$BACKEND_DIR/.env"

  set_env_value "$file" APP_URL "http://$BACKEND_HOST:$BACKEND_PORT"
  set_env_value "$file" CORS_ALLOWED_ORIGINS "http://localhost:3000,http://127.0.0.1:3000,http://localhost:$FRONTEND_PORT,http://$FRONTEND_HOST:$FRONTEND_PORT"
  set_env_value "$file" SANCTUM_STATEFUL_DOMAINS "localhost,localhost:3000,localhost:$FRONTEND_PORT,localhost:$BACKEND_PORT,127.0.0.1,127.0.0.1:3000,$FRONTEND_HOST:$FRONTEND_PORT,$BACKEND_HOST:$BACKEND_PORT,::1"
}

ensure_backend() {
  require_command php

  if [ ! -d "$BACKEND_DIR/vendor" ]; then
    require_command composer
    printf "Installing backend dependencies...\n"
    (cd "$BACKEND_DIR" && composer install)
  fi

  if [ ! -f "$BACKEND_DIR/.env" ]; then
    printf "Creating backend/.env from backend/.env.example...\n"
    cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
  fi

  if ! grep -Eq '^APP_KEY=.+$' "$BACKEND_DIR/.env"; then
    printf "Generating Laravel application key...\n"
    (cd "$BACKEND_DIR" && php artisan key:generate --ansi)
  fi
}

ensure_frontend() {
  require_command npm

  if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
    printf "Installing frontend dependencies...\n"
    (cd "$FRONTEND_DIR" && npm install)
  fi

  if [ ! -f "$FRONTEND_DIR/.env.local" ]; then
    printf "Creating frontend/.env.local from frontend/.env.example...\n"
    cp "$FRONTEND_DIR/.env.example" "$FRONTEND_DIR/.env.local"
  fi
}

run_xampp() {
  if [ "$START_XAMPP" != "1" ]; then
    return
  fi

  if [ ! -x "$XAMPP_CMD" ]; then
    printf "XAMPP was not found at %s. Skipping XAMPP startup.\n" "$XAMPP_CMD"
    return
  fi

  printf "Starting XAMPP Apache and MySQL...\n"

  if is_tcp_listening 127.0.0.1 80 && is_tcp_listening 127.0.0.1 3306; then
    printf "XAMPP Apache and MySQL already appear to be running.\n"
    return
  fi

  if [ "$(id -u)" -eq 0 ]; then
    "$XAMPP_CMD" start
    return
  fi

  if command -v sudo >/dev/null 2>&1; then
    if sudo -n true 2>/dev/null || [ -t 0 ]; then
      sudo "$XAMPP_CMD" start
      return
    fi
  fi

  printf "XAMPP needs admin permission on this machine.\n" >&2
  printf "Run this once in another terminal, then start the project again:\n" >&2
  printf "  sudo %s start\n" "$XAMPP_CMD" >&2
  exit 1
}

start_service() {
  local name="$1"
  local dir="$2"
  shift 2

  printf "Starting %s...\n" "$name"
  (
    cd "$dir"
    "$@"
  ) &

  PIDS+=("$!")
}

run_xampp
ensure_backend
ensure_frontend

EXISTING_BACKEND_PORT="$(find_existing_process_port "$BACKEND_DIR" "artisan serve" || true)"
if [ -n "$EXISTING_BACKEND_PORT" ] && { [ -z "$BACKEND_PORT_IS_SET" ] || [ "$EXISTING_BACKEND_PORT" = "$BACKEND_PORT" ]; }; then
  BACKEND_PORT="$EXISTING_BACKEND_PORT"
  BACKEND_ALREADY_RUNNING=1
else
  select_port BACKEND_PORT "Backend" "$BACKEND_HOST" "$BACKEND_PORT" BACKEND_PORT "$BACKEND_PORT_IS_SET"
fi

EXISTING_FRONTEND_PORT="$(find_existing_process_port "$FRONTEND_DIR" "next dev" || true)"
if [ -n "$EXISTING_FRONTEND_PORT" ] && { [ -z "$FRONTEND_PORT_IS_SET" ] || [ "$EXISTING_FRONTEND_PORT" = "$FRONTEND_PORT" ]; }; then
  FRONTEND_PORT="$EXISTING_FRONTEND_PORT"
  FRONTEND_ALREADY_RUNNING=1
else
  select_port FRONTEND_PORT "Frontend" "$FRONTEND_HOST" "$FRONTEND_PORT" FRONTEND_PORT "$FRONTEND_PORT_IS_SET"
fi

sync_backend_env
sync_frontend_env
(cd "$BACKEND_DIR" && php artisan config:clear >/dev/null)

printf "\nImmoFlow is starting:\n"
printf "  Backend:  http://%s:%s\n" "$BACKEND_HOST" "$BACKEND_PORT"
printf "  Frontend: http://%s:%s\n\n" "$FRONTEND_HOST" "$FRONTEND_PORT"
printf "  phpMyAdmin: http://127.0.0.1/phpmyadmin/\n\n"

if [ "$BACKEND_ALREADY_RUNNING" = "1" ]; then
  printf "Laravel API is already running.\n"
else
  start_service "Laravel API" "$BACKEND_DIR" php artisan serve --host="$BACKEND_HOST" --port="$BACKEND_PORT"
fi

if [ "$FRONTEND_ALREADY_RUNNING" = "1" ]; then
  printf "Next.js frontend is already running.\n"
else
  start_service "Next.js frontend" "$FRONTEND_DIR" env \
    NEXT_PUBLIC_API_BASE_URL="http://$BACKEND_HOST:$BACKEND_PORT" \
    NEXTAUTH_URL="http://$FRONTEND_HOST:$FRONTEND_PORT" \
    npm run dev -- --hostname "$FRONTEND_HOST" --port "$FRONTEND_PORT"
fi

if [ "${#PIDS[@]}" -eq 0 ]; then
  printf "All ImmoFlow services are already running.\n"
  exit 0
fi

wait -n "${PIDS[@]}"
