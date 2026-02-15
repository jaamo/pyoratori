# AGENTS.md

## Project Overview

**pyoratori.com** is a peer-to-peer marketplace for buying and selling bicycles, components, and cycling gear in Finland. The UI is entirely in Finnish.

## Tech Stack

- **Runtime:** Bun
- **Framework:** Next.js 16 (App Router, Server Actions, Turbopack)
- **Language:** TypeScript (strict mode)
- **Database:** SQLite via better-sqlite3 with Drizzle ORM (WAL mode)
- **Auth:** NextAuth v5-beta (email/password, JWT sessions)
- **Styling:** Tailwind CSS v4 + shadcn/ui (Radix UI)
- **Validation:** Zod + react-hook-form
- **Images:** Sharp (WebP conversion, thumbnails)
- **Path alias:** `@/*` maps to `./src/*`

## Project Structure

```
src/
  app/              # Next.js App Router pages and API routes
  components/       # React components (auth, layout, postings, messages, search, ui)
  server/
    actions/        # Server Actions (auth, postings, messages, images, search)
    queries/        # Data fetching functions
    db/             # Database init, schema, seed
  lib/              # Auth config, categories, constants, image processing, validators, utils
  types/            # TypeScript type definitions
  middleware.ts     # Route protection
data/               # SQLite database files
uploads/            # User-uploaded images (original/ and optimized/)
drizzle/            # Migration files
```

## Key Architecture Decisions

- **Finnish routes and UI:** All routes use Finnish names (`/kirjaudu`, `/rekisteroidy`, `/ilmoitus`, `/viestit`, `/profiili`). All user-facing text is in Finnish.
- **Category-attribute system:** Categories are hierarchical (parent-child). Each category maps to specific attributes via `categoryAttributes`. This drives dynamic form fields in `posting-form.tsx` and search filters in `filter-panel.tsx`. Category definitions live in `src/lib/categories.ts`.
- **Prices in cents:** Prices are stored as integers (cents) in the database and converted on read/write.
- **Image pipeline:** Uploads are processed through Sharp — originals saved to `uploads/original/`, then resized to max 1200px (main) and 400px (thumbnail), converted to WebP, and stored in `uploads/optimized/`.
- **Lazy posting expiry:** Postings expire after 180 days. Expiry is checked on read, not via a background job.
- **Polling-based messaging:** Chat uses 5-second polling via `/api/viestit/[id]/poll`, not WebSockets.

## Database

SQLite database at `data/pyoratori.db`. Schema is defined in `src/server/db/schema.ts` using Drizzle ORM.

**Core tables:** `users`, `postings`, `postingAttributes`, `images`, `categories`, `attributes`, `categoryAttributes`, `conversations`, `messages`, `searchAlerts`

**Auth tables (NextAuth):** `sessions`, `accounts`, `verificationTokens`, `passwordResetTokens`

## Commands

```bash
bun dev             # Dev server with Turbopack
npm run build       # Production build
npm run start       # Start production server
npm run lint        # ESLint
npm run db:push     # Apply schema to database
npm run db:seed     # Seed categories and attributes
npm run db:studio   # Drizzle Studio (visual DB editor)
```

## Code Conventions

- Server-side data fetching uses functions in `src/server/queries/`
- Mutations use Server Actions in `src/server/actions/`
- Form validation schemas are in `src/lib/validators.ts`
- UI components from shadcn/ui live in `src/components/ui/`
- Feature components are grouped by domain: `postings/`, `messages/`, `search/`, `auth/`, `layout/`
- Environment variables: `AUTH_SECRET` and `AUTH_URL` in `.env.local`

## Important Files

| File | Purpose |
|------|---------|
| `src/server/db/schema.ts` | Complete database schema (13 tables) |
| `src/lib/categories.ts` | Category tree and attribute definitions (~900 lines) |
| `src/lib/validators.ts` | All Zod validation schemas |
| `src/server/queries/postings.ts` | Search, filtering, and posting retrieval |
| `src/server/actions/postings.ts` | Create/update/delete posting actions |
| `src/server/actions/auth.ts` | Register, login, password reset actions |
| `src/components/postings/posting-form.tsx` | Main posting form with dynamic attributes |
| `src/components/search/home-content.tsx` | Search page orchestration |
| `src/middleware.ts` | Auth-based route protection |


## Brand

Font: 
Space Grotesk from Google Fonts

Colors:
https://coolors.co/cfdbd5-e8eddf-642ca9-242423-333533

#cfdbd5
#e8eddf
#642ca9 - blue
#242423
#333533

Use light grey background with dark grey as text color.

Use blue color a highlight color for:
- buttons
- hover effects
- checkboxes
- other highlights
