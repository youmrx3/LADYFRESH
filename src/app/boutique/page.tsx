import type { Metadata } from "next";
import Link from "next/link";
import { Boutique } from "@/components/Boutique";
import { BoutiqueProvider } from "@/components/BoutiqueProvider";
import { Commande } from "@/components/Commande";
import { EnteteBoutique } from "@/components/EnteteBoutique";
import { SelecteurAchat } from "@/components/SelecteurAchat";
import {
  getGammes,
  getProductTypes,
  getProducts,
  getSettings,
} from "@/lib/data";
import { getT } from "@/i18n/server";

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
 * Page de campagne.
 *
 * Une adresse à donner dans une publicité, qui ouvre la boutique seule : pas
 * de hero, pas de gammes, pas de vidéos — le catalogue, le choix du format et
 * la commande, rien d'autre.
 *
 * Elle réutilise exactement les mêmes composants que la page d'accueil, donc
 * les mêmes prix, le même panier (partagé via localStorage, un client peut
 * commencer ici et finir sur la vitrine) et le même `/api/orders`. Une
 * commande passée ici est une commande comme une autre ; seule l'étiquette
 * `?c=` la distingue dans le suivi.
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

  const [gammes, products, types, settings] = await Promise.all([
    getGammes(),
    getProducts(),
    getProductTypes(),
    getSettings(),
  ]);

  return (
    <BoutiqueProvider
      products={products}
      gammes={gammes}
      types={types}
      settings={settings}
    >
      <EnteteBoutique campagne={campagne} />
      <main>
        <SelecteurAchat />
        <Boutique />
        <Commande />
      </main>

      <footer className="etage-vitrine border-t border-encre-bord py-10">
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
