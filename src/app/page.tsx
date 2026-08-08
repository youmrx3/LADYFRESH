import { AppelFinal } from "@/components/AppelFinal";
import { Boutique } from "@/components/Boutique";
import { BoutiqueProvider } from "@/components/BoutiqueProvider";
import { Commande } from "@/components/Commande";
import { CommentCommander } from "@/components/CommentCommander";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { Navbar } from "@/components/Navbar";
import { RailGammes } from "@/components/RailGammes";
import { SelecteurAchat } from "@/components/SelecteurAchat";
import { Videos } from "@/components/Videos";
import {
  getGammes,
  getHeroSlides,
  getProducts,
  getSettings,
  getVideos,
} from "@/lib/data";

export default async function Accueil() {
  const [gammes, products, settings, slides, videos] = await Promise.all([
    getGammes(),
    getProducts(),
    getSettings(),
    getHeroSlides(),
    getVideos(),
  ]);

  // Une référence = un format en vente, pas un produit.
  const referenceCount = products.reduce((n, p) => n + p.variants.length, 0);

  return (
    <BoutiqueProvider products={products} gammes={gammes} settings={settings}>
      <Navbar />
      <main>
        <Hero
          slides={slides}
          gammes={gammes}
          settings={settings}
          referenceCount={referenceCount}
        />
        <CommentCommander settings={settings} />
        <RailGammes gammes={gammes} products={products} />
        <SelecteurAchat />
        <Boutique />
        <Commande />
        <Videos videos={videos} />
        <AppelFinal gammes={gammes} settings={settings} />
      </main>
      <Footer settings={settings} />
    </BoutiqueProvider>
  );
}
