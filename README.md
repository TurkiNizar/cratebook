# Cratebook

Cratebook is a mobile-first vinyl collection and wishlist companion. The product
specification and progress tracker live in [MVP_PLAN.md](./MVP_PLAN.md).

The first catalogue integration will use MusicBrainz metadata with Cover Art Archive
artwork. The reviewed provider, attribution, artwork, caching, and rate-limit policy
is documented in [docs/catalogue-provider.md](./docs/catalogue-provider.md).

Production: [https://cratebook.vercel.app](https://cratebook.vercel.app)

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
need Supabase; use the full setup below to test sign-in, onboarding, collection entry,
and wishlist management.

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
7. Choose **Add → Add manually**, enter an artist and title, and save the record.
8. Confirm the saved record appears in the collection grid with its release details.
9. Open the record, choose **Edit record**, add a favorite, rating, condition,
   acquisition detail, price, private note, or comma-separated tags, and confirm the
   saved details appear on its detail page. Favorite records and tags also appear on
   the collection card.
10. Try adding the same artist and title again with different capitalization or spacing.
    Confirm the possible-duplicate warning offers the existing copy for review and
    still allows another physical copy to be added.
11. Add a second record, then search by artist, title, label, catalog number, tag, or
    private note. Try the favorite, purchase-state, format, and condition filters and
    the newest-added, recently-acquired, artist, and title sort options.
12. Choose **Remove from collection**, cancel once, then confirm removal. Remove the
    remaining test copy and verify the collection returns to its empty state.
13. Open **Wishlist**, add an artist and title, then optionally set priority, preferred
    edition, maximum price, notes, and visibility.
14. Open the saved wish, edit its preferences, and confirm maximum price and private
    notes remain clearly identified as private.
15. Choose **Move to collection**, review the carried-over wishlist guidance, enter
    any copy-specific condition, acquisition, price, rating, favorite, note, or tag
    details, and complete the move.
16. Confirm the release metadata and edited notes appear on the new private collection
    copy and that the original wishlist item is gone.
17. Add another wishlist item, choose **Remove from wishlist**, cancel once, then
    confirm removal and verify the wishlist returns to its empty state.

Supabase Studio is available at <http://127.0.0.1:54323> if you want to inspect the
local database. Stop the local services when finished:

```bash
npx supabase stop
```

## Hosted Supabase and Vercel

The Milestone 1 production environment is live at
[cratebook.vercel.app](https://cratebook.vercel.app), backed by hosted Supabase. The
homepage, passwordless authentication, onboarding, protected-route redirects,
collection access, profile editing, PWA manifest, and installable icons have been
smoke-tested in production.

For the MVP, use one hosted Supabase project for both Vercel Preview and Production.
A separate staging database or Supabase branching setup can be added later. The
instructions below are retained as the recovery and environment-recreation guide.

### 1. Create the hosted Supabase project

1. Open the [Supabase dashboard](https://supabase.com/dashboard) and select **New project**.
2. Choose an organization, name the project `cratebook`, choose a nearby region, and
   save the generated database password somewhere secure.
3. When the project is ready, open its **Connect** dialog and copy:
   - the project reference;
   - the project URL;
   - the publishable key (`sb_publishable_...`).
4. From this repository, authenticate the CLI and apply the committed migration:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push --dry-run
npx supabase db push
```

Read the dry-run output before running the final command. Do not run `supabase config
push` yet: the committed `supabase/config.toml` intentionally contains local URLs.
See the official [Supabase CLI deployment guide](https://supabase.com/docs/reference/cli/supabase-db-push).

### 2. Import the GitHub repository into Vercel

1. Open [Vercel New Project](https://vercel.com/new), connect GitHub if requested,
   and import `TurkiNizar/cratebook`.
2. Keep the detected **Next.js** framework, repository root, build command, and output
   settings.
3. Add these environment variables to both **Preview** and **Production**:

| Variable                               | Value                           |
| -------------------------------------- | ------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Hosted Supabase project URL     |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Hosted Supabase publishable key |

4. Deploy the project and copy its production URL, for example
   `https://cratebook.vercel.app`.
5. Add `NEXT_PUBLIC_SITE_URL` in Vercel's **Production** environment with that exact
   URL, then redeploy Production so the new value is included in the build.

Vercel will now deploy `main` to Production and create a separate Preview URL for each
pull request or non-production branch. See [Vercel Git deployments](https://vercel.com/docs/git)
and [environment-variable scopes](https://vercel.com/docs/environment-variables).

### 3. Allow authentication redirects

In Supabase, open **Authentication → URL Configuration**:

1. Set **Site URL** to the exact Vercel production URL.
2. Add these **Redirect URLs**:

```text
http://localhost:3000/**
https://cratebook.vercel.app/auth/callback
https://*-YOUR_VERCEL_TEAM_OR_ACCOUNT_SLUG.vercel.app/**
```

Replace the example production domain and Vercel account/team slug with the real
values. The wildcard permits generated Vercel Preview URLs; keep the production
callback exact. Supabase documents the same Vercel pattern in its
[redirect URL guide](https://supabase.com/docs/guides/auth/redirect-urls#vercel-preview-urls).

### 4. Verify the hosted environment

1. Open the production URL on a phone or narrow browser window.
2. Request a magic link using an email inbox you can access.
3. Follow the email link, choose a username, and confirm `/collection` loads.
4. Edit and save the profile at `/settings`.
5. Create a small branch and pull request, then confirm Vercel posts a working Preview
   deployment and that its magic-link flow returns to the Preview URL.

Steps 1–4 are verified in production. The pull-request Preview check in step 5 remains
open and is tracked in `MVP_PLAN.md`.

If a magic link returns to localhost or is rejected, recheck the Supabase Site URL,
redirect allowlist, Vercel team/account slug, and redeploy after environment changes.

The publishable Supabase key is designed for browser use with RLS. Never put a
Supabase secret/service-role key in a `NEXT_PUBLIC_` variable, `.env.local` in Git, or
the repository. Refer to [Supabase API keys](https://supabase.com/docs/guides/api/api-keys)
for the distinction.

## Verification

```bash
npm run lint
npm run typecheck
npm run test:run
npm run build
```

The same quality, browser, and database checks run on every push to `main` and every
pull request through `.github/workflows/ci.yml`.

Run public smoke tests across desktop Chromium, Firefox, WebKit, Android Chrome,
and iPhone Safari profiles after installing Playwright's browser engines:

```bash
npx playwright install chromium firefox webkit
npm run e2e
```

Run database tests while the local Supabase stack is running:

```bash
supabase start
npm run db:test
```

Run the optional real magic-link, onboarding, collection maintenance, wishlist
management, search, and profile journey through Mailpit across the full browser matrix:

```bash
RUN_LOCAL_AUTH_E2E=1 npm run e2e
```

The authenticated matrix runs serially because every browser shares one local Supabase
stack and Mailpit inbox. Add `--project=mobile-chrome` (or another configured project)
for a faster targeted run.

Regenerate `src/types/database.ts` after a migration with:

```bash
npx supabase gen types typescript --local --schema public
```

Review the generated output before replacing the committed types.

## Environment variables

Only variables prefixed with `NEXT_PUBLIC_` are exposed to the browser. The Supabase
URL and publishable key are intentionally public; never expose the service-role key.

See `.env.example` for the currently required values.
