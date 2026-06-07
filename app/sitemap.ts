import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sajubara.com";

const routes = [
  "",
  "/today",
  "/saju",
  "/color",
  "/daewoon",
  "/yearly",
  "/people",
  "/my",
  "/terms",
  "/privacy",
  "/refund",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: now,
    changeFrequency: route === "" || route === "/today" ? "daily" : "weekly",
    priority: route === "" ? 1 : route === "/terms" || route === "/privacy" || route === "/refund" ? 0.3 : 0.7,
  }));
}
