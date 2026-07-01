import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/login", "/register"],
      disallow: [
        "/api/",
        "/admin",
        "/settings",
        "/transactions",
        "/savings",
        "/budgets",
        "/categories",
        "/support",
        "/test-error",
      ],
    },
    sitemap: "https://finora.web.id/sitemap.xml",
  };
}
