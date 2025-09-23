# AGENTS.md

## Mission & Audience Context
- This repository contains the public marketing website for the Integrated Homelessness & Addictions Response Centre (IHARC).
- IHARC is a non-profit based in Northumberland County, Ontario, Canada supporting people who are unhoused and/or navigating substance use challenges, with a focus on outreach services.
- Keep language empathetic, strengths-based, and community-focused when editing content.

## Tech & Architecture Overview
- **Framework:** Astro 4.x with strict TypeScript and JSX/TSX support for islands when needed.
- **Styling:** Tailwind CSS with additional global styles in `src/styles/main.css` implementing the IHARC design system.
- **Content:** Astro Content Collections (`src/content/`) with schemas in `src/content/config.ts` plus structured data in `src/data/site.ts`.
- **Utilities & Tests:** Vitest for unit tests, Playwright for end-to-end tests, ESLint + Prettier (with Astro plugins) for linting/formatting.
- **Hosting:** Azure Static Web Apps. Build pipeline relies on `npm run build` which invokes `build.js` (fallback strategies for Oryx permission issues).

### Key Directories & Files
- `src/pages/` – Route files (currently homepage in `index.astro`).
- `src/layouts/BaseLayout.astro` – Global layout handling SEO, metadata, and accessibility defaults.
- `src/components/` – Reusable Astro components (header, hero, quick access, programs grid, impact counters, news strip, footer, etc.).
- `src/data/site.ts` – Central configuration for navigation, quick access cards, program listings, impact counters, footer content, logo + integration settings.
- `src/content/` – Markdown content for news/blog posts and static pages validated by schemas in `src/content/config.ts`.
- `src/lib/` – Utility helpers (accessibility, observers, etc.) that should be covered by unit tests.
- `public/` – Static assets (images, favicons, downloadable resources). Reference with root-relative URLs (e.g., `/logo.svg`).
- `tests/` – Playwright E2E specs; Vitest unit tests colocated where appropriate.

## Local Development Workflow
1. Install Node.js ≥ 18.17.0 and npm.
2. Install dependencies: `npm install`.
3. Start local dev server: `npm run dev` (serves at http://localhost:4321).
4. Build production bundle: `npm run build`; preview build with `npm run preview`.
5. To resolve Azure Oryx build issues there are alternative scripts: `npm run build:direct`, `npm run build:node`, or `bash build-simple.sh`.

## Code Style & Implementation Guidelines
- Favor semantic HTML (`<section>`, `<article>`, `<nav>`) and maintain logical heading hierarchy (H1 → H2 → H3).
- Apply the shared layout conventions: wrap sections with the `container` class for width constraints and `py-16` (or responsive equivalents) for vertical rhythm.
- Tailwind is the primary styling tool. Use utility classes over ad-hoc CSS; if global styles are needed, extend `src/styles/main.css` while preserving existing component classes (`.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.btn-white`, `.card`, etc.).
- Maintain brand colors (primary red `#CE2029`, charcoal `#1E1E1E`, supporting palette defined in Tailwind config) and typography (Poppins for headings, Inter for body text).
- Keep TypeScript strictness intact—add/adjust types rather than `any`. Use existing interfaces/types from `src/data/site.ts` and content schemas.
- Accessibility is a top priority: ensure keyboard access, visible focus states, ARIA labels where appropriate, skip links, and support `prefers-reduced-motion`. Maintain AA contrast or better.
- Aim for high performance: minimize unused JavaScript, prefer static rendering, and keep Lighthouse mobile score ≥ 90, FCP < 1.5s, CLS < 0.1.
- When introducing interactive behavior, prefer Astro islands sparingly; if adding React, follow README guidance and update `astro.config.mjs` accordingly.

## Content & Data Editing
- Update navigation, quick access, programs, impact counters, footer contact info, logo configuration, and integration toggles within `src/data/site.ts`.
- Add news/blog entries by creating Markdown files inside `src/content/news/` with proper frontmatter matching schemas in `src/content/config.ts`.
- Global copy edits can often be made directly in Astro components or site data; keep tone compassionate and community-oriented.
- Store new static media in `public/` and reference via root-relative paths.

## Integrations & Environment Variables
- Copy `.env.example` to `.env` to configure analytics, chat, and other integrations. Never commit `.env`.
- Supported analytics: Google Analytics 4, Google Tag Manager, Facebook Pixel, Hotjar. Chat provider defaults to Crisp.
- Toggle integrations through the `integrations` object in `src/data/site.ts`. `analytics.enabled` and `chat.enabled` gate all tracking/chat behavior; `respectDNT` honors Do Not Track.
- Development override: `PUBLIC_ENABLE_INTEGRATIONS_IN_DEV=true npm run dev` enables integrations locally for testing.
- Console logs (in dev) confirm which IDs/providers are active. Verify environment variables begin with `PUBLIC_` as required by Astro.

## Testing Expectations
- **Linting:** `npm run lint` (ESLint + Prettier). Fix formatting with `npm run format` when needed.
- **Unit tests:** `npm run test` (Vitest). Focus on utilities in `src/lib/` and any logic-heavy modules.
- **E2E tests:** `npm run e2e` (Playwright). Run `npm run build` beforehand to generate the production build Playwright expects.
- **Comprehensive check:** `npm run check` runs lint, unit, and e2e suites sequentially. Execute relevant commands before submitting changes.
- Update or add tests alongside new features. Mock browser APIs (e.g., IntersectionObserver) where appropriate.

## Deployment Notes
- Azure Static Web Apps GitHub Action is configured; build output lives in `dist/`.
- `build.js` includes fallback strategies (permission fixes + `npx astro`, direct Node execution, Yarn fallback) to mitigate Oryx issues. If Azure builds fail, try alternate scripts listed above.
- Ensure environment variables are configured in hosting platform before deployment (analytics IDs, chat configs, etc.).

## Documentation & Further Reading
- Additional project details: `README.md` (setup, project structure, design system, performance goals).
- Integration-specific instructions: `INTEGRATIONS.md` (logos, analytics, chat widget configuration, troubleshooting, deployment checklist).
- There are currently no nested `AGENTS.md` files; if you add new directories with unique conventions, include scoped instructions there.

## Workflow Expectations for Future Changes
- Keep commits focused and ensure `git status` is clean before completion.
- Run the relevant quality commands for any code/content change and document the results in your summary.
- Preserve accessibility, performance, and design consistency across all contributions.
