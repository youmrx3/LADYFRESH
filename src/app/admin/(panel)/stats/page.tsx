import Link from "next/link";
import { CarteSection, EnTetePage } from "@/components/admin/Volet";
import { getStatistiques } from "@/lib/data";
import { da } from "@/lib/format";
import { getT } from "@/i18n/server";

export const dynamic = "force-dynamic";

const PERIODES = [7, 30, 0] as const;

/*
  Ce que le site a fait, en un écran.

  Le chiffre d'affaires ne compte que les commandes confirmées, livraison
  déduite : une commande nouvelle n'est pas encore une vente, une commande
  revenue n'en est plus une, et les frais d'expédition passent au transporteur.
  Un chiffre gonflé par des commandes qu'on n'a pas encore eues au téléphone ne
  sert à rien.
*/
export default async function Stats({
  searchParams,
}: {
  searchParams: Promise<{ j?: string }>;
}) {
  const { t } = await getT();
  const { j } = await searchParams;
  const jours = PERIODES.includes(Number(j) as (typeof PERIODES)[number])
    ? Number(j)
    : 7;

  const s = await getStatistiques(jours);
  const m = t.admin.stats;
  const devise = t.unites.devise;

  const libelle: Record<number, string> = { 7: m.j7, 30: m.j30, 0: m.tout };
  const paniers = s.pistesOuvertes + s.pistesConverties;
  const taux = paniers ? Math.round((s.pistesConverties / paniers) * 100) : 0;
  const sommet = Math.max(1, ...s.parJour.map((d) => d.ca));

  return (
    <div>
      <EnTetePage
        eyebrow={m.eyebrow}
        titre={m.titre}
        aide={m.aide}
        action={
          <nav className="flex gap-2" aria-label={m.periode}>
            {PERIODES.map((p) => (
              <Link
                key={p}
                href={`/admin/stats?j=${p}`}
                aria-current={jours === p ? "page" : undefined}
                className={`adm-btn ${
                  jours === p ? "adm-btn-principal" : "adm-btn-neutre"
                }`}
                style={{ borderRadius: "999px", textDecoration: "none" }}
              >
                {libelle[p]}
              </Link>
            ))}
          </nav>
        }
      />

      {/* ------------------------------------------------ les quatre chiffres */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Chiffre label={m.ca} valeur={da(s.ca, devise)} fort />
        <Chiffre label={m.confirmees} valeur={String(s.confirmees)} />
        <Chiffre label={m.panier} valeur={da(s.panier, devise)} />
        <Chiffre label={m.nouvelles} valeur={String(s.nouvelles)} accent="#c4102b" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* ------------------------------------------------------- par jour */}
        <CarteSection titre={m.parJour}>
          {s.parJour.length === 0 ? (
            <p className="adm-vide">{m.vide}</p>
          ) : (
            /*
              Des barres en CSS plutôt qu'une bibliothèque de graphiques : on
              lit ici une tendance sur trente points, pas une série financière.
              Rien à charger, rien à hydrater, et ça marche sans JavaScript.
            */
            <ul className="space-y-2">
              {s.parJour.map((d) => (
                <li key={d.jour} className="flex items-center gap-3">
                  <span
                    className="data w-[4.5rem] shrink-0"
                    style={{
                      fontSize: "var(--adm-t-xs)",
                      color: "var(--adm-muted)",
                    }}
                  >
                    {d.jour.slice(5)}
                  </span>
                  <span
                    className="h-2.5 min-w-[2px] rounded-full"
                    style={{
                      width: `${Math.max(2, (d.ca / sommet) * 100)}%`,
                      background: "var(--adm-accent)",
                    }}
                  />
                  <span
                    className="data ms-auto shrink-0"
                    style={{ fontSize: "var(--adm-t-sm)" }}
                  >
                    {da(d.ca, devise)}
                  </span>
                  <span
                    className="data w-8 shrink-0 text-end"
                    style={{
                      fontSize: "var(--adm-t-xs)",
                      color: "var(--adm-muted)",
                    }}
                  >
                    ×{d.commandes}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CarteSection>

        {/* ------------------------------- la transformation, et les retours */}
        <CarteSection titre={m.conversion} aide={m.conversionAide}>
          <div className="flex items-baseline gap-3">
            <span
              className="data display"
              style={{ fontSize: "var(--adm-t-xl)" }}
            >
              {taux}%
            </span>
            <span className="adm-aide">
              {s.pistesConverties} / {paniers}
            </span>
          </div>
          <div
            className="mt-3 h-2.5 overflow-hidden rounded-full"
            style={{ background: "var(--adm-line)" }}
          >
            <span
              className="block h-full rounded-full"
              style={{ width: `${taux}%`, background: "var(--adm-accent)" }}
            />
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-4">
            <div>
              <dt className="adm-etiquette">{m.retours}</dt>
              <dd className="data" style={{ fontSize: "var(--adm-t-lg)" }}>
                {s.retours}
              </dd>
            </div>
            <div>
              <dt className="adm-etiquette">{m.nouvelles}</dt>
              <dd className="data" style={{ fontSize: "var(--adm-t-lg)" }}>
                {s.nouvelles}
              </dd>
            </div>
          </dl>
        </CarteSection>

        <CarteSection titre={m.topPacks}>
          <Palmares lignes={s.topPacks} vide={m.vide} />
        </CarteSection>

        <CarteSection titre={m.wilayas}>
          <Palmares lignes={s.wilayas} vide={m.vide} />
        </CarteSection>
      </div>
    </div>
  );
}

function Chiffre({
  label,
  valeur,
  fort,
  accent,
}: {
  label: string;
  valeur: string;
  fort?: boolean;
  accent?: string;
}) {
  return (
    <div className="adm-carte p-4">
      <p className="adm-etiquette">{label}</p>
      <p
        className={fort ? "data display" : "data"}
        style={{
          fontSize: fort ? "var(--adm-t-xl)" : "var(--adm-t-lg)",
          color: accent ?? undefined,
          lineHeight: 1.15,
        }}
      >
        {valeur}
      </p>
    </div>
  );
}

function Palmares({
  lignes,
  vide,
}: {
  lignes: { nom: string; n: number }[];
  vide: string;
}) {
  if (lignes.length === 0) return <p className="adm-vide">{vide}</p>;
  const sommet = Math.max(1, ...lignes.map((l) => l.n));

  return (
    <ol className="space-y-2">
      {lignes.map((l) => (
        <li key={l.nom}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="truncate" style={{ fontSize: "var(--adm-t-md)" }}>
              {l.nom}
            </span>
            <span className="data shrink-0" style={{ fontSize: "var(--adm-t-sm)" }}>
              {l.n}
            </span>
          </div>
          <span
            className="mt-1 block h-1.5 rounded-full"
            style={{
              width: `${(l.n / sommet) * 100}%`,
              background: "var(--adm-accent)",
              opacity: 0.75,
            }}
          />
        </li>
      ))}
    </ol>
  );
}
