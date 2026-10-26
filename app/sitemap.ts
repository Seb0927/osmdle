import type { MetadataRoute } from 'next'
import { catalog } from '@/lib/data'
import { absoluteUrl } from '@/lib/site'

export const dynamic = 'force-static'

const buildDate = new Date()

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: absoluteUrl('/'),
      lastModified: buildDate,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: absoluteUrl('/about/'),
      lastModified: buildDate,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: absoluteUrl('/attributions/'),
      lastModified: new Date(catalog.generatedAt),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ]
}
