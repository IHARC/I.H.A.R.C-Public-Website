# IHARC Website

A modern, accessible marketing website for the Integrated Homelessness & Addictions Response Centre (IHARC) serving Northumberland County, Ontario.

## 🚀 Quick Start

### Prerequisites
- Node.js 18.17.0 or later
- npm or yarn package manager

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd iharc-website

# Install dependencies
npm install

# Start development server
npm run dev
```

The site will be available at `http://localhost:4321`.

### Build for Production
```bash
# Build static site
npm run build

# Preview production build locally
npm run preview
```

## 📋 Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |
| `npm run test` | Run unit tests with Vitest |
| `npm run e2e` | Run end-to-end tests with Playwright |
| `npm run check` | Run all quality checks (lint + test + e2e) |

## 🏗️ Tech Stack

- **Framework**: Astro 4.x with TypeScript (strict mode)
- **Styling**: Tailwind CSS with custom design system
- **Content**: Astro Content Collections for news and pages
- **Testing**: Vitest for units, Playwright for E2E
- **Code Quality**: ESLint + Prettier with Astro plugins
- **Hosting**: Azure Static Web Apps ready

## 📁 Project Structure

```
/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Header.astro
│   │   ├── Hero.astro
│   │   ├── QuickAccess.astro
│   │   ├── ProgramsGrid.astro
│   │   ├── ImpactCounters.astro
│   │   ├── NewsStrip.astro
│   │   └── Footer.astro
│   ├── content/             # Content collections
│   │   ├── config.ts        # Content schema definitions
│   │   ├── news/            # Blog posts in Markdown
│   │   └── pages/           # Static content pages
│   ├── data/
│   │   └── site.ts          # Structured site data
│   ├── layouts/
│   │   └── BaseLayout.astro # Main page layout
│   ├── lib/                 # Utility functions
│   │   ├── a11y.ts          # Accessibility helpers
│   │   └── observe.ts       # Intersection Observer utilities
│   ├── pages/
│   │   └── index.astro      # Homepage
│   └── styles/
│       └── main.css         # Global styles and Tailwind
├── public/                  # Static assets
├── tests/                   # Test files
└── dist/                    # Built site (generated)
```

## 🎨 Design System

### Brand Colors
```css
--brand-red: #CE2029       /* Primary red */
--brand-red-dark: #9E1820  /* Darker red for hovers */
--brand-charcoal: #1E1E1E  /* Dark backgrounds */
--brand-silver: #D9D9D9    /* Light accents */
```

### Typography
- **Headings**: Poppins (fallback: Montserrat, system-ui)
- **Body**: Inter (fallback: system-ui)

### Component Classes
- `.btn-primary` - Solid red button
- `.btn-secondary` - Red outline button  
- `.btn-ghost` - Transparent button with red text
- `.btn-white` - White button with red text
- `.card` - Base card styling with shadow and padding

## 📝 Content Management

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
