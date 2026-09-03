# BetterHost VPS Deployment Guide (PM2 + Caddy/Nginx)

This guide walks you through deploying **BetterHost** on a Linux VPS (Ubuntu 22.04 / 24.04 LTS) using **PM2** process manager, native Go/Node runtime builds, and **Caddy** (or **Nginx**) for SSL/HTTPS.

> [!CAUTION]
> **SAFETY FOR EXISTING HOSTED APPS ON YOUR SERVER:**
> If you already have an application running on this server:
> 1. **Do NOT overwrite your existing web server configuration.** If you already use Nginx or Caddy, **APPEND** the BetterHost rules to your existing config instead of replacing it.
> 2. **Custom Ports**: BetterHost is configured by default to use ports **`3005`** (Next.js) and **`8085`** (Go API) so it will **NOT** collide with existing apps using default ports `3000` or `8080`.
> 3. **PM2**: PM2 natively handles multiple apps independently! Running `pm2 start ecosystem.config.js` will simply append BetterHost to your existing PM2 process list without disturbing existing apps.

---

## 📋 Prerequisites

1. **VPS Server**: Ubuntu 22.04 LTS / 24.04 LTS with SSH root or sudo user.
2. **Domain Name**: A domain configured with DNS **A Records** pointing to your VPS IP:
   - `app.yourdomain.com` -> `YOUR_VPS_IP`
   - `api.yourdomain.com` -> `YOUR_VPS_IP`
3. **Database**: Your existing **NeonDB** connection string (or local PostgreSQL).

---

## 🛠️ Step 1: Install Required Runtime Dependencies on VPS

SSH into your VPS and update package indexes:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential ufw
```

### 1. Install Node.js & pnpm (Skip if already installed)
```bash
# Check if node exists: node -v
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo corepack enable
sudo corepack prepare pnpm@latest --activate
```

### 2. Install Go 1.23+ (Skip if already installed)
```bash
# Check if go exists: go version
wget https://go.dev/dl/go1.23.6.linux-amd64.tar.gz
sudo rm -rf /usr/local/go && sudo tar -C /usr/local -xzf go1.23.6.linux-amd64.tar.gz
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
source ~/.bashrc
```

### 3. Install PM2 (Skip if already installed)
```bash
sudo npm install -g pm2
```

---

## 📂 Step 2: Clone Repository & Configure Environment Variables

```bash
cd /var/www  # or your preferred web directory
sudo git clone https://github.com/unb-hariomVashista/BetterHost.git betterhost
sudo chown -R $USER:$USER /var/www/betterhost
cd /var/www/betterhost
```

### 1. Backend Environment (`apps/api/.env`)

```bash
nano apps/api/.env
```

Paste your production variables (using port 8085):
```env
PORT=8085
ENV=production
DATABASE_URL=postgres://user:password@neondb-host/dbname?sslmode=require
JWT_SECRET=your-super-secure-random-jwt-secret-key-here
STORAGE_DIR=./storage
```

### 2. Frontend Environment (`apps/web/.env.local`)

```bash
nano apps/web/.env.local
```

Paste your frontend variables:
```env
WEB_PORT=3005
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

---

## 🏗️ Step 3: Build Applications & Start PM2

### 1. Build Go API
```bash
mkdir -p apps/api/bin
cd apps/api
go build -o bin/api ./cmd/api
cd ../..
```

### 2. Install Node Dependencies & Build Next.js
```bash
pnpm install
pnpm --filter web build
```

### 3. Start Processes safely with PM2
```bash
# This appends betterhost-api and betterhost-web to PM2 without touching existing apps
pm2 start ecosystem.config.js --env production
pm2 save
```

Check running processes:
```bash
pm2 status
```

---

## 🌐 Step 4: Configure Reverse Proxy (Caddy OR Nginx)

Choose the section matching your existing web server:

---

### Option A: If your server uses CADDY

Do **NOT** overwrite `/etc/caddy/Caddyfile`. Instead, append the BetterHost configuration to the end of your existing `Caddyfile`:

```bash
sudo nano /etc/caddy/Caddyfile
```

Add these lines at the bottom:
```caddy
app.yourdomain.com {
    reverse_proxy localhost:3005
}

api.yourdomain.com {
    reverse_proxy localhost:8085
}
```

Reload Caddy safely without downtime:
```bash
sudo caddy fmt /etc/caddy/Caddyfile --overwrite
sudo systemctl reload caddy
```

---

### Option B: If your server uses NGINX

Copy the provided `infra/nginx.conf` into `/etc/nginx/sites-available/betterhost`:

```bash
sudo cp infra/nginx.conf /etc/nginx/sites-available/betterhost
sudo nano /etc/nginx/sites-available/betterhost  # Edit domain names
sudo ln -s /etc/nginx/sites-available/betterhost /etc/nginx/sites-enabled/
```

Test Nginx config and reload safely:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

If using Certbot for SSL on Nginx:
```bash
sudo certbot --nginx -d app.yourdomain.com -d api.yourdomain.com
```

---

## 🔄 Step 5: Deploying Updates in the Future

Whenever you push new code to Git, run the automated deployment script on your VPS:

```bash
chmod +x infra/deploy.sh
./infra/deploy.sh
```

---

## 🔍 Helpful PM2 Maintenance Commands

- View all running processes: `pm2 status`
- View live application logs: `pm2 logs`
- View BetterHost API logs specifically: `pm2 logs betterhost-api`
- View BetterHost Web logs specifically: `pm2 logs betterhost-web`
- Zero-downtime reload: `pm2 reload ecosystem.config.js`
