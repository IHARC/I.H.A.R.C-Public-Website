# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the main marketing website for IHARC (Integrated Homelessness & Addictions Response Centre) serving Northumberland County, Ontario. It's built with **Astro + TypeScript + Tailwind CSS** and designed to be maintainable, accessible, and high-performance.

## Tech Stack

- **Framework**: Astro 4.x with TypeScript (strict mode)
- **Styling**: Tailwind CSS with custom IHARC design system
- **Content**: Astro Content Collections for news/blog posts
- **Testing**: Vitest (units) + Playwright (E2E)
- **Linting**: ESLint + Prettier with Astro plugins
- **Hosting**: Azure Static Web Apps (existing workflow in place)

## Common Development Commands

### Development
- `npm run dev` - Start development server (http://localhost:4321)
- `npm run build` - Build for production (outputs to `dist/`)
- `npm run preview` - Preview production build locally

**Note**: All scripts use `npx` prefix for CI/CD compatibility (fixes "Permission denied" errors in Azure Static Web Apps).

### Code Quality
- `npm run lint` - Run ESLint on all files
- `npm run format` - Format code with Prettier
- `npm run check` - Run all quality checks (lint + test + e2e)

### Testing
- `npm run test` - Run Vitest unit tests
- `npm run e2e` - Run Playwright end-to-end tests
- For Playwright: must build first (`npm run build`) then run tests

## Project Architecture

### Content Management
- **Site Data**: `src/data/site.ts` - Centralized config for nav, quick access, programs, counters, footer
- **News Content**: `src/content/news/` - Markdown files with frontmatter for blog posts
- **Content Schema**: `src/content/config.ts` - TypeScript schemas for content validation

### Component Structure
- **Layout**: `src/layouts/BaseLayout.astro` - Main page template with SEO, accessibility defaults
- **Pages**: `src/pages/` - Route-based pages (currently just homepage)
- **Components**: `src/components/` - Reusable UI components following established patterns

### Design System
- **Colors**: Brand red (#CE2029), charcoal (#1E1E1E), and supporting colors in Tailwind config
- **Typography**: Poppins (headings), Inter (body)
- **Components**: `.btn-primary`, `.btn-secondary`, `.card`, etc. defined in `src/styles/main.css`

## Key Patterns to Follow

### Content Updates
- Navigation: Edit `nav` array in `src/data/site.ts`
- Quick access cards: Update `quickAccess` array
- Program listings: Modify `programs` array
- Impact numbers: Change `impactCounters` values
- News posts: Add `.md` files to `src/content/news/`

### Component Development
- Use semantic HTML (`<section>`, `<article>`, `<nav>`)
- Apply `container` class for consistent spacing
- Use `py-16` for section padding
- Include proper ARIA labels and focus management
- Support `prefers-reduced-motion` for animations

### Accessibility Requirements
- All interactive elements must be keyboard accessible
- Include skip links and focus management
- Use proper heading hierarchy (h1 → h2 → h3)
- Maintain AA color contrast (4.5:1)
- Test with screen readers and keyboard navigation

### Performance Targets
- Lighthouse mobile score: 90+
- First Contentful Paint: < 1.5s
- No layout shifts (CLS < 0.1)
- Bundle size optimized with Astro's static generation

## Testing Strategy

- **Unit Tests**: Focus on utility functions in `src/lib/`
- **E2E Tests**: Cover critical user paths, accessibility, and performance
- **Manual Testing**: Keyboard navigation, screen readers, mobile responsive

## Deployment Notes

- Azure Static Web Apps workflow already configured
- Build outputs to `dist/` directory
- No server-side code (fully static)
- Environment variables managed in Azure portal if needed

## When Adding Features

1. Consider if it needs client-side JavaScript (use React islands sparingly)
2. Update relevant data in `src/data/site.ts` first
3. Create reusable components following established patterns
4. Add appropriate tests (unit for logic, E2E for user flows)
5. Ensure accessibility compliance before shipping

## Content Editing for Non-Developers

- **Text Changes**: Most content is in `src/data/site.ts`
- **News Posts**: Add `.md` files to `src/content/news/` with proper frontmatter
- **Images**: Place in `public/` directory and reference with `/filename.ext`
- **Contact Info**: Update footer object in `src/data/site.ts`

This is a production-ready codebase with proper tooling, testing, and accessibility built-in.