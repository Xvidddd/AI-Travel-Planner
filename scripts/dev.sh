#!/usr/bin/env bash
set -euo pipefail

if [ ! -d node_modules ]; then
  echo "[dev] 未检测到 node_modules，先执行 scripts/setup.sh"
  ./scripts/setup.sh
fi

NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL:-http://localhost:3000} npm run dev
