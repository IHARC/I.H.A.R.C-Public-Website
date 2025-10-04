# AGENTS.md

## Mission & Audience Context
- The portal is the public-facing MVP for the IHARC Command Center. It prioritizes compassionate, strengths-based storytelling for Northumberland residents navigating housing instability and substance use.
- Content should emphasize collaboration, dignity, and community care. Avoid deficit-based language and maintain trust with service users, neighbours, and agency partners.

## Current Tech & Architecture
- **Framework:** Next.js 15 App Router with TypeScript.
- **Rendering:** All routes are forced dynamic (`export const dynamic = 'force-dynamic'`) to ensure fresh Supabase data on every request.
- **Styling:** Tailwind CSS utilities with shared styles in `src/styles/main.css` and design tokens enforced via Tailwind config.
- **Data:** Supabase (schema `portal`) powers metrics, ideas, comments, decisions, and organizations. Fallback keys are baked into the Supabase helpers so builds succeed without environment variables.
- **Build:** `npm run build` executes `build.js`, which lint/builds via Next.js. Output directory for Azure Static Web Apps is `.next`.
- **Testing:** Vitest (unit) and Playwright (e2e) are available but not wired into the default build workflow yet.

## Key Directories & Files
- `src/app/` – App Router routes: command center dashboard (`command-center`), idea board (`solutions`), profile + moderation tools, and API routes under `portal/`.
- `src/components/portal/` – React components for dashboard cards, idea cards, charts, filters, moderation queue, etc.
- `src/lib/` – Supabase clients (`supabase/`), audit helpers, accessibility utilities.
- `src/styles/main.css` – Design system overrides and base typography.
- `.github/workflows/azure-static-web-apps-happy-beach-01eb36a10.yml` – CI/CD deploying `.next` to Azure Static Web Apps.

## Development Workflow
1. Node.js ≥ 18.18 required. Install deps with `npm install` (project uses a flattened dependency set; no pnpm/yarn lockfiles).
2. Run `npm run dev` for the local server (default port 3000). Ensure Supabase credentials are set if you need live data; otherwise the baked-in fallbacks connect to a placeholder project.
3. Type checking: `npm run typecheck`. Build verification: `npm run build`.
4. Playwright and Vitest commands exist but may require additional setup (browser deps, Supabase fixtures) before running in CI.

## Implementation Guidelines
- Keep TypeScript strict: prefer explicit types and avoid `any`.
- Use Tailwind utilities for layout/styling; extend `main.css` only for shared tokens.
- Maintain accessible semantics: proper headings, labelled form inputs, focus-visible states, and high contrast.
- When handling Supabase data, always normalize query params from `searchParams`/`params` (App Router now provides them as Promises).
- Favor server actions and Supabase service clients for mutations; always log significant actions with `logAuditEvent` and revalidate affected paths.

## Content & Tone
- Narratives should highlight community solutions, peer insights, and agency collaboration. Center first-person perspectives respectfully.
- Avoid publishing identifying information for neighbours; reinforce anonymization guidelines in UI copy and API validations.

## Deployment Notes
- Azure deploy uses the `.next` artifact; ensure `npm run build` passes before pushing to `main`.
- Supabase credentials fallback to placeholder values; set real environment variables in production for secure access.
- Clear the extra `/mnt/c/Users/Jordan/package-lock.json` if build warnings about multiple lockfiles become noisy, or configure `outputFileTracingRoot` in `next.config.mjs`.

## Documentation
- `README.md` for setup specifics and design goals.
- `INTEGRATIONS.md` for analytics/chat toggles (currently optional).
- Supabase schema definitions live in `supabase/` – update there when changing database tables.

Use this file as the single source of truth for repo conventions; remove outdated assumptions when architecture changes.
