# RevConnect-1 — Developer Handoff Document

**Date:** June 3, 2026  
**Supabase Project:** `revconnectone` (ID: `likxahlegjguyowcfvzr`)  
**Supabase URL:** `https://likxahlegjguyowcfvzr.supabase.co`

---

## What's Built

### Application Scaffold (Next.js 14, App Router)
| File | Purpose |
|------|---------|
| `app/page.tsx` | Public landing page |
| `app/layout.tsx` | Root layout with PWA metadata |
| `app/(auth)/login/page.tsx` | Email + OAuth (Google, Discord) login |
| `app/(auth)/register/page.tsx` | Registration with profile creation |
| `app/(auth)/forgot-password/page.tsx` | Password reset flow |
| `app/(dashboard)/layout.tsx` | Authenticated shell with nav + sidebar |
| `app/(dashboard)/garage/page.tsx` | **Category 9** — Personal Garage & Social Hub |
| `app/(dashboard)/events/page.tsx` | **Category 1** — Car Meets & Event Discovery |
| `app/(dashboard)/parts/page.tsx` | **Category 4** — Parts Search Engine |
| `app/(dashboard)/mechanic/page.tsx` | **Category 5** — AI Mechanic Agent |
| `app/(dashboard)/car-wash/page.tsx` | **Category 6** — Car Wash Locator |
| `app/(dashboard)/auctions/page.tsx` | **Category 7** — Auction Discovery |
| `app/(dashboard)/insurance/page.tsx` | **Category 8** — Insurance Quotes |
| `app/(dashboard)/car-search/page.tsx` | **Category 3** — Car Search Engine |
| `app/(dashboard)/vendors/page.tsx` | **Category 2** — Vendor Marketplace |
| `app/(dashboard)/store/page.tsx` | **Category 10** — Merch Store |
| `app/api/webhooks/stripe/route.ts` | Stripe webhook handler |
| `app/api/store/checkout/route.ts` | Stripe Checkout session creation |
| `app/auth/callback/route.ts` | OAuth callback + profile creation |
| `middleware.ts` | Auth-gating for all dashboard routes |

### Database (Supabase — Production Live)
All migrations applied to `likxahlegjguyowcfvzr`. Tables created:

**Core User Data**
- `profiles` — extends auth.users, membership tier, Rev Points, social links
- `vehicles` — full vehicle profiles with paint protection, build cost, status
- `vehicle_modifications` — mod list with cost tracking, photos, dyno gains
- `vehicle_maintenance` — service history with mileage reminders
- `vehicle_performance_logs` — dyno, drag, autocross, lap time records

**Community**
- `clubs` + `club_members` — club creation, membership, roles
- `events` + `event_attendees` — events with QR check-in, GPS coords
- `posts` + `post_likes` + `post_comments` — community feed
- `follows` — follow/unfollow with auto-counter triggers

**Commerce & Discovery**
- `marketplace_listings` — P2P parts & vehicle sales
- `vendors` — geo-targeted vendor advertising
- `auctions` — aggregated auction listings
- `car_washes` — coating-safe wash locator
- `insurance_quotes` — saved quotes per vehicle
- `products` + `orders` + `order_items` — full e-commerce

**Platform**
- `notifications` — unified notification center
- `saved_searches` — alerts for vehicles, parts, auctions, events
- `auction_watchlist` — per-user auction tracking

**Triggers (all live)**
- `update_updated_at` — auto timestamps on all tables
- `sync_follow_counts` — follower/following counters
- `sync_event_attendee_count` — real-time attendee count
- `sync_club_member_count` — club member counter
- `sync_post_like_count` + `sync_post_comment_count`
- `sync_vehicle_build_cost` — running total from mod list

**Row-Level Security** — enabled on all 24 tables with appropriate policies.

### Storage Buckets (Supabase — Production Live)
| Bucket | Public | Max Size | Types |
|--------|--------|----------|-------|
| `avatars` | ✅ | 5 MB | jpg, png, webp, gif |
| `banners` | ✅ | 10 MB | jpg, png, webp |
| `vehicles` | ✅ | 20 MB | jpg, png, webp, mp4 |
| `posts` | ✅ | 20 MB | jpg, png, webp, mp4 |
| `events` | ✅ | 20 MB | jpg, png, webp, mp4 |
| `products` | ✅ | 10 MB | jpg, png, webp |
| `vendors` | ✅ | 10 MB | jpg, png, webp |
| `receipts` | 🔒 | 5 MB | jpg, png, pdf |
| `dyno-sheets` | 🔒 | 5 MB | jpg, png, pdf |
| `timeslips` | 🔒 | 5 MB | jpg, png |

---

## Deployment — Step by Step

### Step 1: Create GitHub Repository
```bash
# In the revconnect-1 folder
git init
git add .
git commit -m "feat: initial RevConnect-1 scaffold"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/revconnect-1.git
git push -u origin main
```

### Step 2: Connect to Vercel
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your `revconnect-1` GitHub repository
3. Framework: **Next.js** (auto-detected)
4. Root directory: `/` (default)
5. Do NOT deploy yet — add env vars first (Step 3)

### Step 3: Set Environment Variables in Vercel
In your Vercel project → Settings → Environment Variables, add:

```
NEXT_PUBLIC_SUPABASE_URL=https://likxahlegjguyowcfvzr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxpa3hhaGxlZ2pndXlvd2NmdnpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxMzE4OTUsImV4cCI6MjA5NDcwNzg5NX0.fKskB2pDz6qpnzjnNzHGB2NEpOfVFPWxd573_rndDfU
SUPABASE_SERVICE_ROLE_KEY=<get from Supabase Dashboard → Settings → API → service_role>
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<your Stripe publishable key>
STRIPE_SECRET_KEY=<your Stripe secret key>
STRIPE_WEBHOOK_SECRET=<set after registering webhook in Step 5>
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NEXT_PUBLIC_APP_NAME=RevConnect-1
```

### Step 4: Deploy
Click **Deploy** in Vercel. First build takes ~2 minutes.

### Step 5: Register Stripe Webhook
1. Stripe Dashboard → Developers → Webhooks → Add endpoint
2. URL: `https://your-domain.vercel.app/api/webhooks/stripe`
3. Events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the webhook signing secret → add as `STRIPE_WEBHOOK_SECRET` in Vercel

### Step 6: Configure Supabase Auth
In Supabase Dashboard → Authentication → URL Configuration:
- **Site URL:** `https://your-domain.vercel.app`
- **Redirect URLs:** `https://your-domain.vercel.app/auth/callback`

To enable Google OAuth:
- Supabase → Authentication → Providers → Google
- Add Client ID + Secret from [Google Cloud Console](https://console.cloud.google.com)

### Step 7: GitHub Actions Secrets
In GitHub repo → Settings → Secrets → Actions, add:
```
VERCEL_TOKEN        — from vercel.com/account/tokens
VERCEL_ORG_ID       — from .vercel/project.json after running vercel link
VERCEL_PROJECT_ID   — from .vercel/project.json
```

---

## Stripe Products to Create

Create these in your Stripe Dashboard → Products:

| Product | Monthly Price | Annual Price | Env Var |
|---------|--------------|--------------|---------|
| Builder Membership | $9.99/mo | $99/yr | `STRIPE_PRICE_BUILDER_MONTHLY` / `STRIPE_PRICE_BUILDER_ANNUAL` |
| Racer Membership | $19.99/mo | $199/yr | `STRIPE_PRICE_RACER_MONTHLY` / `STRIPE_PRICE_RACER_ANNUAL` |
| Legend Membership | $39.99/mo | $399/yr | `STRIPE_PRICE_LEGEND_MONTHLY` / `STRIPE_PRICE_LEGEND_ANNUAL` |

After creating, add the price IDs as env vars in Vercel.

---

## Local Development

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/revconnect-1.git
cd revconnect-1

# Install dependencies
npm install

# Create local env file
cp .env.example .env.local
# Add SUPABASE_SERVICE_ROLE_KEY and Stripe keys to .env.local

# Run dev server
npm run dev
# Open http://localhost:3000
```

---

## Next Build Priorities (Phase 2)

### Highest Impact — Build These First

1. **Vehicle Add Modal** (`/garage`) — Form to add vehicles with photo upload to Supabase Storage
2. **AI Mechanic Chat** (`/mechanic`) — Wire OpenAI GPT-4 API, stream responses, inject vehicle context
3. **Event Create Flow** (`/events`) — Full event creation with map picker and club linking
4. **Stripe Membership Flow** — Subscription checkout for Builder/Racer/Legend tiers
5. **Notification System** — Supabase Realtime subscription + push notifications

### Phase 3 — AI Agents
Each agent needs an OpenAI Assistant or fine-tuned prompt chain:
- **Parts Agent** — vehicle context injection + price comparison API calls
- **Insurance Agent** — carrier API integrations (start with redirect/affiliate links)
- **Auction Agent** — Copart/IAAI API for real listings
- **Car Wash Agent** — Google Places API integration

### Phase 4 — Mobile
- PWA icons + service worker (add to `public/`)
- React Native app with Expo (share Supabase client + types)
- Push notifications via Expo + Supabase Edge Functions

---

## Key Credentials Summary

| Service | Value |
|---------|-------|
| Supabase Project ID | `likxahlegjguyowcfvzr` |
| Supabase URL | `https://likxahlegjguyowcfvzr.supabase.co` |
| Supabase Anon Key | See `.env.example` |
| Vercel Team | `cbibs1217-5839s-projects` (team_1gsO4x9E6EzMWidtFtTWXCab) |
| Database Region | us-west-1 |

---

## Schema Migration Files
All migrations are in `supabase/migrations/`. To apply to a new environment:
```bash
# Using Supabase CLI
supabase db push
# Or apply manually via Supabase SQL Editor
```

---

*Built by RevConnect-1 AI Development System — June 2026*
