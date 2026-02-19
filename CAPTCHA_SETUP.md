# Cloudflare Turnstile CAPTCHA Setup Guide

## Overview
The frontend now includes Cloudflare Turnstile CAPTCHA protection on the registration page to prevent bot signups.

## What Was Added

### 1. Dependencies
- `@marsidev/react-turnstile` - React component for Cloudflare Turnstile

### 2. Components
- `src/components/TurnstileCaptcha.tsx` - Reusable CAPTCHA component

### 3. Updated Files
- `src/pages/auth/RegisterPage.tsx` - Added CAPTCHA to registration form
- `src/store/index.ts` - Updated register function to accept captchaToken
- `src/types/index.ts` - Added captchaToken to RegisterInput interface
- `.env` - Added VITE_TURNSTILE_SITE_KEY configuration

## Configuration Steps

### 1. Get Your Cloudflare Turnstile Site Key

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to Turnstile section
3. Create a new site or use an existing one
4. Copy your **Site Key** (not the Secret Key)

### 2. Update Environment Variables

Replace the test key in `.env` with your actual site key:

```env
VITE_TURNSTILE_SITE_KEY=your-actual-site-key-here
```

### 3. Configure Domain Allowlist

For local development:
1. In your Cloudflare Turnstile dashboard
2. Go to your site settings
3. Add `localhost` to the domain allowlist

For production:
- Add your production domain (e.g., `yourdomain.com`)

## Testing

### Test Keys (for development only)

Cloudflare provides test keys that always pass:
- **Site Key**: `1x00000000000000000000AA` (always passes)
- **Site Key**: `2x00000000000000000000AB` (always fails)
- **Site Key**: `3x00000000000000000000FF` (forces interactive challenge)

The `.env` file is pre-configured with the "always passes" test key.

### Local Testing

1. Start the development server:
   ```bash
   pnpm dev
   ```

2. Navigate to the registration page
3. You should see the Turnstile CAPTCHA widget
4. Complete the CAPTCHA and submit the form

## Backend Integration

The `captchaToken` is now sent to the backend in the registration request. You need to verify this token on the backend:

### Backend Verification Steps

1. Install the verification library in your API:
   ```bash
   npm install @marsidev/cloudflare-turnstile-api
   ```

2. Add your Turnstile Secret Key to the backend `.env`:
   ```env
   TURNSTILE_SECRET_KEY=your-secret-key-here
   ```

3. Verify the token in your registration endpoint:
   ```typescript
   import { verifyTurnstileToken } from '@marsidev/cloudflare-turnstile-api';

   // In your registration handler
   const { captchaToken } = req.body;
   
   if (captchaToken) {
     const verification = await verifyTurnstileToken({
       token: captchaToken,
       secretKey: process.env.TURNSTILE_SECRET_KEY!,
     });
     
     if (!verification.success) {
       return res.status(400).json({ error: 'CAPTCHA verification failed' });
     }
   }
   ```

## Features

- **Auto theme detection** - Matches your app's light/dark theme
- **Error handling** - Shows user-friendly error messages
- **Validation** - Prevents form submission without CAPTCHA completion
- **Responsive** - Works on all screen sizes

## Troubleshooting

### CAPTCHA not showing
- Check that `VITE_TURNSTILE_SITE_KEY` is set in `.env`
- Verify the site key is correct
- Check browser console for errors

### CAPTCHA fails on localhost
- Add `localhost` to domain allowlist in Cloudflare dashboard
- Or use the test key: `1x00000000000000000000AA`

### Backend returns error
- Ensure backend is verifying the token
- Check that the Secret Key is correct on the backend
- Verify the token hasn't expired (tokens are valid for 5 minutes)

## Additional Resources

- [Cloudflare Turnstile Documentation](https://developers.cloudflare.com/turnstile/)
- [React Turnstile Component](https://github.com/marsidev/react-turnstile)
- [Turnstile Dashboard](https://dash.cloudflare.com/?to=/:account/turnstile)
