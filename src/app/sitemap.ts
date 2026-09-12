import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.freelancexchain.works';
  const now = new Date();

  const publicRoutes: Array<{
    path: string;
    priority: number;
    changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  }> = [
    { path: '', priority: 1.0, changeFrequency: 'daily' },
    { path: '/projects', priority: 0.9, changeFrequency: 'daily' },
    { path: '/freelancers', priority: 0.9, changeFrequency: 'daily' },
    { path: '/pricing', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/how-it-works', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/about', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/news', priority: 0.7, changeFrequency: 'daily' },
    { path: '/leaderboard', priority: 0.7, changeFrequency: 'daily' },
    { path: '/tutorials', priority: 0.7, changeFrequency: 'weekly' },
    { path: '/help', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/faqs', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/contact', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/status', priority: 0.5, changeFrequency: 'daily' },
    { path: '/terms', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' },
  ];

  return publicRoutes.map(({ path, priority, changeFrequency }) => ({
    url: `${baseUrl}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));
}
