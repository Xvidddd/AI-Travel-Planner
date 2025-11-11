#!/usr/bin/env bash
set -euo pipefail

echo "[check] Running lint..."
npm run lint

echo "[check] Running typecheck..."
npm run typecheck
