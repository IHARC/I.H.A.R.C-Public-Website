# IHARC Website Integrations Guide

This guide explains how to easily manage logos, tracking codes, and live chat widgets on the IHARC website.

## 🎯 Quick Start

### 1. Set Up Environment Variables
```bash
# Copy the example file
cp .env.example .env

# Edit .env with your actual values
# Only set the variables for services you want to use
```

### 2. Configure Integrations
Edit `src/data/site.ts` to enable/disable features:

```typescript
export const integrations: IntegrationsConfig = {
  analytics: {
    enabled: true,     // Set to false to disable all tracking
    respectDNT: true,  // Respect Do Not Track browser setting
  },
  chat: {
    enabled: true,           // Set to false to disable chat widget
    provider: 'crisp',       // Change to your preferred provider
    config: { /* ... */ }    // Provider-specific configuration
  },
  logo: {
    variants: {
      header: 'default',     // Logo variant for header
      footer: 'default',     // Logo variant for footer
      size: 'sm',            // Default size for header
    }
  }
}
```

## 🖼️ Logo Management

### Easy Logo Updates

The website uses a centralized Logo component that supports multiple variants and sizes.

#### Adding Logo Variants

1. **Add logo files to `/public/`:**
   ```
   /public/
   ├── logo.svg           (default)
   ├── logo-white.svg     (for dark backgrounds)
   ├── logo-dark.svg      (for very light backgrounds)
   └── logo-symbol.svg    (symbol only)
   ```

2. **Update logo configuration in `src/data/site.ts`:**
   ```typescript
   logo: {
     variants: {
       header: 'white',    // Use white logo in header
       footer: 'default',  // Use default logo in footer
       size: 'md',         // Medium size for header
     }
   }
   ```

#### Logo Usage Examples
```tsx
import Image from 'next/image';

export function LogoExamples() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* Default logo */}
      <Image src="/logo.svg" alt="IHARC" width={120} height={48} />

      {/* White logo for dark backgrounds */}
      <Image src="/logo-white.svg" alt="IHARC" width={120} height={48} />

      {/* Custom sizing with Tailwind utilities */}
      <Image
        src="/logo.svg"
        alt="IHARC"
        width={160}
        height={64}
        className="mx-auto"
      />
    </div>
  );
}
```

#### Available Sizes
- `xs` - 24px height
- `sm` - 32px height  
- `md` - 48px height (default)
- `lg` - 64px height
- `xl` - 80px height
- `full` - Fill container

## 📊 Analytics & Tracking

### Supported Providers

- **Google Analytics 4** - Web analytics and conversion tracking
- **Google Tag Manager** - Tag management and advanced tracking
- **Facebook Pixel** - Social media advertising and retargeting
- **Hotjar** - User behavior analytics and heatmaps

### Setup Instructions

#### Google Analytics 4 (Recommended)
1. Create a GA4 property at [analytics.google.com](https://analytics.google.com/)
2. Get your measurement ID (starts with `G-`)
3. Add to `.env`: `PUBLIC_GA4_ID=G-XXXXXXXXXX`

#### Facebook Pixel
1. Create a pixel in [Facebook Business Manager](https://business.facebook.com/)
2. Get your pixel ID (15-16 digits)
3. Add to `.env`: `PUBLIC_FACEBOOK_PIXEL_ID=123456789012345`

#### Google Tag Manager
1. Create a container at [tagmanager.google.com](https://tagmanager.google.com/)
2. Get your container ID (starts with `GTM-`)
3. Add to `.env`: `PUBLIC_GTM_ID=GTM-XXXXXXX`

### Custom Event Tracking

The system automatically tracks:
- Form submissions
- External link clicks
- Phone number clicks
- Email address clicks

#### Manual Event Tracking
```javascript
// Track custom events
window.trackEvent('newsletter_signup', { 
  email: userEmail,
  source: 'footer'
});

window.trackEvent('donation_started', {
  amount: 100,
  frequency: 'monthly'
});
```

### Privacy Compliance

- **Respects Do Not Track**: All tracking is automatically disabled if the user has Do Not Track enabled
- **GDPR Ready**: Pass `disabled={!userConsent}` to disable tracking without consent
- **Privacy-Friendly Settings**: IP anonymization and secure cookies enabled by default

## 💬 Live Chat Integration

### Supported Providers

| Provider | Cost | Features | Setup Difficulty |
|----------|------|----------|------------------|
| **Crisp** | Free tier available | Good features, easy setup | ⭐ Easy |
| **Tawk.to** | Completely free | Unlimited chats | ⭐ Easy |
| **Intercom** | Premium service | Advanced features | ⭐⭐ Medium |
| **Zendesk** | Enterprise features | Full helpdesk | ⭐⭐⭐ Advanced |
| **Custom** | DIY | Full control | ⭐⭐⭐ Advanced |

### Quick Setup with Crisp (Recommended)

1. **Sign up at [crisp.chat](https://crisp.chat/)**
2. **Get your website ID** from the dashboard
3. **Add to `.env`:** `PUBLIC_CRISP_WEBSITE_ID=your-website-id`
4. **Configure in `src/data/site.ts`:**
   ```typescript
   chat: {
     enabled: true,
     provider: 'crisp',
     config: {
       session: {
         organization: "IHARC",
         website: "iharc.ca"
       }
     }
   }
   ```

### Chat Widget Controls

```javascript
// Show chat widget
window.chatWidget.show();

// Hide chat widget
window.chatWidget.hide();

// Set user information
window.chatWidget.setUser({
  name: "John Doe",
  email: "john@example.com"
});
```

### Disable Chat on Specific Pages

```tsx
'use client';

import { useEffect } from 'react';

export default function PrivacyPolicyPage() {
  useEffect(() => {
    window.chatWidget?.setEnabled?.(false);
    return () => window.chatWidget?.setEnabled?.(true);
  }, []);

  return (
    <main className="prose mx-auto px-6 py-12">
      <h1>Privacy Policy</h1>
      <p>Chat is disabled on this page to respect sensitive content.</p>
      {/* rest of the page content */}
    </main>
  );
}
```

## 🛠️ Configuration Management

### Central Configuration

All integrations are configured in `src/data/site.ts`:

```typescript
export const integrations: IntegrationsConfig = {
  // Enable/disable entire systems
  analytics: { enabled: true, respectDNT: true },
  chat: { enabled: true, provider: 'crisp' },
  logo: { variants: { header: 'default', footer: 'white' } }
};
```

### Environment-Based Settings

- **Development**: Analytics and chat are disabled by default
- **Staging**: Can be enabled with environment variables
- **Production**: Enabled based on configuration

### Override in Development

```bash
# Enable integrations in development
PUBLIC_ENABLE_INTEGRATIONS_IN_DEV=true npm run dev
```

## 🔍 Testing & Debugging

### Development Console Logs

The system provides helpful console logs in development:

```
Analytics disabled in development mode
Available tracking IDs:
  GA4_ID: ✓ Set
  FACEBOOK_PIXEL_ID: ✗ Not set

Chat widget disabled in development mode
Selected provider: crisp
Available chat configurations:
  crisp: ✓ Set
```

### Testing Analytics

1. **Enable in development:**
   ```bash
   PUBLIC_ENABLE_INTEGRATIONS_IN_DEV=true npm run dev
   ```

2. **Check browser network tab** for tracking requests

3. **Use analytics debug tools:**
   - Google Analytics Debugger extension
   - Facebook Pixel Helper extension

### Testing Chat Widget

1. **Enable in development** (same as analytics)
2. **Check console logs** for initialization messages
3. **Test widget functionality** by clicking the chat button

## 🚨 Troubleshooting

### Common Issues

#### Analytics Not Loading
- Check environment variables are set correctly
- Verify tracking IDs don't have extra spaces
- Check browser console for errors
- Ensure variables start with `PUBLIC_`

#### Chat Widget Not Appearing
- Verify provider configuration in `src/data/site.ts`
- Check environment variables for the selected provider
- Look for JavaScript errors in browser console
- Ensure chat is enabled: `chat.enabled: true`

#### Logo Not Displaying
- Check logo files exist in `/public/` directory
- Verify file names match the variant configuration
- Check browser network tab for 404 errors
- Ensure correct file extensions (.svg, .png, etc.)

### Debug Mode

Enable verbose logging:

```tsx
'use client';

import { Analytics } from '@vercel/analytics/react';

export function DebugIntegrations() {
  return (
    <>
      <Analytics debug />
      <script
        dangerouslySetInnerHTML={{
          __html: `window.chatWidget?.configure?.({ debug: true });`
        }}
      />
    </>
  );
}
```

## 📋 Deployment Checklist

Before deploying to production:

- [ ] Set up tracking accounts (Google Analytics, etc.)
- [ ] Set up chat service account (Crisp, etc.)
- [ ] Add environment variables to hosting platform
- [ ] Test analytics in staging environment
- [ ] Test chat widget functionality
- [ ] Verify logo displays correctly
- [ ] Check privacy compliance settings
- [ ] Test Do Not Track respecting

## 🔒 Security & Privacy

### Data Protection
- All tracking respects user privacy preferences
- No sensitive data is tracked automatically
- GDPR compliance ready with consent management
- Secure cookie settings enabled

### Environment Variables Security
- Keep `.env` file private and never commit it
- Use different tracking IDs for development/staging/production
- Regularly rotate API keys and tokens
- Monitor for unauthorized usage

## 🆘 Support

### Getting Help

1. **Check console logs** for error messages
2. **Review this documentation** for configuration examples
3. **Check provider documentation** for specific issues
4. **Contact IHARC technical team** for website-specific questions

### Provider Support Links

- [Crisp Support](https://help.crisp.chat/)
- [Google Analytics Help](https://support.google.com/analytics/)
- [Facebook Business Support](https://www.facebook.com/business/help/)
- [Tawk.to Help](https://help.tawk.to/)

---

*This integration system makes it easy to manage logos, tracking, and chat features while maintaining privacy compliance and performance optimization.*
