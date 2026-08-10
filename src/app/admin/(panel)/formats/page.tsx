import Image from "next/image";
import {
  Bascule,
  Champ,
  Envoyer,
  FormAction,
  Liste,
} from "@/components/admin/Champs";
import { ChampImage } from "@/components/admin/ChampImage";
import { EnTetePage, Volet } from "@/components/admin/Volet";
import { enregistrerVariante, supprimerVariante } from "@/lib/actions";
import { getGammesAdmin, getProductTypes, getProductsAdmin } from "@/lib/data";
import { da } from "@/lib/format";
import { fill } from "@/i18n";
import { champ } from "@/i18n/contenu";
import { getT } from "@/i18n/server";
import type { Variant } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Les formats vivent sur leur propre page. Sur la fiche produit, ils
 * gonflaient chaque ligne ; ici on choisit d'abord le produit auquel on veut
 * donner un format et un prix, ce qui est le geste réel.
 */
export default async function Formats() {
  const { t, locale } = await getT();
  const [gammes, types, products] = await Promise.all([
    getGammesAdmin(),
    getProductTypes(),
    getProductsAdmin(),
  ]);
  const a = t.admin;
  const devise = t.unites.devise;

  const nom = (produitId: string) => {
    const p = products.find((x) => x.id === produitId)!;
    const type = types.find((x) => x.id === p.type_id);
    const gamme = gammes.find((g) => g.id === p.gamme_id);
    return `${champ(type, "name", locale) || p.slug} ${gamme?.name ?? ""}`.trim();
  };

  const optionsProduits = products
    .map((p) => ({ value: p.id, label: nom(p.id) }))
    .sort((x, y) => x.label.localeCompare(y.label));

  const total = products.reduce((n, p) => n + p.variants.length, 0);

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
        titre={a.formats.titre}
        aide={a.formats.aide}
        action={
          <p className="data text-[13px] text-graphite-doux">
            {fill(total > 1 ? a.formats.totalPluriel : a.formats.total, {
              n: total,
              p: products.length,
            })}
          </p>
        }
      />

      <Volet label={a.formats.nouveau} labelOuvert={a.commun.annuler} ton="principal">
        <FormAction
          action={enregistrerVariante}
          className="rounded-[10px] border border-trait p-4"
        >
          <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Liste
              label={a.formats.produit}
              name="product_id"
              options={optionsProduits}
              placeholder={a.formats.choisirProduit}
              required
              className="lg:col-span-2"
            />
            <Champ
              label={a.produits.format}
              name="size_label"
              placeholder="150 ml"
              required
            />
            <Champ
              label={fill(a.produits.prixDemi, { devise })}
              name="price_demi_gros"
              type="number"
              min={0}
            />
            <Champ
              label={fill(a.produits.prixGros, { devise })}
              name="price_gros"
              type="number"
              min={0}
            />
            <Champ
              label={a.produits.parCarton}
              name="units_per_carton"
              type="number"
              min={1}
              defaultValue={12}
            />
            <Bascule label={a.commun.actif} name="active" defaultChecked />
          </div>
          <div className="mt-3">
            <ChampImage
              label={a.produits.photo}
              name="image"
              labels={labelsImage}
              ratio="4 / 5"
            />
          </div>
          <div className="mt-4">
            <Envoyer variante="or">{a.commun.ajouter}</Envoyer>
          </div>
        </FormAction>
      </Volet>

      <ul className="mt-6 space-y-3">
        {products.map((product) => (
          <li
            key={product.id}
            className="overflow-hidden rounded-[10px] border border-trait"
            style={{ background: "var(--comptoir-surface)" }}
          >
            <div className="flex items-center gap-3 border-b border-trait p-3 sm:p-4">
              <span
                className="relative block h-11 w-11 shrink-0 overflow-hidden rounded"
                style={{
                  background: `color-mix(in srgb, ${product.color_hex} 10%, var(--comptoir-surface))`,
                }}
              >
                {product.image && (
                  <Image
                    src={product.image}
                    alt=""
                    fill
                    sizes="44px"
                    className="object-contain p-1"
                  />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="display truncate text-[1rem] leading-tight">
                  {nom(product.id)}
                </p>
                <p className="data mt-0.5 text-[11.5px] text-graphite-doux">
                  {product.variants.length
                    ? fill(
                        product.variants.length > 1
                          ? a.produits.nbFormatsPluriel
                          : a.produits.nbFormats,
                        { n: product.variants.length },
                      )
                    : a.formats.aucunFormat}
                </p>
              </div>
            </div>

            {product.variants.length > 0 && (
              <ul className="divide-y divide-trait">
                {product.variants.map((variant) => (
                  <li key={variant.id}>
                    <details className="group">
                      <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3">
                        <span className="data text-[14px]">
                          {variant.size_label}
                        </span>
                        <span className="data text-[13px] text-graphite-doux">
                          {a.formats.demiCourt} {da(variant.price_demi_gros, devise)}
                        </span>
                        <span className="data text-[13px] text-graphite-doux">
                          {a.formats.grosCourt} {da(variant.price_gros, devise)}
                        </span>
                        <span className="data ms-auto text-[12px] text-graphite-doux">
                          {fill(a.produits.cartonEgale, {
                            n: variant.units_per_carton,
                            prix: da(
                              variant.price_gros * variant.units_per_carton,
                              devise,
                            ),
                          })}
                        </span>
                        <span className="eyebrow shrink-0 text-[10px] text-graphite-doux">
                          <span className="group-open:hidden">
                            {a.commun.modifier}
                          </span>
                          <span className="hidden group-open:inline">
                            {a.commun.fermer}
                          </span>
                        </span>
                      </summary>

                      <div className="border-t border-trait bg-comptoir p-4">
                        <FormAction action={enregistrerVariante}>
                          <input type="hidden" name="id" value={variant.id} />
                          <input
                            type="hidden"
                            name="product_id"
                            value={product.id}
                          />
                          <ChampsVariante
                            t={t}
                            variant={variant}
                            devise={devise}
                            labelsImage={labelsImage}
                          />
                          <div className="mt-4 flex flex-wrap items-center gap-2">
                            <Envoyer>{a.commun.enregistrer}</Envoyer>
                          </div>
                        </FormAction>

                        <FormAction action={supprimerVariante} className="mt-2">
                          <input type="hidden" name="id" value={variant.id} />
                          <Envoyer
                            variante="danger"
                            confirmer={fill(a.produits.confirmSupprFormat, {
                              format: variant.size_label,
                            })}
                          >
                            {a.produits.supprimerFormat}
                          </Envoyer>
                        </FormAction>
                      </div>
                    </details>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ChampsVariante({
  t,
  variant,
  devise,
  labelsImage,
}: {
  t: Awaited<ReturnType<typeof getT>>["t"];
  variant: Variant;
  devise: string;
  labelsImage: React.ComponentProps<typeof ChampImage>["labels"];
}) {
  const a = t.admin;
  return (
    <>
      <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Champ
          label={a.produits.format}
          name="size_label"
          defaultValue={variant.size_label}
          required
        />
        <Champ
          label={fill(a.produits.prixDemi, { devise })}
          name="price_demi_gros"
          type="number"
          min={0}
          defaultValue={variant.price_demi_gros}
        />
        <Champ
          label={fill(a.produits.prixGros, { devise })}
          name="price_gros"
          type="number"
          min={0}
          defaultValue={variant.price_gros}
        />
        <Champ
          label={a.produits.parCarton}
          name="units_per_carton"
          type="number"
          min={1}
          defaultValue={variant.units_per_carton}
        />
      </div>
      <div className="mt-3 grid items-end gap-3 sm:grid-cols-[1fr_auto]">
        <ChampImage
          label={a.produits.photo}
          name="image"
          defaultValue={variant.image}
          labels={labelsImage}
          ratio="4 / 5"
        />
        <Bascule
          label={a.commun.actif}
          name="active"
          defaultChecked={variant.active}
        />
      </div>
    </>
  );
}
