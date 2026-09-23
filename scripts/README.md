# Image Optimization

This directory contains scripts for optimizing images in the FreelanceXchain frontend.

## Current Status

### SVG Files (Already Optimized)
The following SVG files exist and are already optimized:
- `public/images/logo-icon.svg` - Brand icon
- `public/favicon.svg` - Favicon
- `src/app/icon.svg` - App icon

### JPEG Files (To Be Converted)
The following JPEG files should be converted to WebP:
- `public/images/logo-wordmark.jpg` (437.51 KB)
- `public/images/logo-full.jpg` (437.51 KB)
- `public/images/logo-icon.jpg` (424.88 KB)
- `public/images/logo-sparkle.jpg` (347.48 KB)

**Total:** ~1.6MB of JPEG files

## Running the Optimization

### Option 1: Using Node.js (sharp)

1. Install dependencies:
```bash
npm install --save-dev sharp
# or globally
npm install -g sharp-cli
```

2. Run the optimization script:
```bash
# From project root
node scripts/optimize-images.js

# Or using PowerShell
.\scripts\optimize-images.ps1

# Or using Bash
./scripts/optimize-images.sh
```

### Option 2: Using cwebp (command line)

1. Download and install cwebp:
   - Windows: https://developers.google.com/speed/webp/download
   - macOS: `brew install webp`
   - Linux: `sudo apt-get install webp`

2. Run the bash script:
```bash
./scripts/optimize-images.sh
```

## Expected Results

After running the optimization, you should see:
- `logo-wordmark.webp`
- `logo-full.webp`
- `logo-icon.webp`
- `logo-sparkle.webp`

Expected file size reduction: ~60-80%

## Using Optimized Images

### In React Components

Import and use the `OptimizedImage` or `LogoImage` components:

```tsx
import { LogoImage, OptimizedImage } from '@/components/ui/optimized-image';

// Pre-configured logo
<LogoImage variant="wordmark" width={400} height={100} />

// Generic optimized image
<OptimizedImage
  src="/images/logo-wordmark.webp"
  alt="FreelanceXchain Logo"
  width={400}
  height={100}
  priority
/>
```

### Next.js Image Component

Next.js Image automatically handles format selection:

```tsx
import Image from 'next/image';

<Image
  src="/images/logo-wordmark.webp"
  alt="Logo"
  width={400}
  height={100}
/>
```

The browser will receive:
- AVIF if supported
- WebP if supported
- Original format as fallback

### Static HTML (with fallback)

```html
<picture>
  <source srcset="/images/logo-wordmark.webp" type="image/webp">
  <source srcset="/images/logo-wordmark.jpg" type="image/jpeg">
  <img src="/images/logo-wordmark.jpg" alt="Logo" width="400" height="100">
</picture>
```

## Configuration

Image optimization settings are in `next.config.ts`:

```typescript
images: {
  formats: ['image/avif', 'image/webp'],
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
}
```

## Notes

- Keep original JPEG files as fallbacks for older browsers
- The SVG files are preferred for logos when possible (smaller, scalable)
- Next.js Image component automatically generates multiple sizes
