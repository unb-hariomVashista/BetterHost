# BetterHost VPS Deployment Guide (PM2 + Caddy + Native Services)

This guide walks you through deploying **BetterHost** on a fresh Linux VPS (Ubuntu 22.04 or 24.04 LTS) using **PM2** process manager, native Go/Node runtime builds, and **Caddy** for automatic free HTTPS/SSL certificates.

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

### 1. Install Node.js & pnpm
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo corepack enable
sudo corepack prepare pnpm@latest --activate
```

### 2. Install Go (1.23+)
```bash
wget https://go.dev/dl/go1.23.6.linux-amd64.tar.gz
sudo rm -rf /usr/local/go && sudo tar -C /usr/local -xzf go1.23.6.linux-amd64.tar.gz
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
source ~/.bashrc
go version
```

### 3. Install PM2
```bash
sudo npm install -g pm2
```

### 4. Install Caddy Web Server
```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy
```

---

## 🛡️ Step 2: Configure Firewall (UFW)

Allow SSH, HTTP (Port 80), and HTTPS (Port 443):

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## 📂 Step 3: Clone Repository & Configure Environment Variables

```bash
cd /var/www  # or your preferred directory
sudo git clone https://github.com/unb-hariomVashista/BetterHost.git betterhost
sudo chown -R $USER:$USER /var/www/betterhost
cd /var/www/betterhost
```

### 1. Create Backend Environment File (`apps/api/.env`)

```bash
nano apps/api/.env
```

Paste your production variables:
```env
PORT=8080
ENV=production
DATABASE_URL=postgres://user:password@neondb-host/dbname?sslmode=require
JWT_SECRET=your-super-secure-random-jwt-secret-key-here
STORAGE_DIR=./storage
```

### 2. Create Frontend Environment File (`apps/web/.env.local`)

```bash
nano apps/web/.env.local
```

Paste your frontend variables:
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

---

## 💾 Step 4: Run Database Migrations (If setting up fresh DB)

If using NeonDB or fresh PostgreSQL, apply the schema SQL:

```bash
# If using psql directly with your NeonDB connection string:
psql "postgres://user:password@neondb-host/dbname?sslmode=require" -f apps/api/internal/db/schema.sql
```

---

## 🏗️ Step 5: Build Applications & Start PM2

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

### 3. Start Processes with PM2
```bash
pm2 start ecosystem.config.js --env production
```

### 4. Enable PM2 Auto-Start on System Boot
```bash
pm2 startup
# Copy and execute the command PM2 prints in the terminal!
pm2 save
```

---

## 🌐 Step 6: Configure Caddy Reverse Proxy & HTTPS

Copy `infra/Caddyfile` to `/etc/caddy/Caddyfile`:

```bash
# Edit domain names inside infra/Caddyfile first
nano infra/Caddyfile

# Copy to system Caddy directory
sudo cp infra/Caddyfile /etc/caddy/Caddyfile

# Format and reload Caddy
sudo caddy fmt /etc/caddy/Caddyfile --overwrite
sudo systemctl reload caddy
```

Caddy will automatically request free SSL certificates from Let's Encrypt for `app.yourdomain.com` and `api.yourdomain.com`.

---

## 🔄 Step 7: How to Deploy Updates in the Future

Whenever you push new code to Git, run the automated deployment script on your VPS:

```bash
chmod +x infra/deploy.sh
./infra/deploy.sh
```

---

## 🔍 Helpful PM2 Maintenance Commands

- View running processes: `pm2 status`
- View live application logs: `pm2 logs`
- View Go API logs specifically: `pm2 logs betterhost-api`
- View Next.js logs specifically: `pm2 logs betterhost-web`
- Restart applications: `pm2 restart ecosystem.config.js`
- Zero-downtime reload: `pm2 reload ecosystem.config.js`
