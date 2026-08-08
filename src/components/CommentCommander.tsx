import { Reveal } from "./Reveal";
import type { SiteSettings } from "@/lib/types";

export function CommentCommander({ settings }: { settings: SiteSettings }) {
  const etapes = [
    {
      titre: "Choisissez votre format",
      texte: `Gros par carton, ou demi-gros à partir de ${settings.min_demi_gros_pieces} pièces. Les prix de la boutique s'ajustent au format choisi.`,
    },
    {
      titre: "Composez votre commande",
      texte:
        "Filtrez par produit ou par couleur, indiquez les quantités. Le récapitulatif se met à jour au fur et à mesure.",
    },
    {
      titre: "Envoyez-la",
      texte:
        "Un bouton ouvre WhatsApp avec votre commande déjà écrite. Pas de WhatsApp ? Le formulaire nous l'envoie directement.",
    },
  ];

  return (
    <section id="commander" className="etage-sombre saut-ancre border-t border-encre-bord py-20 sm:py-24">
      <div className="shell">
        <Reveal>
          <p className="eyebrow text-or">Comment commander</p>
          <h2 className="display display-l mt-4 max-w-[22ch]">
            Trois étapes, et c&apos;est envoyé.
          </h2>
        </Reveal>

        <ol className="mt-12 grid gap-px bg-encre-bord sm:mt-16 md:grid-cols-3">
          {etapes.map((etape, i) => (
            <Reveal as="li" key={etape.titre} delay={i * 110}>
              <div className="h-full bg-encre p-7 sm:p-8">
                <div className="flex items-center gap-3">
                  <span className="data text-[13px] text-or">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="h-px flex-1 bg-or/25" />
                </div>
                <h3 className="display display-m mt-6">{etape.titre}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-craie">
                  {etape.texte}
                </p>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
