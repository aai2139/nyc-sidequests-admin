# NYC Sidequests Admin

Secure administration and analytics for the NYC Sidequests app. This is a separate Next.js/Vercel application connected to the same Supabase database as the public creation and rating app.

## Access model

Google OAuth authenticates the user. Every `/admin` route and every Server Action then verifies `profiles.is_superadmin = true` before reading or mutating administrative data. The Supabase service-role key is used only in server modules after authorization and is never exposed to the browser.

The first administrator is bootstrapped through the database migration in the public app repository. Ordinary profile writes have column-level privileges, preventing users from changing `is_superadmin` themselves.

## Features

- Analytics for users, generations, ratings, neighborhoods, budgets, and vibes
- Read-only user/profile directory joined with Supabase Auth data
- Create, read, update, hide/publish, and permanently delete AI-generated quests
- Read-only upvote/downvote log joined with users and quests
- Responsive interface matching the Sidequests visual identity

## Local setup

Copy `.env.example` to `.env.local`, configure the shared Supabase project and API keys, then run:

```bash
npm install
npm run dev
```

Add both local and deployed `/auth/callback` URLs to the Supabase Auth redirect allowlist.
