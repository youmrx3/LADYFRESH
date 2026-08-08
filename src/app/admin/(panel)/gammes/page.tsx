import Image from "next/image";
import {
  Bascule,
  Champ,
  Envoyer,
  FormAction,
  Zone,
} from "@/components/admin/Champs";
import { AmorcerBase } from "@/components/admin/AmorcerBase";
import { EnTetePage, Ligne, Volet } from "@/components/admin/Volet";
import { enregistrerGamme, supprimerGamme } from "@/lib/actions";
import { getGammes, getProducts } from "@/lib/data";
import { fill } from "@/i18n";
import { getT } from "@/i18n/server";
import type { Gamme } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Gammes() {
  const { t } = await getT();
  const [gammes, products] = await Promise.all([getGammes(), getProducts()]);
  const a = t.admin;

  return (
    <div>
      <EnTetePage
        eyebrow={a.gammes.catalogue}
        titre={a.gammes.titre}
        aide={a.gammes.aide}
        action={<AmorcerBase label={a.gammes.amorcer} enCours={a.gammes.amorcage} confirmer={a.gammes.confirmAmorcer} />}
      />

      {/* La création vit en haut : c'est le geste qu'on cherche en arrivant. */}
      <Volet label={a.gammes.nouvelle} labelOuvert={a.commun.annuler} ton="principal">
        <div
          className="rounded-[10px] border border-trait p-4"
          style={{ background: "var(--comptoir-surface)" }}
        >
          <FormAction action={enregistrerGamme}>
            <ChampsGamme t={t} ordreParDefaut={gammes.length + 1} />
            <div className="mt-4">
              <Envoyer variante="or">{a.commun.creer}</Envoyer>
            </div>
          </FormAction>
        </div>
      </Volet>

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
                <FormAction action={supprimerGamme}>
                  <input type="hidden" name="id" value={gamme.id} />
                  <Envoyer
                    variante="danger"
                    confirmer={fill(a.gammes.confirmSuppr, { nom: gamme.name })}
                  >
                    {a.commun.supprimer}
                  </Envoyer>
                </FormAction>
              }
            >
              <FormAction action={enregistrerGamme}>
                <input type="hidden" name="id" value={gamme.id} />
                <ChampsGamme t={t} gamme={gamme} ordreParDefaut={gamme.sort_order} />
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
  ordreParDefaut,
}: {
  t: Awaited<ReturnType<typeof getT>>["t"];
  gamme?: Gamme;
  ordreParDefaut: number;
}) {
  const a = t.admin;
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Champ label={a.commun.nom} name="name" defaultValue={gamme?.name} required />
        <Champ
          label={a.commun.slug}
          name="slug"
          defaultValue={gamme?.slug}
          placeholder="rouge-sensuel"
          required
        />
        <Champ label={a.gammes.surtitre} name="tagline" defaultValue={gamme?.tagline} />
        <Champ
          label={a.gammes.nomCouleur}
          name="color_name"
          defaultValue={gamme?.color_name}
        />
        <Champ
          label={a.commun.couleur}
          name="color_hex"
          type="color"
          defaultValue={gamme?.color_hex ?? "#c4102b"}
        />
        <Champ
          label={a.commun.ordre}
          name="sort_order"
          type="number"
          defaultValue={ordreParDefaut}
        />
        <Champ
          label={a.gammes.couverture}
          name="cover_image"
          defaultValue={gamme?.cover_image}
          className="lg:col-span-2"
        />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <Zone
          label={a.commun.description}
          name="description"
          defaultValue={gamme?.description}
          rows={2}
        />
        <Bascule
          label={a.commun.visible}
          name="active"
          defaultChecked={gamme?.active ?? true}
        />
      </div>

      {/* Les traductions sont repliées : on les remplit une fois, rarement. */}
      <details className="mt-4 rounded border border-dashed border-trait p-3">
        <summary className="eyebrow cursor-pointer text-graphite-doux">
          {a.commun.traductions}
        </summary>
        <p className="mt-2 text-[12.5px] text-graphite-doux">
          {a.commun.videFrRepris}
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Champ
            label={`${a.gammes.surtitre} — ${a.commun.arabe}`}
            name="tagline_ar"
            defaultValue={gamme?.tagline_ar}
          />
          <Champ
            label={`${a.gammes.surtitre} — ${a.commun.anglais}`}
            name="tagline_en"
            defaultValue={gamme?.tagline_en}
          />
          <Zone
            label={`${a.commun.description} — ${a.commun.arabe}`}
            name="description_ar"
            defaultValue={gamme?.description_ar}
            rows={2}
          />
          <Zone
            label={`${a.commun.description} — ${a.commun.anglais}`}
            name="description_en"
            defaultValue={gamme?.description_en}
            rows={2}
          />
        </div>
      </details>
    </>
  );
}
