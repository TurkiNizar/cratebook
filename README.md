# Cratebook

Cratebook is a mobile-first vinyl collection and wishlist companion. The product
specification and progress tracker live in [MVP_PLAN.md](./MVP_PLAN.md).

## Quick UI preview

Requirements:

- Node.js 24 or newer
- npm

Install dependencies:

```bash
npm install
```

Run the application:

```bash
npm run dev
```

Open <http://localhost:3000>.

The landing and sign-in screens work without backend configuration. Protected pages
need Supabase; use the full setup below to test sign-in and onboarding.

## Full local setup

Additional requirement: Docker Desktop (or another running Docker-compatible engine).

Start the local Supabase services and apply all migrations:

```bash
npx supabase start
```

The command prints a local API URL, publishable/anon key, Studio URL, and Mailpit URL.
Create `.env.local` from `.env.example`, then use these values:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=paste-the-publishable-or-anon-key-from-supabase-start
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Start the app with `npm run dev`, then:

1. Open <http://localhost:3000/sign-in>.
2. Submit any local test email, for example `collector@example.com`.
3. Open Mailpit at <http://127.0.0.1:54324>.
4. Open the newest email and follow its sign-in link.
5. Choose a username on the onboarding screen.
6. Confirm that you arrive at the empty collection screen.

Supabase Studio is available at <http://127.0.0.1:54323> if you want to inspect the
local database. Stop the local services when finished:

```bash
npx supabase stop
```

## Verification

```bash
npm run lint
npm run typecheck
npm run test:run
npm run build
```

Run browser tests after installing Playwright's browsers:

```bash
npx playwright install
npm run e2e
```

Run database tests while the local Supabase stack is running:

```bash
supabase start
npm run db:test
```

Run the optional real magic-link journey through Mailpit and mobile Chrome:

```bash
RUN_LOCAL_AUTH_E2E=1 npm run e2e -- e2e/local-auth.spec.ts --project=mobile-chrome
```

Regenerate `src/types/database.ts` after a migration with:

```bash
npx supabase gen types typescript --local --schema public
```

Review the generated output before replacing the committed types.

## Environment variables

Only variables prefixed with `NEXT_PUBLIC_` are exposed to the browser. The Supabase
URL and publishable key are intentionally public; never expose the service-role key.

See `.env.example` for the currently required values.
