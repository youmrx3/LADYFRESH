import { Boutique } from "@/components/Boutique";
import { BoutiqueProvider } from "@/components/BoutiqueProvider";
import { Commande } from "@/components/Commande";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { Navbar } from "@/components/Navbar";
import {
  getGammes,
  getPacks,
  getProductTypes,
  getProducts,
  getSettings,
} from "@/lib/data";
import type { ModeBoutique } from "@/lib/types";

/**
 * La page.
 *
 * Trois sections, dans l'ordre où l'on décide d'acheter : ce que c'est, ce
 * qu'on peut prendre, comment le commander. Plus de gammes à parcourir, plus de
 * vidéos, plus d'appel final — chacun de ces étages était un étage de plus
 * entre une publicité et un bon de commande.
 *
 * Ce qu'elle vend dépend d'un seul réglage, `mode_boutique` : les coffrets, ou
 * le catalogue à l'unité.
 */
export default async function Accueil() {
  const [gammes, packs, products, types, settings] = await Promise.all([
    getGammes(),
    getPacks(),
    getProducts(),
    getProductTypes(),
    getSettings(),
  ]);

  const mode: ModeBoutique =
    settings.mode_boutique === "produits" ? "produits" : "packs";

  return (
    <BoutiqueProvider
      mode={mode}
      packs={packs}
      products={products}
      gammes={gammes}
      types={types}
      settings={settings}
    >
      <Navbar />
      <main>
        <Hero settings={settings} packs={packs} />
        <Boutique />
        <Commande />
      </main>
      <Footer settings={settings} />
    </BoutiqueProvider>
  );
}
