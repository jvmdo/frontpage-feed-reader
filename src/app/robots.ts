import type { MetadataRoute } from "next";
import { settings } from "@/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard",
        "/manage-categories",
        "/manage-feeds",
        "/profile",
        "/settings",
        "/api",
      ],
    },
    sitemap: `${settings.baseUrl}/sitemap.xml`,
  };
}
