import Image from "next/image";
import Link from "next/link";
import {
  Bascule,
  Champ,
  ChampCouleur,
  Envoyer,
  FormAction,
  Liste,
} from "@/components/admin/Champs";
import { ChampImage } from "@/components/admin/ChampImage";
import { EnTetePage, Ligne, Volet } from "@/components/admin/Volet";
import { enregistrerProduit, supprimerProduit } from "@/lib/actions";
import { getGammes, getProductTypes, getProducts, getSettings } from "@/lib/data";
import { da } from "@/lib/format";
import { fill } from "@/i18n";
import { champ, nomTypeCourt } from "@/i18n/contenu";
import { getT } from "@/i18n/server";
import type { Gamme, Product, ProductType } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Produits() {
  const { t, locale } = await getT();
  const [gammes, types, products, settings] = await Promise.all([
    getGammes(),
    getProductTypes(),
    getProducts(),
    getSettings(),
  ]);
  const a = t.admin;

  const optionsGammes = gammes.map((g) => ({ value: g.id, label: g.name }));
  const optionsTypes = types.map((type) => ({
    value: type.id,
    label: champ(type, "name", locale) || type.slug,
  }));

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
        titre={a.produits.titre}
        aide={`${a.produits.aide} ${fill(a.produits.seuils, {
          gros: settings.min_gros_cartons,
          demi: settings.min_demi_gros_pieces,
        })}`}
      />

      {types.length === 0 ? (
        <p className="rounded border border-dashed border-trait px-5 py-8 text-[14px] text-graphite-doux">
          {a.types.aide}{" "}
          <Link href="/admin/types" className="underline underline-offset-2">
            {a.types.nouveau}
          </Link>
        </p>
      ) : (
        <Volet
          label={a.produits.nouveau}
          labelOuvert={a.commun.annuler}
          ton="principal"
        >
          <div
            className="rounded-[10px] border border-trait p-4"
            style={{ background: "var(--comptoir-surface)" }}
          >
            <p className="mb-3 text-[13px] text-graphite-doux">
              {a.produits.dabordProduit}
            </p>
            <FormAction action={enregistrerProduit}>
              <ChampsProduit
                t={t}
                optionsGammes={optionsGammes}
                optionsTypes={optionsTypes}
                labelsImage={labelsImage}
                ordreParDefaut={products.length + 1}
              />
              <div className="mt-4">
                <Envoyer variante="or">{a.commun.creer}</Envoyer>
              </div>
            </FormAction>
          </div>
        </Volet>
      )}

      <ul className="mt-6 space-y-2.5">
        {products.map((product) => (
          <Ligne
            key={product.id}
            labelModifier={a.commun.modifier}
            labelFermer={a.commun.fermer}
            visuel={
              <span
                className="relative block h-12 w-12 shrink-0 overflow-hidden rounded"
                style={{
                  background: `color-mix(in srgb, ${product.color_hex} 10%, var(--comptoir-surface))`,
                }}
              >
                {product.image && (
                  <Image
                    src={product.image}
                    alt=""
                    fill
                    sizes="48px"
                    className="object-contain p-1"
                  />
                )}
              </span>
            }
            titre={nomLigne(product, types, gammes, locale)}
            meta={metaLigne(product, t.unites.devise, a.formats.aucunFormat, product.active ? "" : a.commun.masque)}
            actions={
              <>
                <FormAction action={supprimerProduit}>
                  <input type="hidden" name="id" value={product.id} />
                  <Envoyer
                    variante="danger"
                    confirmer={fill(a.produits.confirmSuppr, {
                      nom: nomLigne(product, types, gammes, locale),
                    })}
                  >
                    {a.commun.supprimer}
                  </Envoyer>
                </FormAction>
                <Link
                  href="/admin/formats"
                  className="eyebrow text-graphite-doux underline underline-offset-4 hover:text-graphite"
                >
                  {a.formats.titre} →
                </Link>
              </>
            }
          >
            <FormAction action={enregistrerProduit}>
              <input type="hidden" name="id" value={product.id} />
              <ChampsProduit
                t={t}
                product={product}
                optionsGammes={optionsGammes}
                optionsTypes={optionsTypes}
                labelsImage={labelsImage}
                ordreParDefaut={product.sort_order}
              />
              <div className="mt-4">
                <Envoyer>{a.commun.enregistrer}</Envoyer>
              </div>
            </FormAction>
          </Ligne>
        ))}
      </ul>
    </div>
  );
}

function nomLigne(
  product: Product,
  types: ProductType[],
  gammes: Gamme[],
  locale: Parameters<typeof champ>[2],
) {
  const type = types.find((x) => x.id === product.type_id);
  const gamme = gammes.find((g) => g.id === product.gamme_id);
  return `${champ(type, "name", locale) || product.slug} ${gamme?.name ?? ""}`.trim();
}

function metaLigne(
  product: Product,
  devise: string,
  aucun: string,
  masque: string,
) {
  const formats = product.variants.length
    ? product.variants
        .map((v) => `${v.size_label} · ${da(v.price_demi_gros, devise)}`)
        .join("  |  ")
    : aucun;
  return masque ? `${formats} · ${masque}` : formats;
}

function ChampsProduit({
  t,
  product,
  optionsGammes,
  optionsTypes,
  labelsImage,
  ordreParDefaut,
}: {
  t: Awaited<ReturnType<typeof getT>>["t"];
  product?: Product;
  optionsGammes: { value: string; label: string }[];
  optionsTypes: { value: string; label: string }[];
  labelsImage: React.ComponentProps<typeof ChampImage>["labels"];
  ordreParDefaut: number;
}) {
  const a = t.admin;
  return (
    <>
      <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Liste
          label={a.produits.type}
          name="type_id"
          options={optionsTypes}
          defaultValue={product?.type_id}
          placeholder={a.produits.type}
          required
        />
        <Liste
          label={a.produits.gamme}
          name="gamme_id"
          options={optionsGammes}
          defaultValue={product?.gamme_id}
          placeholder={a.produits.gamme}
          required
        />
        <Champ
          label={a.commun.slug}
          name="slug"
          defaultValue={product?.slug}
          placeholder="rouge-sensuel-brume"
          required
        />
        <Champ label={a.commun.nom} name="name" defaultValue={product?.name} />
        <Champ
          label={a.produits.couleurFiltre}
          name="color_name"
          defaultValue={product?.color_name}
        />
        <ChampCouleur
          label={a.produits.teinte}
          name="color_hex"
          defaultValue={product?.color_hex}
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
          defaultChecked={product?.active ?? true}
        />
      </div>

      <div className="mt-3">
        <ChampImage
          label={a.produits.imageDefaut}
          name="image"
          defaultValue={product?.image}
          labels={labelsImage}
          ratio="4 / 5"
        />
      </div>
    </>
  );
}
