#!/usr/bin/env bash
set -euo pipefail

if ! command -v node >/dev/null 2>&1; then
  echo "[setup] 未检测到 Node.js，请安装 Node 18+ 或使用 nvm。"
  exit 1
fi

if [ ! -f .env ]; then
  cp .env.example .env
  echo "[setup] 已复制 .env.example -> .env，请补充 API Key。"
fi

if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi

echo "[setup] 依赖安装完成，可运行 npm run dev。"
