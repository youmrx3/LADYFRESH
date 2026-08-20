import Image from "next/image";
import {
  Bascule,
  Champ,
  Envoyer,
  FormAction,
  Zone,
} from "@/components/admin/Champs";
import { ChampImage } from "@/components/admin/ChampImage";
import { CompositionPack } from "@/components/admin/CompositionPack";
import { OngletsLangue } from "@/components/admin/OngletsLangue";
import { EnTetePage, Ligne, Volet } from "@/components/admin/Volet";
import { enregistrerPack, supprimerPack } from "@/lib/actions";
import { getPacksAdmin, getProductsAdmin, getProductTypes } from "@/lib/data";
import { da } from "@/lib/format";
import { fill } from "@/i18n";
import { champ, nomTypeCourt } from "@/i18n/contenu";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/i18n/config";
import { getT } from "@/i18n/server";
import type { Pack } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Les coffrets.
 *
 * Un coffret se compose de formats pris dans le catalogue : c'est ce qui évite
 * qu'un contenu écrit à la main se mette à mentir le jour où un format est
 * renommé. Le libellé est malgré tout figé à l'enregistrement, pour que la
 * suppression d'un format ne vide pas la description d'un coffret déjà vendu.
 */
export default async function Packs({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const { t, locale } = await getT();
  const { edit } = await searchParams;
  const langue: Locale = isLocale(edit) ? edit : DEFAULT_LOCALE;

  const [packs, products, types] = await Promise.all([
    getPacksAdmin(),
    getProductsAdmin(),
    getProductTypes(),
  ]);
  const a = t.admin.packs;

  /* Chaque format devient une option, nommée comme la cliente le lira. */
  const options = products.flatMap((p) =>
    p.variants.map((v) => ({
      value: v.id,
      label: `${nomTypeCourt(
        types.find((x) => x.id === p.type_id),
        locale,
      )} ${p.name || p.slug} — ${v.size_label}`.replace(/\s+/g, " ").trim(),
    })),
  );

  const labelsImage = {
    choisirFichier: t.admin.commun.choisirFichier,
    televersement: t.admin.commun.televersement,
    retirer: t.admin.commun.retirerImage,
    aucune: t.admin.commun.aucuneImage,
    ouCollerUrl: t.admin.commun.ouCollerUrl,
  };

  return (
    <div>
      <EnTetePage eyebrow={a.eyebrow} titre={a.titre} aide={a.aide} />

      <div className="mb-5">
        <OngletsLangue
          actif={langue}
          base="/admin/packs"
          label={t.admin.commun.langueEditee}
        />
      </div>

      {langue === "fr" && (
        <Volet label={a.nouveau} labelOuvert={t.admin.commun.annuler} ton="principal">
          <div
            className="rounded-[10px] border border-trait p-4"
            style={{ background: "var(--comptoir-surface)" }}
          >
            <FormAction action={enregistrerPack}>
              <input type="hidden" name="edit_lang" value="fr" />
              <ChampsPack
                t={t}
                langue="fr"
                options={options}
                labelsImage={labelsImage}
                ordreParDefaut={packs.length + 1}
              />
              <div className="mt-4">
                <Envoyer variante="or">{t.admin.commun.creer}</Envoyer>
              </div>
            </FormAction>
          </div>
        </Volet>
      )}

      <ul className="mt-6 space-y-2.5">
        {packs.map((pack) => (
          <Ligne
            key={pack.id}
            labelModifier={t.admin.commun.modifier}
            labelFermer={t.admin.commun.fermer}
            visuel={
              <span className="relative block h-14 w-14 shrink-0 overflow-hidden rounded">
                {pack.image ? (
                  <Image src={pack.image} alt="" fill sizes="56px" className="object-cover" />
                ) : (
                  <span
                    className="block h-full w-full"
                    style={{ background: "var(--comptoir-line)" }}
                  />
                )}
              </span>
            }
            titre={champ(pack, "name", langue) || pack.name}
            meta={`${da(pack.price, t.unites.devise)} · ${fill(
              pack.items.length > 1 ? a.contenuPluriel : a.contenu,
              { n: pack.items.length },
            )}${pack.active ? "" : ` · ${t.admin.commun.masque}`}`}
            actions={
              langue === "fr" ? (
                <FormAction action={supprimerPack}>
                  <input type="hidden" name="id" value={pack.id} />
                  <Envoyer variante="danger" confirmer={fill(a.confirmSuppr, { nom: pack.name })}>
                    {t.admin.commun.supprimer}
                  </Envoyer>
                </FormAction>
              ) : undefined
            }
          >
            <FormAction action={enregistrerPack}>
              <input type="hidden" name="id" value={pack.id} />
              <input type="hidden" name="edit_lang" value={langue} />
              <ChampsPack
                t={t}
                pack={pack}
                langue={langue}
                options={options}
                labelsImage={labelsImage}
                ordreParDefaut={pack.sort_order}
              />
              <div className="mt-4">
                <Envoyer>{t.admin.commun.enregistrer}</Envoyer>
              </div>
            </FormAction>
          </Ligne>
        ))}
      </ul>
    </div>
  );
}

function ChampsPack({
  t,
  pack,
  langue,
  options,
  labelsImage,
  ordreParDefaut,
}: {
  t: Awaited<ReturnType<typeof getT>>["t"];
  pack?: Pack;
  langue: Locale;
  options: { value: string; label: string }[];
  labelsImage: React.ComponentProps<typeof ChampImage>["labels"];
  ordreParDefaut: number;
}) {
  const a = t.admin.packs;
  const dir = langue === "ar" ? "rtl" : "ltr";

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <Champ
          label={t.admin.commun.nom}
          name="name"
          dir={dir}
          defaultValue={pack ? champ(pack, "name", langue) : ""}
          required={langue === "fr"}
        />
        <Champ
          label={a.accroche}
          name="tagline"
          dir={dir}
          defaultValue={pack ? champ(pack, "tagline", langue) : ""}
        />
      </div>

      <div className="mt-3">
        <Zone
          label={t.admin.commun.description}
          name="description"
          dir={dir}
          defaultValue={pack ? champ(pack, "description", langue) : ""}
          rows={2}
        />
      </div>

      {/* Prix, photo, ordre et composition ne dépendent pas de la langue. */}
      {langue === "fr" ? (
        <>
          <div className="mt-3 grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Champ
              label={t.admin.commun.slug}
              name="slug"
              defaultValue={pack?.slug}
              placeholder="coffret-essentiel"
              required
            />
            <Champ
              label={a.prix}
              name="price"
              type="number"
              defaultValue={pack?.price}
              required
            />
            <Champ
              label={a.prixBarre}
              name="prix_barre"
              type="number"
              defaultValue={pack?.prix_barre || ""}
            />
            <Champ
              label={t.admin.commun.ordre}
              name="sort_order"
              type="number"
              defaultValue={ordreParDefaut}
            />
          </div>

          <div className="mt-3">
            <Bascule
              label={t.admin.commun.visible}
              name="active"
              defaultChecked={pack?.active ?? true}
            />
          </div>

          <div className="mt-3">
            <ChampImage
              label={a.photo}
              name="image"
              defaultValue={pack?.image}
              labels={labelsImage}
              ratio="4 / 3"
            />
          </div>

          <div className="mt-4">
            <CompositionPack
              options={options}
              lignes={(pack?.items ?? []).map((i) => ({
                variantId: i.variant_id ?? "",
                label: i.label,
                quantity: i.quantity,
              }))}
              labels={{
                titre: a.composition,
                aide: a.compositionAide,
                ajouter: a.ajouterLigne,
                retirer: t.admin.commun.supprimer,
                produit: a.produit,
                quantite: a.quantite,
                choisir: a.choisirFormat,
              }}
            />
          </div>
        </>
      ) : (
        <p className="mt-2 text-[12.5px] text-graphite-doux">
          {t.admin.commun.videFrRepris}
        </p>
      )}
    </>
  );
}
