# IHARC Command Center

A Next.js 15 portal that powers the public “Solutions Command Center” for the Integrated Homelessness & Addictions Response Centre (IHARC). Community members, service agencies, and municipal partners can review live metrics, propose ideas, collaborate on threads, and coordinate moderation workflows.

## Requirements
- Node.js 18.18.0 or newer
- npm 9+
- Supabase project with the `portal.*` schema and edge functions deployed (see `docs/portal/architecture.md`)

## Environment Variables
Create a `.env.local` (for local development) and configure the corresponding secrets in Azure Static Web Apps:

```
NEXT_PUBLIC_SUPABASE_URL=https://vfavknkfiiclzgpjpntj.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_DpKb92A7lPsPjK0Q3DHw0A_RtkRomXp
SUPABASE_SERVICE_ROLE_KEY=...
PORTAL_INGEST_SECRET=...
PORTAL_ALERTS_SECRET=...
PORTAL_RESEND_API_KEY=...
PORTAL_EMAIL_FROM=...
```

`SUPABASE_SERVICE_ROLE_KEY`, `PORTAL_INGEST_SECRET`, and `PORTAL_ALERTS_SECRET` are required only on the server/edge function side. Never expose them to the client. `PORTAL_RESEND_API_KEY` and `PORTAL_EMAIL_FROM` configure outbound notification delivery.

## Getting Started
```bash
npm install
npm run dev
```
Local development runs at `http://localhost:3000`.

### Useful Scripts
| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Next.js dev server |
| `npm run lint` | ESLint (required before deploying) |
| `npm run typecheck` | TypeScript project check |
| `npm run test` | Vitest unit tests |
| `npm run e2e` | Playwright end-to-end tests |
| `npm run build` | Production build (`build.js` orchestrates Azure-friendly build) |
| `npm run start` | Preview the production build locally |

`npm run build` executes `build.js`, which mirrors the Azure Static Web Apps pipeline (lint + build). The output is a standalone Next.js bundle under `.next/` suitable for the Azure SWA Node runtime.

## Portal Architecture (MVP)
- **Framework**: Next.js App Router + React Server Components
- **UI**: Tailwind CSS, shadcn/ui, and lightweight Recharts charts
- **State & Data**: Supabase JS v2 (RSC, route handlers, client components)
- **Storage**: Private `portal-attachments` bucket accessed via signed URLs
- **Authentication**: Supabase Auth (email/password or existing providers)
- **Safety Guards**: Shared profanity + PII scanners, rate limit checks, moderation flags, full audit logging

### Primary Routes
- `/command-center` – public dashboard (placeholder cards + sprint context until metrics history grows)
- `/command-center/admin` – moderator/admin portal for metrics ingestion + partner organization registry
- `/solutions` – idea backlog with search, filters, and voting
- `/solutions/submit` – authenticated idea submission with attachments
- `/solutions/[id]` – idea detail, discussion thread, and official responses
- `/solutions/profile` – participant profile setup (display name, affiliation)
- `/solutions/mod` – moderation queue for resolving flags (moderator/admin only)

### API Endpoints
All implemented as Next.js Route Handlers under `/api/portal/*`:
- `POST /api/portal/ideas` – create idea + attachments
- `POST /api/portal/ideas/:id/vote` – toggle votes
- `POST /api/portal/ideas/:id/comments` – create threaded comments (2-level depth)
- `POST /api/portal/flags` – submit moderation flags
- `GET /api/portal/metrics` – public metrics feed for the dashboard
- `POST /api/portal/profile/ack` – record first-post community rules acknowledgement

Every mutation records a `portal.audit_log` entry with hashed IP + user-agent metadata.

## Azure Static Web Apps Deployment
1. Ensure required environment variables are defined in Azure SWA configuration (`NEXT_PUBLIC_*`, `SUPABASE_SERVICE_ROLE_KEY`, `PORTAL_INGEST_SECRET`).
2. The GitHub workflow should run `npm install` and `npm run build`; `build.js` guarantees lint + build parity with Azure.
3. Deploy the generated `.next/` output (Azure automatically wires SSR/API routes into the Functions host).
4. Supabase Edge Functions (`portal-ingest-metrics`, `portal-moderate`) must be deployed separately via the Supabase CLI.

## Seeding the MVP (No SQL Required)
1. **Create a moderator account** via Supabase Auth (e.g., invite yourself) and elevate the `portal.profiles.role` to `moderator` or `admin` using the Supabase Dashboard.
2. **Register a partner organization**
   - Sign in to the portal, visit `/command-center/admin`, and use the “Register partner organization” form to add an agency. Toggle the verified checkbox if applicable.
3. **Seed an initial metric**
   - On the same admin page, submit one daily metric (e.g., `outdoor_count`) with today’s date so the dashboard cards render.
4. **Create portal profile**
   - Visit `/solutions/profile` to set your display name and link the organization you just created.
5. **Post the first idea**
   - Go to `/solutions/submit`, acknowledge the community rules, and share an idea. Attachments are optional but will be stored privately in `portal-attachments` with signed URLs.

These steps populate the minimum data set that Azure SWA will surface publicly once deployed.

## Testing & QA
- `npm run lint` and `npm run typecheck` must pass before merging.
- Add unit tests alongside non-trivial utilities (rate limiting, safety checks, etc.).
- Use `npm run e2e` for playwright smoke tests (requires `npm run build` beforehand).
- When adding Supabase migrations or policies, verify with `supabase db diff` and document changes in `docs/portal/`.

<<<<<<< HEAD
## Additional References
- `docs/portal/architecture.md` – deep-dive into schema, RLS policies, and edge function contracts
- `docs/portal/mvp-plan.md` – sprint-oriented implementation checklist and backlog
- `AGENTS.md` – contributor guidance, conventions, and current TODOs
=======
### Site Data (`src/data/site.ts`)
Centralized configuration for:
- Navigation menu items
- Quick access cards
- Program listings
- Impact counter values
- Footer sections and links

Example:
```typescript
export const nav: NavItem[] = [
  { label: 'About', href: '/about' },
  { label: 'Programs & Services', href: '/programs' },
  // ...
];
```

### News Content (`src/content/news/`)
News posts are written in Markdown with frontmatter:

```markdown
---
title: "Article Title"
date: 2024-01-15
excerpt: "Brief description for cards and SEO"
tags: ["outreach", "community"]
---

Article content goes here...
```

### Adding Content
1. **New news post**: Create `.md` file in `src/content/news/`
2. **Update navigation**: Edit `nav` array in `src/data/site.ts`
3. **Modify quick access**: Update `quickAccess` array in `src/data/site.ts`
4. **Change impact numbers**: Update `impactCounters` in `src/data/site.ts`
5. **Toggle Impact section**: Set `contentFlags.showImpact` to `true`/`false` in `src/data/site.ts`

### Toggling the Impact Section
The Impact section (with metrics/counters) can be hidden until ready for production:

```typescript
// In src/data/site.ts
export const contentFlags: ContentFlags = {
  showImpact: false, // Set to true when ready to show impact metrics
};
```

- When `showImpact: false` - The entire Impact section is hidden from the homepage
- When `showImpact: true` - The Impact section displays with the configured counter values
- Counter values of 0 display as "Updating…" until real data is available

## 🧩 Adding Components

### Creating a New Section Component

1. Create component file in `src/components/`:
```astro
---
// Component logic here
---

<section class="py-16 bg-white">
  <div class="container">
    <!-- Component content -->
  </div>
</section>
```

2. Import and use in pages:
```astro
---
import NewComponent from '../components/NewComponent.astro';
---

<BaseLayout title="Page Title">
  <NewComponent />
</BaseLayout>
```

3. Follow established patterns:
   - Use `container` class for consistent spacing
   - Apply `py-16` for section padding
   - Use semantic HTML elements (`<section>`, `<article>`, etc.)
   - Include proper ARIA labels and focus management

## ♿ Accessibility

### Built-in Features
- Skip links for keyboard navigation
- Semantic HTML structure with landmarks
- High-contrast focus indicators
- Screen reader announcements
- Respect for `prefers-reduced-motion`
- ARIA labels and roles where needed

### Accessibility Checklist
- [ ] All images have `alt` text
- [ ] Headings follow proper hierarchy (h1 → h2 → h3)
- [ ] Interactive elements are keyboard accessible
- [ ] Color contrast meets AA standards (4.5:1)
- [ ] Focus indicators are visible
- [ ] Motion respects user preferences

### Testing Accessibility
```bash
# Run automated tests
npm run e2e

# Manual testing
# - Tab through all interactive elements
# - Test with screen reader
# - Verify at 200% zoom
# - Check with high contrast mode
```

## 🧪 Testing

### Unit Tests (Vitest)
- Test utility functions in `src/lib/`
- Test component logic where applicable
- Mock browser APIs (IntersectionObserver, matchMedia)

### End-to-End Tests (Playwright)
- Homepage loads and displays content
- Navigation works (desktop and mobile)
- Accessibility features function
- No JavaScript errors
- Performance within acceptable limits

## 📱 Adding React Islands (Future)

When interactive components are needed:

1. **Install React integration**:
```bash
npm install @astrojs/react
```

2. **Update `astro.config.mjs`**:
```javascript
import react from '@astrojs/react';

export default defineConfig({
  integrations: [tailwind(), react()],
  // ...
});
```

3. **Create React component**:
```tsx
// src/components/InteractiveWidget.tsx
import { useState } from 'react';

export default function InteractiveWidget() {
  const [count, setCount] = useState(0);
  
  return (
    <button onClick={() => setCount(c => c + 1)}>
      Count: {count}
    </button>
  );
}
```

4. **Use with client directive**:
```astro
---
import InteractiveWidget from '../components/InteractiveWidget';
---

<InteractiveWidget client:visible />
```

## 🚀 Deployment

### Azure Static Web Apps
The project includes robust build scripts to handle permission issues in Azure's Oryx build system:

**Build Configuration:**
- Build command: `npm run build` (uses `build.js` script with fallback strategies)
- Output directory: `dist/`
- Existing GitHub Action workflow handles deployment

**Build Strategies (automatic fallback):**
1. **Primary**: Fix permissions + npx astro
2. **Fallback 1**: Direct Node.js execution  
3. **Fallback 2**: Yarn (if available)

**Alternative Build Commands:**
```bash
# If main build fails, try these in Azure SWA config:
npm run build:direct    # Direct npx approach
npm run build:node      # Node.js direct execution
bash build-simple.sh    # Simple shell script fallback
```

**Common Azure SWA Issues Fixed:**
- ✅ "Permission denied" errors with astro binary
- ✅ Oryx build system compatibility
- ✅ Multiple fallback strategies for reliability

### Other Platforms
- **Netlify**: Works out of the box
- **Vercel**: Compatible with Astro adapter
- **GitHub Pages**: Use `@astrojs/static` adapter

## 🔧 Development Tips

### Hot Reloading
- Astro components: ✅ Hot reload
- TypeScript: ✅ Type checking
- Tailwind: ✅ JIT compilation
- Content collections: ✅ Auto-refresh

### Common Issues
1. **Build errors**: Check TypeScript types and imports
2. **Styles not loading**: Verify Tailwind config and imports
3. **Content not updating**: Restart dev server for collection changes

## 📈 Performance Targets

- **Lighthouse Score**: 90+ on mobile
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **Time to Interactive**: < 3.5s

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes following existing patterns
4. Run quality checks: `npm run check`
5. Submit a pull request

## 📄 License

Copyright IHARC - Integrated Homelessness & Addictions Response Centre
>>>>>>> 287c492c (updates)
