import type { Metadata } from "next";
import Link from "next/link";
import { Boutique } from "@/components/Boutique";
import { BoutiqueProvider } from "@/components/BoutiqueProvider";
import { Commande } from "@/components/Commande";
import { EnteteBoutique } from "@/components/EnteteBoutique";
import { Hero } from "@/components/Hero";
import {
  getGammes,
  getPacks,
  getProductTypes,
  getProducts,
  getSettings,
} from "@/lib/data";
import { getT } from "@/i18n/server";
import type { ModeBoutique } from "@/lib/types";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return {
    title: t.boutique.titre,
    description: t.meta.description,
    // Page de campagne : elle vit par ses liens, pas par la recherche, et on
    // ne veut pas qu'elle concurrence l'accueil sur les mêmes requêtes.
    alternates: { canonical: "/boutique" },
  };
}

/**
 * L'adresse à donner dans une publicité.
 *
 * Même contenu que l'accueil, à deux détails près : une barre allégée au lieu
 * de la navigation complète, et l'étiquette `?c=` qui suit la visite jusqu'à la
 * commande. Le bon de commande est partagé avec l'accueil — quelqu'un peut
 * commencer ici et finir là-bas sans rien perdre.
 */
export default async function PageBoutique({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const { t } = await getT();
  const { c } = await searchParams;
  // Étiquette courte et sobre : elle finit dans une colonne de la base.
  const campagne = (c ?? "").trim().slice(0, 60);

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
      <EnteteBoutique campagne={campagne} />
      <main>
        <Hero settings={settings} packs={packs} />
        <Boutique />
        <Commande />
      </main>

      <footer className="etage-vitrine border-t border-encre-bord py-9">
        <div className="shell flex flex-wrap items-center justify-between gap-4">
          <p className="data text-[12px] text-craie">
            © {new Date().getFullYear()} Lady Fresh — {t.footer.droits}
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <a
              href={`tel:${settings.contact_phone.replace(/\s/g, "")}`}
              dir="ltr"
              className="data text-[13px] text-craie transition-colors hover:text-or"
            >
              {settings.contact_phone}
            </a>
            <Link
              href="/"
              className="eyebrow text-craie transition-colors hover:text-or"
            >
              {t.nav.accueil}
            </Link>
          </div>
        </div>
      </footer>
    </BoutiqueProvider>
  );
}
