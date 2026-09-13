# Production operations

Last verified: 2026-09-13

Cratebook's invited-collector MVP is deployed from the GitHub `main` branch to Vercel
and uses the linked hosted Supabase project. The canonical production URL is
`https://cratebook.vercel.app`.

## Current release

- Source commit: `40c370584ee6960bd5aa1d305d9deeb0c74b13a2`
- Vercel deployment: `cratebook-2l0elm30v-tnizar.vercel.app`
- Production alias: `https://cratebook.vercel.app`
- Vercel state: successful at 2026-09-13 12:35:58 UTC
- GitHub checks: Application quality, Cross-browser smoke tests, and Database security
  completed successfully
- Hosted database: all 18 committed migrations are present

The immutable deployment hostname is protected by Vercel authentication. The public
production alias was therefore used for anonymous HTTP and browser health checks.
GitHub's deployment record ties the protected deployment hostname and successful
Production environment state to the source commit.

## Release procedure

1. Start from a clean, reviewed commit. Keep user-owned untracked files out of the
   release commit.
2. Run the release checks documented in `docs/release-testing.md`, including the clean
   local database and `npm run e2e:release`.
3. For a schema change, inspect the linked migration list and dry run before applying
   anything:

   ```bash
   npx supabase migration list --linked
   npx supabase db push --linked --dry-run
   npx supabase db push --linked
   npx supabase migration list --linked
   ```

   Apply only reviewed, committed migrations. Prefer backward-compatible migrations
   that can safely coexist with the previous and next application versions.

4. Push the verified commit to `main`. Vercel's Git integration creates the Production
   deployment and assigns the canonical alias after a successful build.
5. Confirm the Vercel deployment status references the expected commit and all GitHub
   checks complete successfully. Do not create a duplicate manual deployment when the
   Git deployment is already healthy.
6. Run the read-only health checks below. Authenticated production checks require an
   operator-owned test inbox and must remove any disposable test records afterward.
   Never use another collector's account or data for verification.

For schema changes that are not backward-compatible, stop and design an explicit
expand/migrate/contract rollout. Do not combine a breaking database change and an
application cutover into an unreviewed one-step deployment.

## Read-only health checks

Check the public shell, sign-in page, manifest, protected-route redirect, and the
privacy-preserving unavailable-profile state:

```bash
for path in / /sign-in /manifest.webmanifest /collection /u/operations-smoke-missing; do
  curl -sS -L -o /dev/null \
    -w "%{http_code} %{url_effective} %{content_type}\n" \
    --max-time 20 "https://cratebook.vercel.app${path}"
done
```

Expected results:

- `/`, `/sign-in`, and `/manifest.webmanifest` return successful responses;
- signed-out `/collection` ends at `/sign-in`;
- an unknown or private `/u/[username]` shows the same unavailable state and no record
  details;
- manifest icons return PNG content and the landing page has no framework error
  overlay;
- the defensive headers listed in `docs/security-privacy-review.md` remain present.

These checks do not prove the authenticated journey. Before inviting a wider audience,
repeat sign-in, catalogue add, public-preview, export, and cleanup with an operator-owned
production test account.

## Logs and monitoring

Use the Vercel deployment page or authenticated CLI to inspect deployment build output
and runtime errors:

```bash
vercel inspect https://cratebook.vercel.app
vercel logs https://cratebook.vercel.app --level error --level warn --since 1h
```

Use the Supabase dashboard for Auth, Postgres, and API logs. Record the UTC time,
deployment ID, route, request ID when available, and whether an incident affects public
or authenticated traffic before changing anything.

Cratebook currently has no application analytics, Web Vitals reporting, durable custom
rate-limit store, or configured repository-owned external log drain. Vercel and
Supabase platform dashboards are the operational sources for this MVP. Confirm the
hosted Supabase backup and point-in-time recovery policy in the owner's dashboard
before expanding beyond invited collectors; do not claim a recovery window that has
not been verified for the active plan.

## Rollback and incident response

Application deployments are immutable. If the new application is unhealthy and the
previous version remains schema-compatible, use the Vercel dashboard or authenticated
CLI to move the production alias back to the last known-good deployment:

```bash
vercel rollback
```

Confirm the target deployment and production alias before accepting the rollback, then
repeat the read-only health checks. Preserve the failed deployment URL and logs for the
incident record.

Do not reverse a production database migration ad hoc and do not edit migration history.
For a database defect, stop further rollout, assess affected data, and ship a reviewed
forward migration. Restore from a verified Supabase backup only for an actual data-loss
incident and only through the owner-authorized recovery process. If an application
rollback cannot operate safely against the current schema, deploy a compatibility fix
instead of rolling back blindly.

## Secrets and ownership

- The repository owner is the MVP release operator for GitHub, Vercel, Supabase, DNS,
  and the authentication email configuration.
- `NEXT_PUBLIC_SUPABASE_URL` and the publishable key are intentionally browser-visible.
- `SUPABASE_SECRET_KEY`, database credentials, CLI sessions, and recovery material are
  restricted operator secrets. Never print them in logs, pass them in public URLs, or
  commit them.
- Rotate any exposed credential in its owning service, update Vercel environment
  scopes, redeploy, and invalidate the old credential before considering the incident
  closed.
- Provider availability can be checked through Vercel, Supabase, MusicBrainz, and Cover
  Art Archive status channels. Catalogue outages must continue to leave manual entry
  available.
