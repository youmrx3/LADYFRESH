import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * Ce qu'on laisse indexer.
 *
 * Les pages privées portaient déjà leur `robots: { index: false }` et l'en-tête
 * `X-Robots-Tag` posé par le middleware — rien ne fuyait. Mais aucun fichier ne
 * disait à un robot où commencer ni où ne pas aller, et un site qui vend a tout
 * intérêt à le dire une fois plutôt qu'à le répéter page par page.
 *
 * `/merci` est écartée pour la même raison qu'elle porte `noindex` : une
 * confirmation ne veut rien dire sans la commande qui la précède.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/merci", "/api/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
