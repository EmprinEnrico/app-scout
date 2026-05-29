#!/usr/bin/env bash
set -u

powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "node .\\log-server.cjs"
