# Community Hub — Private Community Platform

A private, invite-only community platform with classifieds marketplace and discussion board.

## Features

- 🔐 **Invite-only access** — only whitelisted emails can sign up (magic link login)
- 🏷️ **Classifieds marketplace** — buy, sell, rent, services, events with photo uploads
- 💬 **Discussion board** — separate forum with categories, pinning, replies
- ⚙️ **Admin panel** — manage whitelist, categories, users, view stats
- 🌙 **Dark/light mode** — toggle theme
- 📱 **Mobile-friendly** — fully responsive design
- 🌍 **Multilingual content** — interface in English, post in any language

## Tech Stack

- **Next.js 14+** (App Router, TypeScript)
- **Supabase** (Auth, Database, Storage)
- **Tailwind CSS**

## Setup Guide (step by step)

### 1. Create a Supabase project (free)

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click "New Project" and pick a name + password
3. Wait for it to finish setting up (~1 minute)

### 2. Run the database migration

1. In your Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click "New query"
3. Copy the entire contents of `supabase/migration.sql` and paste it
4. Click "Run" — this creates all tables, policies, and seed data

### 3. Get your API keys

1. In Supabase dashboard, go to **Settings → API**
2. Copy:
   - **Project URL** (looks like `https://xxxx.supabase.co`)
   - **anon public key** (long string starting with `eyJ...`)

### 4. Configure the app

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Paste your Supabase URL and anon key into `.env.local`

### 5. Add yourself as admin

In Supabase SQL Editor, run:
```sql
-- Add your email to whitelist
INSERT INTO email_whitelist (email) VALUES ('your@email.com');

-- After you sign up and log in, make yourself admin:
UPDATE profiles SET is_admin = true WHERE email = 'your@email.com';
```

### 6. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 7. Deploy to Vercel (free)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repo
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy!

### 8. Update Supabase auth redirect

After deploying, go to Supabase → **Authentication → URL Configuration**:
- Set **Site URL** to your Vercel URL (e.g. `https://your-app.vercel.app`)
- Add it to **Redirect URLs** too

## Managing Your Community

### Adding members
Go to Admin → Whitelist → add emails one by one or bulk import

### Categories
Go to Admin → Categories → add/remove for both classifieds and discussions

### Moderation
- Admin can delete any listing or discussion
- Admin can ban users
- Admin can pin important discussions

## Cost

- **Supabase free tier**: 500MB database, 1GB storage, 50K auth users
- **Vercel free tier**: unlimited deploys for personal projects
- **Total: $0/month** for a few hundred users ✅
