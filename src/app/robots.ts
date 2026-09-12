import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard/',
          '/mfa/',
          '/api/',
          '/resend-confirmation',
          '/verify-email',
          '/reset-password',
        ],
      },
    ],
    sitemap: 'https://www.freelancexchain.works/sitemap.xml',
  };
}
