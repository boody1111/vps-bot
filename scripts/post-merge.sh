#!/bin/bash
set -e
pnpm install --frozen-lockfile
cd bot && npm install && cd ..
pnpm --filter @workspace/api-server run build
BASE_PATH=/ pnpm --filter @workspace/panel run build
