# Pyoratori

Used bicycle marketplace built with Next.js.

## Getting Started

```bash
npm run dev        # Start dev server (Turbopack)
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## CLI Commands

### Database

```bash
npm run db:push          # Push schema changes to database
npm run db:studio        # Open Drizzle Studio (DB browser)
npm run db:seed          # Seed categories, attributes, and attribute values
```

### Import & Classification

```bash
# Import listings from fillaritori.com (with images)
npm run import:fillaritori
npm run import:fillaritori -- --limit=5    # Import max 5 listings

# Classify all imported products using OpenAI LLM
# Detects attributes (brand, frame size, material, gears, etc.) from title/description
# Requires OPENAI_API_KEY in .env.local
npm run classify:product

# Delete all imported products (those with externalUrl)
npm run delete:imported
```

### Build & Lint

```bash
npm run build            # Production build
npm run start            # Start production server
npm run lint             # Run ESLint
```
