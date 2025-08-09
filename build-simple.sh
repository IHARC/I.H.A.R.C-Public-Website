#!/bin/bash

# Simple fallback build script for Azure Static Web Apps
# If the main build.js fails, Azure can use this as backup

echo "🚀 Starting simple IHARC build..."

# Try to fix permissions (ignore failures)
chmod +x ./node_modules/.bin/astro 2>/dev/null || true

# Strategy 1: Try npx
echo "📦 Trying npx astro..."
if npx astro check && npx astro build; then
    echo "✅ npx build successful!"
    exit 0
fi

# Strategy 2: Try node directly  
echo "📦 Trying node direct execution..."
if node ./node_modules/astro/dist/cli/index.js check && node ./node_modules/astro/dist/cli/index.js build; then
    echo "✅ node direct build successful!"
    exit 0
fi

# Strategy 3: Try yarn if available
echo "📦 Trying yarn..."
if command -v yarn >/dev/null 2>&1; then
    if yarn astro check && yarn astro build; then
        echo "✅ yarn build successful!"
        exit 0
    fi
fi

echo "❌ All build strategies failed"
exit 1