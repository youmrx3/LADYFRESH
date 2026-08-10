import Image from "next/image";
import {
  Bascule,
  Champ,
  ChampCouleur,
  Envoyer,
  FormAction,
  Zone,
} from "@/components/admin/Champs";
import { AmorcerBase } from "@/components/admin/AmorcerBase";
import { ChampImage } from "@/components/admin/ChampImage";
import { OngletsLangue } from "@/components/admin/OngletsLangue";
import { EnTetePage, Ligne, Volet } from "@/components/admin/Volet";
import { enregistrerGamme, supprimerGamme } from "@/lib/actions";
import { getGammesAdmin, getProductsAdmin } from "@/lib/data";
import { fill } from "@/i18n";
import { champ } from "@/i18n/contenu";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/i18n/config";
import { getT } from "@/i18n/server";
import type { Gamme } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Gammes({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const { t } = await getT();
  const { edit } = await searchParams;
  const langue: Locale = isLocale(edit) ? edit : DEFAULT_LOCALE;

  const [gammes, products] = await Promise.all([
    getGammesAdmin(),
    getProductsAdmin(),
  ]);
  const a = t.admin;

  const labelsImage = {
    choisirFichier: a.commun.choisirFichier,
    televersement: a.commun.televersement,
    retirer: a.commun.retirerImage,
    aucune: a.commun.aucuneImage,
    ouCollerUrl: a.commun.ouCollerUrl,
  };

  return (
    <div>
      <EnTetePage
        eyebrow={a.gammes.catalogue}
        titre={a.gammes.titre}
        aide={a.gammes.aide}
        action={
          <AmorcerBase
            label={a.gammes.amorcer}
            enCours={a.gammes.amorcage}
            confirmer={a.gammes.confirmAmorcer}
          />
        }
      />

      <div className="mb-5">
        <OngletsLangue
          actif={langue}
          base="/admin/gammes"
          label={a.commun.langueEditee}
        />
      </div>

      {langue === "fr" && (
        <Volet label={a.gammes.nouvelle} labelOuvert={a.commun.annuler} ton="principal">
          <div
            className="rounded-[10px] border border-trait p-4"
            style={{ background: "var(--comptoir-surface)" }}
          >
            <FormAction action={enregistrerGamme}>
              <input type="hidden" name="edit_lang" value="fr" />
              <ChampsGamme
                t={t}
                langue="fr"
                labelsImage={labelsImage}
                ordreParDefaut={gammes.length + 1}
              />
              <div className="mt-4">
                <Envoyer variante="or">{a.commun.creer}</Envoyer>
              </div>
            </FormAction>
          </div>
        </Volet>
      )}

      <ul className="mt-6 space-y-2.5">
        {gammes.map((gamme) => {
          const nb = products.filter((p) => p.gamme_id === gamme.id).length;
          return (
            <Ligne
              key={gamme.id}
              labelModifier={a.commun.modifier}
              labelFermer={a.commun.fermer}
              visuel={
                <span className="flex shrink-0 items-center gap-2">
                  <span
                    className="h-9 w-2.5 rounded-sm"
                    style={{ background: gamme.color_hex }}
                  />
                  {gamme.cover_image && (
                    <span className="relative block h-11 w-11 overflow-hidden rounded">
                      <Image
                        src={gamme.cover_image}
                        alt=""
                        fill
                        sizes="44px"
                        className="object-cover"
                      />
                    </span>
                  )}
                </span>
              }
              titre={gamme.name}
              meta={`${gamme.color_name} · ${fill(
                nb > 1 ? a.gammes.produitsPluriel : a.gammes.produits,
                { n: nb },
              )}${gamme.active ? "" : ` · ${a.commun.masque}`}`}
              actions={
                langue === "fr" ? (
                  <FormAction action={supprimerGamme}>
                    <input type="hidden" name="id" value={gamme.id} />
                    <Envoyer
                      variante="danger"
                      confirmer={fill(a.gammes.confirmSuppr, { nom: gamme.name })}
                    >
                      {a.commun.supprimer}
                    </Envoyer>
                  </FormAction>
                ) : undefined
              }
            >
              <FormAction action={enregistrerGamme}>
                <input type="hidden" name="id" value={gamme.id} />
                <input type="hidden" name="edit_lang" value={langue} />
                <ChampsGamme
                  t={t}
                  gamme={gamme}
                  langue={langue}
                  labelsImage={labelsImage}
                  ordreParDefaut={gamme.sort_order}
                />
                <div className="mt-4">
                  <Envoyer>{a.commun.enregistrer}</Envoyer>
                </div>
              </FormAction>
            </Ligne>
          );
        })}
      </ul>
    </div>
  );
}

function ChampsGamme({
  t,
  gamme,
  langue,
  labelsImage,
  ordreParDefaut,
}: {
  t: Awaited<ReturnType<typeof getT>>["t"];
  gamme?: Gamme;
  langue: Locale;
  labelsImage: React.ComponentProps<typeof ChampImage>["labels"];
  ordreParDefaut: number;
}) {
  const a = t.admin;
  const dir = langue === "ar" ? "rtl" : "ltr";

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <Champ
          label={a.gammes.surtitre}
          name="tagline"
          dir={dir}
          defaultValue={gamme ? champ(gamme, "tagline", langue) : ""}
        />
        <Zone
          label={a.commun.description}
          name="description"
          dir={dir}
          defaultValue={gamme ? champ(gamme, "description", langue) : ""}
          rows={2}
        />
      </div>

      {/* Nom de marque, couleur, image et ordre : identiques dans toutes les
          langues, donc éditables seulement depuis le français. */}
      {langue === "fr" ? (
        <>
          <div className="mt-3 grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Champ label={a.commun.nom} name="name" defaultValue={gamme?.name} required />
            <Champ
              label={a.commun.slug}
              name="slug"
              defaultValue={gamme?.slug}
              placeholder="rouge-sensuel"
              required
            />
            <Champ
              label={a.gammes.nomCouleur}
              name="color_name"
              defaultValue={gamme?.color_name}
            />
            <ChampCouleur
              label={a.commun.couleur}
              name="color_hex"
              defaultValue={gamme?.color_hex}
              apercu={a.commun.apercu}
            />
            <Champ
              label={a.commun.ordre}
              name="sort_order"
              type="number"
              defaultValue={ordreParDefaut}
            />
            <Bascule
              label={a.commun.visible}
              name="active"
              defaultChecked={gamme?.active ?? true}
            />
          </div>

          <div className="mt-3">
            <ChampImage
              label={a.gammes.couverture}
              name="cover_image"
              defaultValue={gamme?.cover_image}
              labels={labelsImage}
              ratio="4 / 5"
            />
          </div>
        </>
      ) : (
        <p className="mt-2 text-[12.5px] text-graphite-doux">
          {a.commun.videFrRepris}
        </p>
      )}
    </>
  );
}
