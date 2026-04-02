# Deployment Guide — Seminar CMS

Docker + Cloudflare Tunnel deployment on VPS.

## Architecture

```
User → Cloudflare CDN → Cloudflare Tunnel → VPS (Docker)
                                              ├── app (Next.js :3000)
                                              └── db  (PostgreSQL :5432)
```

## Prerequisites

- VPS with Docker & Docker Compose installed
- Cloudflare account with a domain configured
- `cloudflared` installed on VPS ([install guide](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/))

---

## Step 1: Clone & Configure

```bash
git clone <repo-url>
cd seminar-cms
```

Create `.env` from example:

```bash
cp .env.example .env
```

Edit `.env`:

```env
# PostgreSQL (match docker-compose.yml)
DATABASE_URL="postgresql://postgres:postgres@db:5432/seminar_cms"

# Auth.js — generate a random secret
AUTH_SECRET="run: openssl rand -base64 32"
AUTH_URL="https://your-domain.com"

# Google OAuth (optional)
GOOGLE_CLIENT_ID="xxx"
GOOGLE_CLIENT_SECRET="xxx"

# Uploads
UPLOAD_DIR="/app/uploads"
```

> **Important:** Change the default Postgres password in both `.env` and `docker-compose.yml` for production.

---

## Step 2: Start Docker

```bash
# Build and start
docker compose up -d --build

# Check status
docker compose ps

# Run database migrations
docker compose exec app npx prisma migrate deploy

# Seed initial data (first time only)
docker compose exec app npx tsx prisma/seed.ts

# Verify app is running
curl http://localhost:3000
```

---

## Step 3: Cloudflare Tunnel

### 3a. Login to Cloudflare

```bash
cloudflared tunnel login
```

### 3b. Create tunnel

```bash
cloudflared tunnel create seminar-cms
```

This outputs a tunnel ID (e.g. `abc-123-def`). Note it down.

### 3c. Configure tunnel

Create `/etc/cloudflared/config.yml`:

```yaml
tunnel: <TUNNEL_ID>
credentials-file: /root/.cloudflared/<TUNNEL_ID>.json

ingress:
  - hostname: your-domain.com
    service: http://localhost:3000
  - hostname: "*.your-domain.com"
    service: http://localhost:3000
  - service: http_status:404
```

### 3d. Add DNS record

```bash
cloudflared tunnel route dns seminar-cms your-domain.com
```

### 3e. Run tunnel as service

```bash
cloudflared service install
systemctl start cloudflared
systemctl enable cloudflared
```

---

## Step 4: Verify

- Visit `https://your-domain.com` — public site
- Visit `https://your-domain.com/admin/login` — admin login
- Default admin: `admin@tzuchi.org` / `admin123` (**change immediately**)

---

## Common Commands

| Command | Description |
|---|---|
| `docker compose up -d --build` | Build & start all services |
| `docker compose down` | Stop all services |
| `docker compose logs -f app` | Follow app logs |
| `docker compose logs -f db` | Follow database logs |
| `docker compose exec app npx prisma migrate deploy` | Run new migrations |
| `docker compose exec app npx prisma studio` | Open DB editor (port 5555) |
| `docker compose restart app` | Restart app only |
| `systemctl status cloudflared` | Check tunnel status |

## Updating

```bash
git pull
docker compose up -d --build
docker compose exec app npx prisma migrate deploy
```

## Backup Database

```bash
docker compose exec db pg_dump -U postgres seminar_cms > backup_$(date +%Y%m%d).sql
```

## Restore Database

```bash
cat backup.sql | docker compose exec -T db psql -U postgres seminar_cms
```

---

## Troubleshooting

| Issue | Fix |
|---|---|
| App can't connect to DB | Check `DATABASE_URL` uses `db` not `localhost` |
| Tunnel not working | `cloudflared tunnel info seminar-cms` to check status |
| Migrations fail | Check `docker compose logs app` for errors |
| Upload not working | Verify `/app/uploads` volume is mounted and writable |
| Google login fails | Set correct `AUTH_URL` to your public domain |
