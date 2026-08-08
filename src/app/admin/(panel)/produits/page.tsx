import Image from "next/image";
import {
  Bascule,
  Champ,
  Envoyer,
  FormAction,
  Liste,
} from "@/components/admin/Champs";
import { EnTetePage, Ligne, Volet } from "@/components/admin/Volet";
import {
  enregistrerProduit,
  enregistrerVariante,
  supprimerProduit,
  supprimerVariante,
} from "@/lib/actions";
import { getGammes, getProducts, getSettings } from "@/lib/data";
import { da } from "@/lib/format";
import { fill } from "@/i18n";
import { getT } from "@/i18n/server";
import { PRODUCT_TYPES, type Product } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Produits() {
  const { t } = await getT();
  const [gammes, products, settings] = await Promise.all([
    getGammes(),
    getProducts(),
    getSettings(),
  ]);
  const a = t.admin;

  const optionsGammes = gammes.map((g) => ({ value: g.id, label: g.name }));
  const optionsTypes = PRODUCT_TYPES.map((type) => ({
    value: type.value,
    label: t.typesCourts[type.value],
  }));

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
              ordreParDefaut={products.length + 1}
            />
            <div className="mt-4">
              <Envoyer variante="or">{a.commun.creer}</Envoyer>
            </div>
          </FormAction>
        </div>
      </Volet>

      <ul className="mt-6 space-y-2.5">
        {products.map((product) => {
          const gamme = gammes.find((g) => g.id === product.gamme_id);
          return (
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
              titre={`${t.types[product.type]} ${gamme?.name ?? ""}`}
              meta={`${product.variants
                .map((v) => `${v.size_label} · ${da(v.price_demi_gros, t.unites.devise)}`)
                .join("  |  ")}${product.active ? "" : ` · ${a.commun.masque}`}`}
              actions={
                <FormAction action={supprimerProduit}>
                  <input type="hidden" name="id" value={product.id} />
                  <Envoyer
                    variante="danger"
                    confirmer={fill(a.produits.confirmSuppr, {
                      nom: `${t.types[product.type]} ${gamme?.name ?? ""}`,
                    })}
                  >
                    {a.commun.supprimer}
                  </Envoyer>
                </FormAction>
              }
            >
              <FormAction action={enregistrerProduit}>
                <input type="hidden" name="id" value={product.id} />
                <ChampsProduit
                  t={t}
                  product={product}
                  optionsGammes={optionsGammes}
                  optionsTypes={optionsTypes}
                  ordreParDefaut={product.sort_order}
                />
                <div className="mt-4">
                  <Envoyer>{a.commun.enregistrer}</Envoyer>
                </div>
              </FormAction>

              {/* ------------------------------------------- formats */}
              <div className="mt-6 border-t border-trait pt-4">
                <p className="eyebrow text-graphite-doux">
                  {a.produits.formats}
                </p>

                <ul className="mt-3 space-y-2">
                  {product.variants.map((variant) => (
                    <li
                      key={variant.id}
                      className="rounded border border-trait p-3"
                    >
                      <FormAction action={enregistrerVariante}>
                        <input type="hidden" name="id" value={variant.id} />
                        <input
                          type="hidden"
                          name="product_id"
                          value={product.id}
                        />
                        <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-6">
                          <Champ
                            label={a.produits.format}
                            name="size_label"
                            defaultValue={variant.size_label}
                            required
                          />
                          <Champ
                            label={fill(a.produits.prixDemi, {
                              devise: t.unites.devise,
                            })}
                            name="price_demi_gros"
                            type="number"
                            min={0}
                            defaultValue={variant.price_demi_gros}
                          />
                          <Champ
                            label={fill(a.produits.prixGros, {
                              devise: t.unites.devise,
                            })}
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
                          <Champ
                            label={a.produits.photo}
                            name="image"
                            defaultValue={variant.image}
                            className="lg:col-span-2"
                          />
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-3">
                          <Bascule
                            label={a.commun.actif}
                            name="active"
                            defaultChecked={variant.active}
                          />
                          <Envoyer>{a.commun.enregistrer}</Envoyer>
                          <span className="data text-[11.5px] text-graphite-doux">
                            {fill(a.produits.cartonEgale, {
                              n: variant.units_per_carton,
                              prix: da(
                                variant.price_gros * variant.units_per_carton,
                                t.unites.devise,
                              ),
                            })}
                          </span>
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
                    </li>
                  ))}
                </ul>

                <div className="mt-3">
                  <Volet
                    label={a.produits.ajouterFormat}
                    labelOuvert={a.commun.annuler}
                  >
                    <FormAction
                      action={enregistrerVariante}
                      className="rounded border border-dashed border-trait p-3"
                    >
                      <input
                        type="hidden"
                        name="product_id"
                        value={product.id}
                      />
                      <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-6">
                        <Champ
                          label={a.produits.format}
                          name="size_label"
                          placeholder="150 ml"
                          required
                        />
                        <Champ
                          label={fill(a.produits.prixDemi, {
                            devise: t.unites.devise,
                          })}
                          name="price_demi_gros"
                          type="number"
                          min={0}
                        />
                        <Champ
                          label={fill(a.produits.prixGros, {
                            devise: t.unites.devise,
                          })}
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
                        <Champ
                          label={a.produits.photo}
                          name="image"
                          className="lg:col-span-2"
                        />
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <Bascule
                          label={a.commun.actif}
                          name="active"
                          defaultChecked
                        />
                        <Envoyer variante="or">{a.commun.ajouter}</Envoyer>
                      </div>
                    </FormAction>
                  </Volet>
                </div>
              </div>
            </Ligne>
          );
        })}
      </ul>
    </div>
  );
}

function ChampsProduit({
  t,
  product,
  optionsGammes,
  optionsTypes,
  ordreParDefaut,
}: {
  t: Awaited<ReturnType<typeof getT>>["t"];
  product?: Product;
  optionsGammes: { value: string; label: string }[];
  optionsTypes: { value: string; label: string }[];
  ordreParDefaut: number;
}) {
  const a = t.admin;
  return (
    <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Champ label={a.commun.nom} name="name" defaultValue={product?.name} required />
      <Champ
        label={a.commun.slug}
        name="slug"
        defaultValue={product?.slug}
        placeholder="rouge-sensuel-brume"
        required
      />
      <Liste
        label={a.produits.type}
        name="type"
        options={optionsTypes}
        defaultValue={product?.type}
      />
      <Liste
        label={a.produits.gamme}
        name="gamme_id"
        options={optionsGammes}
        defaultValue={product?.gamme_id}
      />
      <Champ
        label={a.produits.couleurFiltre}
        name="color_name"
        defaultValue={product?.color_name}
      />
      <Champ
        label={a.produits.teinte}
        name="color_hex"
        type="color"
        defaultValue={product?.color_hex ?? "#c4102b"}
      />
      <Champ
        label={a.produits.imageDefaut}
        name="image"
        defaultValue={product?.image}
      />
      <div className="flex items-end gap-3">
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
    </div>
  );
}
