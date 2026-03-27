# CLAUDE.md

慈濟全球共善學思會 — Seminar CMS (Multi-site Event Management)

## Quick Start

```bash
npm install           # Install dependencies
npm run dev           # Start dev server → http://localhost:3000
```

## Database Setup (requires PostgreSQL + Redis running)

```bash
npx prisma migrate dev  # Create tables
npm run db:seed         # Seed with symposium data
npm run db:studio       # Visual database editor
```

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: PostgreSQL + Prisma ORM
- **Cache**: Redis (ioredis)
- **Auth**: Auth.js (NextAuth v5)
- **Images**: Sharp (compress → WebP, stored on disk)
- **Icons**: Lucide React
- **Fonts**: Inter, Noto Serif TC, Noto Sans TC

## Project Structure

```
src/
├── app/
│   ├── (public)/          # Public event website
│   │   ├── page.tsx       # Homepage
│   │   ├── programme/     # 三日議程 (Option C: Editorial)
│   │   ├── speakers/      # 主講嘉賓
│   │   └── exhibition/    # 明心 Exhibition
│   ├── admin/             # CMS dashboard
│   │   ├── page.tsx       # Dashboard
│   │   ├── speakers/      # Speaker management
│   │   ├── programme/     # Programme editor
│   │   ├── papers/        # Paper management
│   │   └── ...            # venues, registrations, settings
│   └── api/               # API routes
├── components/
│   ├── public/            # Navbar, Footer, Hero, etc.
│   └── admin/             # Sidebar, TopBar, tables
├── lib/
│   ├── prisma.ts          # DB client
│   ├── redis.ts           # Cache client
│   ├── auth.ts            # Auth config
│   └── upload.ts          # Image processing
prisma/
├── schema.prisma          # Database schema
└── seed.ts                # Seed data
nginx/
└── seminar-cms.conf       # Production Nginx config
```

## Design Tokens

- Cream: #F5F1EB, Dark: #1A1816, Gold: #9B7B2F, Green: #3D5A3E
- Sidebar: #3D3A36, Border: #E5E0D8, Muted: #5A554B

## Deployment

No Docker. Direct install on VPS + Cloudflare DNS/CDN.

```bash
npm run build && npm start  # Production
```

## Admin Login

Default: admin@tzuchi.org / admin123 (change in production!)
