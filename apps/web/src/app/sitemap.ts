/**
 * @fileoverview Dynamic Sitemap Generation
 * @module app/sitemap
 *
 * Generates sitemap.xml for search engine crawling.
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
 */

import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://khipuvault.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/dashboard`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/dashboard/individual-savings`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/dashboard/cooperative-pools`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/dashboard/prize-pool`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/dashboard/rotating-savings`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/dashboard/portfolio`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/dashboard/analytics`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.7,
    },
  ];

  // In the future, add dynamic pool pages here
  // const poolPages = await fetchPools().map(pool => ({
  //   url: `${BASE_URL}/dashboard/pools/${pool.id}`,
  //   lastModified: pool.updatedAt,
  //   changeFrequency: 'daily',
  //   priority: 0.6,
  // }));

  return [...staticPages];
}
