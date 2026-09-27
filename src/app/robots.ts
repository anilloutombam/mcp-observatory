import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/studio',
    },
    sitemap: 'https://observatory.mcplab.dev/sitemap.xml',
    host: 'https://observatory.mcplab.dev',
  }
}
