import Link from "next/link";
import { Champ, Envoyer, FormAction, Liste } from "@/components/admin/Champs";
import { EnTetePage, PiedFormulaire, Volet } from "@/components/admin/Volet";
import {
  changerStatutPiste,
  commanderDepuisPiste,
  supprimerPiste,
} from "@/lib/actions";
import { getPacks, getPistesActives, getProducts, getSettings } from "@/lib/data";
import { da, unitPrice } from "@/lib/format";
import { getT } from "@/i18n/server";
import { WILAYAS, libelleWilaya, valeurWilaya } from "@/lib/wilayas";
import type { Prospect, ProspectStatus } from "@/lib/types";

/**
 * Ce qu'on peut mettre dans le bon, au téléphone.
 *
 * Coffrets et formats se ressemblent assez, une fois dans un bon de commande,
 * pour tenir dans une seule forme : un nom, un prix, et de quoi dire au serveur
 * de quelle nature il s'agit. C'est ce qui permet à l'écran de rappel de suivre
 * `mode_boutique` au lieu de ne connaître que les coffrets.
 */
type Article = {
  kind: "pack" | "produit";
  id: string;
  nom: string;
  prix: number;
};

export const dynamic = "force-dynamic";

const TEINTE: Record<string, string> = {
  ouverte: "var(--or-plein)",
  rappelee: "var(--accent)",
};

/**
 * Les paniers laissés en route.
 *
 * Le pixel disait qu'une part des visiteurs remplissait le bon puis repartait.
 * Ces gens-là avaient donné de quoi être joints : ils manquaient seulement d'un
 * coup de fil.
 *
 * La page ne montre que ce qui appelle un geste. Une piste dont la cliente a
 * fini par commander — sur le site, ou par ce même écran — disparaît : elle vit
 * désormais dans les commandes. Elle était consultable par un filtre, ce qui
 * revenait à garder ouverte en permanence une liste de travail déjà fait.
 *
 * Restent deux états : à rappeler, et rappelée sans réponse.
 */
type Filtre = "tous" | "ouverte" | "rappelee";
const FILTRES: Filtre[] = ["tous", "ouverte", "rappelee"];

export default async function Pistes({
  searchParams,
}: {
  searchParams: Promise<{ f?: string }>;
}) {
  const { t, locale } = await getT();
  const { f } = await searchParams;
  const filtre: Filtre = FILTRES.includes(f as Filtre) ? (f as Filtre) : "tous";

  const [{ pistes, tableManquante }, packs, produits, reglages] = await Promise.all([
    getPistesActives(),
    getPacks(),
    getProducts(),
    getSettings(),
  ]);

  /*
    L'écran de rappel ne connaissait que les coffrets, et l'action ne savait
    commander que cela. En mode « produits » la liste était donc vide : il n'y
    avait rien à cocher, et valider rendait invariablement « Le panier est
    vide » — le geste central de cette page était impossible.

    On propose désormais ce que la boutique vend réellement.
  */
  const catalogue: Article[] =
    reglages.mode_boutique === "produits"
      ? produits.flatMap((p) =>
          p.variants.map((v) => ({
            kind: "produit" as const,
            id: v.id,
            nom: `${p.name || p.slug} — ${v.size_label}`,
            prix: unitPrice(v),
          })),
        )
      : packs.map((p) => ({
          kind: "pack" as const,
          id: p.id,
          nom: p.name,
          prix: p.price,
        }));

  const a = t.admin.pistes;
  const devise = t.unites.devise;

  const compte = (cle: Filtre) =>
    cle === "tous" ? pistes.length : pistes.filter((p) => p.status === cle).length;
  const visibles =
    filtre === "tous" ? pistes : pistes.filter((p) => p.status === filtre);

  return (
    <div>
      <EnTetePage eyebrow={a.eyebrow} titre={a.titre} aide={a.aide} />

      {tableManquante && (
        <p
          className="rounded border px-5 py-4 text-[length:var(--adm-t-md)]"
          style={{
            borderColor: "var(--adm-danger)",
            color: "var(--adm-danger)",
            background: "color-mix(in srgb, var(--danger) 7%, transparent)",
          }}
        >
          {a.tableManquante}
        </p>
      )}

      {!tableManquante && pistes.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-2">
          {FILTRES.map((cle) => {
            const actif = cle === filtre;
            return (
              <Link
                key={cle}
                href={cle === "tous" ? "/admin/pistes" : `/admin/pistes?f=${cle}`}
                aria-current={actif ? "page" : undefined}
                className={`adm-btn ${actif ? "adm-btn-principal" : "adm-btn-neutre"}`}
                style={{ borderRadius: "999px", textDecoration: "none" }}
              >
                {a.filtres[cle]} · {compte(cle)}
              </Link>
            );
          })}
        </div>
      )}

      {!tableManquante && visibles.length === 0 && (
        <p className="adm-vide">{pistes.length === 0 ? a.vide : a.videFiltre}</p>
      )}

      {visibles.length > 0 && (
        <ul className="space-y-2.5">
          {visibles.map((p) => (
            <LignePiste
              key={p.id}
              piste={p}
              catalogue={catalogue}
              livraison={reglages.livraison_active}
              t={t}
              devise={devise}
              locale={locale}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function LignePiste({
  piste,
  catalogue,
  livraison,
  t,
  devise,
  locale,
}: {
  piste: Prospect;
  catalogue: Article[];
  livraison: boolean;
  t: Awaited<ReturnType<typeof getT>>["t"];
  devise: string;
  locale: string;
}) {
  const a = t.admin.pistes;
  const quand = new Date(piste.updated_at).toLocaleString(
    locale === "ar" ? "ar-DZ" : locale === "en" ? "en-GB" : "fr-DZ",
    { dateStyle: "short", timeStyle: "short" },
  );

  /*
    Le panier d'origine, retrouvé ligne par ligne.

    Un format se retrouve par son identifiant : la piste le porte, et c'est un
    appariement exact — deux tailles d'un même produit ne se confondent pas. Un
    coffret n'en a pas (`composer()` lui pose une chaîne vide), il se retrouve
    donc par son nom ; renommé depuis l'abandon, il ressort à zéro, ce qui est
    visible et corrigeable plutôt que faussement apparié.
  */
  const parVariante = new Map(
    piste.items.filter((i) => i.variant_id).map((i) => [i.variant_id, i.quantity]),
  );
  const parNom = new Map(piste.items.map((i) => [i.product_name, i.quantity]));
  const quantiteDe = (article: Article) =>
    article.kind === "produit"
      ? (parVariante.get(article.id) ?? 0)
      : (parNom.get(article.nom) ?? 0);

  return (
    <li className="adm-carte p-4">
      {/* Le numéro d'abord : c'est la seule chose qu'on vient chercher ici. */}
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ background: TEINTE[piste.status] ?? "var(--adm-line)" }}
        />
        <div className="min-w-0 flex-1">
          <a
            href={"tel:" + piste.phone.replace(/\s/g, "")}
            dir="ltr"
            className="data inline-flex items-center underline underline-offset-4"
            style={{ fontSize: "var(--adm-t-lg)", minHeight: "var(--adm-h)" }}
          >
            {piste.phone}
          </a>
          <p style={{ fontSize: "var(--adm-t-md)" }}>
            {piste.customer_name || a.sansNom}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {piste.wilaya && (
              <span className="adm-pastille adm-pastille-nue">{piste.wilaya}</span>
            )}
            {piste.source && (
              <span className="adm-pastille adm-pastille-nue">{piste.source}</span>
            )}
            <span
              className="data"
              style={{ fontSize: "var(--adm-t-xs)", color: "var(--adm-muted)" }}
            >
              {quand}
            </span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------- le panier laissé */}
      <div className="mt-3 border-t pt-3" style={{ borderColor: "var(--adm-line)" }}>
        <ul className="space-y-1">
          {piste.items.map((i, n) => (
            <li
              key={n}
              className="flex justify-between gap-3"
              style={{ fontSize: "var(--adm-t-sm)" }}
            >
              <span style={{ color: "var(--adm-muted)" }}>
                {i.product_name} {i.size_label} &times; {i.quantity}
              </span>
              <span className="data shrink-0">{da(i.line_total, devise)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 flex justify-between gap-3">
          <span className="adm-etiquette mb-0">{a.total}</span>
          <span
            className="data"
            style={{ fontSize: "var(--adm-t-md)", fontWeight: 500 }}
          >
            {da(piste.total, devise)}
          </span>
        </p>
      </div>

      {(piste.address || piste.note) && (
        <div
          className="mt-2.5"
          style={{ fontSize: "var(--adm-t-sm)", color: "var(--adm-muted)" }}
        >
          {piste.address && <p>{piste.address}</p>}
          {piste.note && <p>&laquo;&nbsp;{piste.note}&nbsp;&raquo;</p>}
        </div>
      )}

      {/*
        Deux gestes, et un seul qui compte.

        « Rappelé » note qu'on a téléphoné sans conclure. « A commandé » ouvre le
        bon : on y corrige ce que la cliente a finalement voulu, puis on valide —
        et la piste devient une vraie commande, visible seulement dans les
        commandes. Rien ne peut le faire à notre place : un accord donné au
        téléphone n'entre pas par le site.
      */}
      <div
        className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3"
        style={{ borderColor: "var(--adm-line)" }}
      >
        <FormAction action={changerStatutPiste}>
          <input type="hidden" name="id" value={piste.id} />
          <input
            type="hidden"
            name="status"
            value={piste.status === "rappelee" ? "ouverte" : "rappelee"}
          />
          <Envoyer>
            {piste.status === "rappelee" ? a.marquerNonRappelee : a.marquerRappelee}
          </Envoyer>
        </FormAction>

        <span className="ms-auto">
          <FormAction action={supprimerPiste}>
            <input type="hidden" name="id" value={piste.id} />
            <Envoyer variante="danger" confirmer={a.confirmSuppr}>
              {t.admin.commun.supprimer}
            </Envoyer>
          </FormAction>
        </span>
      </div>

      {/* ------------------------------------- le bon, corrigé puis validé */}
      <div className="mt-3">
        <Volet label={a.marquerCommande} labelOuvert={t.admin.commun.fermer} ton="principal">
          <FormAction action={commanderDepuisPiste}>
            <input type="hidden" name="id" value={piste.id} />

            <div className="grid gap-3 sm:grid-cols-2">
              <Champ
                label={t.commande.nom}
                name="customer_name"
                defaultValue={piste.customer_name}
                required
              />
              <Champ
                label={t.commande.telephone}
                name="phone"
                defaultValue={piste.phone}
                dir="ltr"
                required
              />
              <Liste
                label={t.commande.wilaya}
                name="wilaya"
                required
                defaultValue={piste.wilaya}
                placeholder={t.commande.wilayaChoisir}
                options={WILAYAS.map((w) => ({
                  value: valeurWilaya(w),
                  label: libelleWilaya(w, locale),
                }))}
              />
              {livraison && (
                <Liste
                  label={t.livraison.titre}
                  name="livraison_mode"
                  required
                  placeholder={t.livraison.choisir}
                  options={[
                    { value: "stopdesk", label: t.livraison.stopdesk },
                    { value: "domicile", label: t.livraison.domicile },
                  ]}
                />
              )}
              <Champ
                label={t.commande.adresse}
                name="address"
                defaultValue={piste.address}
                className="sm:col-span-2"
              />
              <Champ
                label={t.commande.note}
                name="note"
                defaultValue={piste.note}
                className="sm:col-span-2"
              />
            </div>

            {/*
              Le catalogue en entier, quantités préremplies : au téléphone, la
              cliente change souvent d'avis, et retrouver un coffret dans une
              liste déroulante pendant qu'elle parle ne marche pas.
            */}
            <p
              className="adm-etiquette mt-5 border-b pb-1.5"
              style={{ borderColor: "var(--adm-line)" }}
            >
              {a.modifier}
            </p>
            <ul>
              {catalogue.map((article) => (
                <li
                  key={`${article.kind}:${article.id}`}
                  className="flex items-center gap-3 border-b py-2"
                  style={{ borderColor: "var(--adm-line)" }}
                >
                  <span className="min-w-0 flex-1">
                    <span
                      className="block truncate"
                      style={{ fontSize: "var(--adm-t-md)" }}
                    >
                      {article.nom}
                    </span>
                    <span
                      className="data block"
                      style={{
                        fontSize: "var(--adm-t-sm)",
                        color: "var(--adm-muted)",
                      }}
                    >
                      {da(article.prix, devise)}
                    </span>
                  </span>
                  {/* La nature voyage dans le nom du champ : l'action doit
                      savoir si elle commande un coffret ou un format. */}
                  <input
                    type="number"
                    name={`qte_${article.kind}_${article.id}`}
                    min={0}
                    step={1}
                    inputMode="numeric"
                    aria-label={article.nom}
                    defaultValue={quantiteDe(article)}
                    className="adm-champ w-20 shrink-0 text-center"
                  />
                </li>
              ))}
            </ul>

            <PiedFormulaire>
              <Envoyer variante="principal">{a.enregistrerPanier}</Envoyer>
            </PiedFormulaire>
          </FormAction>
        </Volet>
      </div>
    </li>
  );
}
