# ACMI Console

Open source admin console for ACMI (**A**gentic **C**ontext **M**emory **I**nterface) fleets. Monitor agents, manage work items, handle HITL queues, and search agent memory — all in a single dashboard.

## Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fmadezmedia%2Facmi-console)

## Required Environment Variables

| Env Var | Where | Purpose |
|---|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Vercel / .env.local | Clerk auth frontend key |
| `CLERK_SECRET_KEY` | Vercel / .env.local | Clerk auth secret |
| `CLERK_WEBHOOK_SECRET` | Vercel / .env.local | Clerk webhook verification |
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel / .env.local | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel / .env.local | Supabase service role key |
| `NEXT_PUBLIC_APP_URL` | Vercel / .env.local | Your deployment URL |

### Optional

| Env Var | Purpose |
|---|---|
| `UPSTASH_REDIS_REST_URL` | Default ACMI Redis connection |
| `UPSTASH_REDIS_REST_TOKEN` | Default ACMI Redis token |

## Setup

### 1. Clerk
1. Create a Clerk app at [clerk.com](https://clerk.com)
2. Enable Organizations in Clerk Dashboard
3. Copy publishable + secret keys
4. Set up webhook endpoint: `https://your-domain.com/api/auth/webhook`
5. Subscribe to events: `user.created`, `user.deleted`, `organization.created`, `organization.deleted`

### 2. Supabase
1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the migration: `supabase/migrations/001_initial_schema.sql` in the SQL Editor
3. Copy project URL + service role key

### 3. Deploy
```bash
npm install
npm run build
npm run dev        # local development
```

## QA Testing

```bash
# Test local deployment
npm run test:qa:local

# Test production deployment
npm run test:qa:prod
```

## Architecture

```
┌───────────────────────────────────────────────┐
│              acmi-console (Next.js)             │
│  /admin/*  ← Clerk auth →  /[org]/*           │
│         │                          │            │
│         ▼                          ▼            │
│  ┌──────────────┐       ┌──────────────────┐   │
│  │  Supabase     │       │  Upstash Redis    │   │
│  │  (orgs,       │       │  (ACMI profiles,  │   │
│  │   users,      │       │   signals,        │   │
│  │   config)     │       │   timelines)      │   │
│  └──────────────┘       └──────────────────┘   │
│                                 │               │
│                         ┌───────┴───────┐       │
│                         │ Upstash Vector │       │
│                         │ (memory search)│       │
│                         └───────────────┘       │
└───────────────────────────────────────────────┘
```

## Routes

| Route | Description | Auth |
|---|---|---|
| `/login` | Clerk sign-in | Public |
| `/create-org` | Create organization | User |
| `/admin` | Fleet dashboard | Admin |
| `/admin/agents/[id]` | Agent detail | Admin |
| `/admin/work` | Work items | Admin |
| `/admin/timeline` | Fleet timeline | Admin |
| `/admin/coordination` | Threads + handoffs | Admin |
| `/admin/hitl` | HITL queue | Admin |
| `/admin/settings` | ACMI config | Admin |

### API

| Route | Description |
|---|---|
| `GET /api/acmi/[ns]/[id]?slot=profile\|signals\|timeline` | ACMI entity data |
| `GET /api/acmi/[ns]?orgId=X` | List entities in namespace |
| `POST /api/acmi/event` | Append event to timeline |
| `GET /api/acmi/cat?keys=a,b&orgId=X` | Multi-stream event merge |
| `GET/POST /api/db/organizations` | List/create orgs |
| `GET/PATCH /api/db/organizations/[slug]` | Get/update org |
| `GET/POST /api/db/organizations/[slug]/members` | Manage members |
| `DELETE /api/db/organizations/[slug]/members/[userId]` | Remove member |
| `GET/PUT /api/db/organizations/[slug]/acmi-config` | ACMI connection config |
| `POST /api/auth/webhook` | Clerk webhook receiver |
