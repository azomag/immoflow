#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
BACKEND_PUBLIC_DIR="$BACKEND_DIR/public"
FRONTEND_DIR="$ROOT_DIR/frontend"
STOP_XAMPP="${STOP_XAMPP:-0}"
XAMPP_CMD="${XAMPP_CMD:-/opt/lampp/lampp}"

PIDS=()

add_pid() {
  local pid="$1"

  [ "$pid" != "$$" ] || return

  for existing in "${PIDS[@]:-}"; do
    [ "$existing" != "$pid" ] || return
  done

  PIDS+=("$pid")
}

collect_project_pids() {
  local pid
  local cwd
  local args

  for proc in /proc/[0-9]*; do
    pid="${proc##*/}"
    cwd="$(readlink "$proc/cwd" 2>/dev/null || true)"
    args="$(tr '\0' ' ' <"$proc/cmdline" 2>/dev/null || true)"

    if [ "$cwd" = "$FRONTEND_DIR" ]; then
      case "$args" in
        *"next dev"*|*"next-server"*|*"npm run dev"*)
          add_pid "$pid"
          ;;
      esac
    fi

    if [ "$cwd" = "$BACKEND_DIR" ] || [ "$cwd" = "$BACKEND_PUBLIC_DIR" ]; then
      case "$args" in
        *"artisan serve"*|*"resources/server.php"*)
          add_pid "$pid"
          ;;
      esac
    fi
  done
}

stop_pids() {
  if [ "${#PIDS[@]}" -eq 0 ]; then
    printf "No running ImmoFlow app services were found.\n"
    return
  fi

  printf "Stopping ImmoFlow app services: %s\n" "${PIDS[*]}"
  kill "${PIDS[@]}" 2>/dev/null || true
  sleep 1

  local still_running=()
  local pid

  for pid in "${PIDS[@]}"; do
    if kill -0 "$pid" 2>/dev/null; then
      still_running+=("$pid")
    fi
  done

  if [ "${#still_running[@]}" -gt 0 ]; then
    printf "Force stopping remaining services: %s\n" "${still_running[*]}"
    kill -9 "${still_running[@]}" 2>/dev/null || true
  fi
}

stop_xampp() {
  if [ "$STOP_XAMPP" != "1" ]; then
    return
  fi

  if [ ! -x "$XAMPP_CMD" ]; then
    printf "XAMPP was not found at %s. Skipping XAMPP stop.\n" "$XAMPP_CMD"
    return
  fi

  printf "Stopping XAMPP...\n"
  if [ "$(id -u)" -eq 0 ]; then
    "$XAMPP_CMD" stop
    return
  fi

  if command -v sudo >/dev/null 2>&1; then
    sudo "$XAMPP_CMD" stop
    return
  fi

  printf "sudo is required to stop XAMPP from this script.\n" >&2
  exit 1
}

collect_project_pids
stop_pids
stop_xampp
