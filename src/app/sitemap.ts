import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * Le plan du site.
 *
 * Une seule adresse, et c'est voulu : `/boutique` est une page de campagne, qui
 * vit par les liens des publicités et porte déjà une canonique. La proposer à
 * l'indexation la ferait concurrencer l'accueil sur les mêmes requêtes, ce que
 * son propre commentaire dit vouloir éviter. `/merci` et le back-office n'ont
 * rien à y faire non plus.
 *
 * Note pour plus tard, écrite ici parce que c'est là qu'on la cherchera : le
 * site sert une seule langue à la fois, choisie en base et valable pour tout le
 * monde. Il n'existe donc pas d'URL par langue, et `hreflang` n'a rien à
 * désigner — un moteur ne verra jamais que la langue active au moment de son
 * passage. Rendre l'arabe et l'anglais indexables demanderait des adresses
 * distinctes, donc une refonte du routage : c'est une décision, pas un oubli.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
