#!/usr/bin/env bash
set -u

LOG_FILE="build-log.txt"

{
  echo "Path Tracker build"
  echo "Started: $(date -Is)"
  echo

  powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "npm run build"

  EXIT_CODE=$?
  echo
  echo "Finished: $(date -Is)"
  echo "Exit code: $EXIT_CODE"
  exit "$EXIT_CODE"
} > "$LOG_FILE" 2>&1
