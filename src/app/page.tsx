import { AppelFinal } from "@/components/AppelFinal";
import { Boutique } from "@/components/Boutique";
import { BoutiqueProvider } from "@/components/BoutiqueProvider";
import { Commande } from "@/components/Commande";
import { CommentCommander } from "@/components/CommentCommander";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { Navbar } from "@/components/Navbar";
import { RailGammes } from "@/components/RailGammes";
import { Videos } from "@/components/Videos";
import {
  getGammes,
  getHeroSlides,
  getPacks,
  getProductTypes,
  getProducts,
  getSettings,
  getVideos,
} from "@/lib/data";
import type { ModeBoutique } from "@/lib/types";

/**
 * Le site de marque.
 *
 * Il raconte Lady Fresh : les gammes, les vidéos, la manière de commander. On
 * y vient par le nom, pas par une publicité — et on y reste plus longtemps que
 * sur une page de campagne, d'où ces étages qui n'ont pas leur place sur
 * `/boutique`.
 *
 * Le rayon reste le même des deux côtés : ce qu'il montre suit le réglage
 * `mode_boutique`, et le bon de commande est partagé. Une visiteuse peut
 * commencer sur une publicité et finir ici sans rien perdre.
 */
export default async function Accueil() {
  const [gammes, packs, products, types, settings, slides, videos] =
    await Promise.all([
      getGammes(),
      getPacks(),
      getProducts(),
      getProductTypes(),
      getSettings(),
      getHeroSlides(),
      getVideos(),
    ]);

  // Une référence = un format en vente, pas un produit.
  const referenceCount = products.reduce((n, p) => n + p.variants.length, 0);

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
        <Hero
          slides={slides}
          gammes={gammes}
          settings={settings}
          referenceCount={referenceCount}
        />
        <CommentCommander settings={settings} />
        <RailGammes gammes={gammes} products={products} types={types} />
        <Boutique />
        <Commande />
        <Videos videos={videos} />
        <AppelFinal gammes={gammes} settings={settings} />
      </main>
      <Footer settings={settings} />
    </BoutiqueProvider>
  );
}
