#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "🚀 Starting BetterHost Deployment..."

# 1. Pull latest changes from git
echo "📥 Pulling latest git repository changes..."
git pull origin main

# 2. Build Go API Backend Binary
echo "🔨 Building Go API binary..."
mkdir -p apps/api/bin
cd apps/api
go build -o bin/api ./cmd/api
cd ../..

# 3. Install Node.js dependencies & Build Next.js Web Frontend
echo "📦 Installing npm dependencies & building Next.js Web App..."
pnpm install --frozen-lockfile
pnpm --filter web build

# 4. Reload PM2 processes (Zero-downtime reload)
echo "🔄 Reloading PM2 processes..."
pm2 reload ecosystem.config.js --env production

echo "✅ BetterHost Deployment Complete!"
pm2 status
