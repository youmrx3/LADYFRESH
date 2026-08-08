import Image from "next/image";
import {
  Bascule,
  Champ,
  Envoyer,
  FormAction,
  Liste,
} from "@/components/admin/Champs";
import {
  enregistrerProduit,
  enregistrerVariante,
  supprimerProduit,
  supprimerVariante,
} from "@/lib/actions";
import { getGammes, getProducts, getSettings } from "@/lib/data";
import { da } from "@/lib/format";
import { PRODUCT_TYPES } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Produits() {
  const [gammes, products, settings] = await Promise.all([
    getGammes(),
    getProducts(),
    getSettings(),
  ]);

  const optionsGammes = gammes.map((g) => ({ value: g.id, label: g.name }));
  const optionsTypes = PRODUCT_TYPES.map((t) => ({
    value: t.value,
    label: t.label,
  }));

  return (
    <div>
      <header>
        <p className="eyebrow text-graphite-doux">Catalogue</p>
        <h1 className="display display-l mt-2">Produits &amp; prix</h1>
      </header>

      <p className="mt-4 max-w-[64ch] text-[14px] leading-relaxed text-graphite-doux">
        Un produit porte un ou plusieurs formats. Le prix, la photo et le
        nombre de pièces par carton se règlent par format — c&apos;est ce que la
        boutique affiche. Seuils actuels : gros dès{" "}
        <strong>{settings.min_gros_cartons} carton</strong>, demi-gros dès{" "}
        <strong>{settings.min_demi_gros_pieces} pièces</strong> (modifiables
        dans « Contenu du site »).
      </p>

      <ul className="mt-8 space-y-5">
        {products.map((product) => {
          const gamme = gammes.find((g) => g.id === product.gamme_id);
          return (
            <li
              key={product.id}
              className="overflow-hidden rounded-[10px] border border-trait bg-porcelaine-haut"
            >
              <div className="flex items-center gap-4 border-b border-trait px-5 py-3">
                <div
                  className="relative h-12 w-12 shrink-0 overflow-hidden rounded"
                  style={{
                    background: `color-mix(in srgb, ${product.color_hex} 10%, #fff)`,
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
                </div>
                <div className="min-w-0 flex-1">
                  <p className="display text-[1.05rem]">{product.name}</p>
                  <p className="data text-[12px] text-graphite-doux">
                    {gamme?.name} · {product.variants.length} format
                    {product.variants.length > 1 ? "s" : ""}
                    {!product.active && " · masqué"}
                  </p>
                </div>
                <FormAction action={supprimerProduit}>
                  <input type="hidden" name="id" value={product.id} />
                  <Envoyer
                    variante="danger"
                    confirmer={`Supprimer « ${product.name} » et ses formats ?`}
                  >
                    Supprimer
                  </Envoyer>
                </FormAction>
              </div>

              <FormAction
                action={enregistrerProduit}
                className="border-b border-trait px-5 py-4"
              >
                <input type="hidden" name="id" value={product.id} />
                <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  <Champ label="Nom" name="name" defaultValue={product.name} required />
                  <Champ label="Slug" name="slug" defaultValue={product.slug} required />
                  <Liste
                    label="Type"
                    name="type"
                    options={optionsTypes}
                    defaultValue={product.type}
                  />
                  <Liste
                    label="Gamme"
                    name="gamme_id"
                    options={optionsGammes}
                    defaultValue={product.gamme_id}
                  />
                  <Champ
                    label="Couleur (filtre)"
                    name="color_name"
                    defaultValue={product.color_name}
                  />
                  <Champ
                    label="Teinte"
                    name="color_hex"
                    type="color"
                    defaultValue={product.color_hex}
                  />
                  <Champ
                    label="Image par défaut"
                    name="image"
                    defaultValue={product.image}
                    className="lg:col-span-2"
                  />
                  <Champ
                    label="Ordre"
                    name="sort_order"
                    type="number"
                    defaultValue={product.sort_order}
                  />
                  <div className="flex items-end gap-3">
                    <Bascule
                      label="Visible"
                      name="active"
                      defaultChecked={product.active}
                    />
                    <div className="pb-0.5">
                      <Envoyer />
                    </div>
                  </div>
                </div>
              </FormAction>

              {/* --------------------------------------------- formats */}
              <div className="px-5 py-4">
                <p className="eyebrow text-graphite-doux">Formats et prix</p>

                <ul className="mt-3 space-y-3">
                  {product.variants.map((variant) => (
                    <li key={variant.id}>
                      <FormAction
                        action={enregistrerVariante}
                        className="grid items-end gap-3 rounded border border-trait p-3 sm:grid-cols-3 lg:grid-cols-7"
                      >
                        <input type="hidden" name="id" value={variant.id} />
                        <input
                          type="hidden"
                          name="product_id"
                          value={product.id}
                        />
                        <Champ
                          label="Format"
                          name="size_label"
                          defaultValue={variant.size_label}
                          required
                        />
                        <Champ
                          label="Demi-gros (DA)"
                          name="price_demi_gros"
                          type="number"
                          step="1"
                          min={0}
                          defaultValue={variant.price_demi_gros}
                        />
                        <Champ
                          label="Gros (DA)"
                          name="price_gros"
                          type="number"
                          step="1"
                          min={0}
                          defaultValue={variant.price_gros}
                        />
                        <Champ
                          label="Pièces / carton"
                          name="units_per_carton"
                          type="number"
                          min={1}
                          defaultValue={variant.units_per_carton}
                        />
                        <Champ
                          label="Photo"
                          name="image"
                          defaultValue={variant.image}
                          className="lg:col-span-2"
                        />
                        <div className="flex items-end gap-3">
                          <Bascule
                            label="Actif"
                            name="active"
                            defaultChecked={variant.active}
                          />
                          <div className="pb-0.5">
                            <Envoyer />
                          </div>
                        </div>
                        <p className="data text-[11.5px] text-graphite-doux lg:col-span-7">
                          Carton de {variant.units_per_carton} ={" "}
                          {da(variant.price_gros * variant.units_per_carton)} en
                          gros
                        </p>
                      </FormAction>

                      <FormAction action={supprimerVariante} className="mt-1">
                        <input type="hidden" name="id" value={variant.id} />
                        <Envoyer
                          variante="danger"
                          confirmer={`Supprimer le format ${variant.size_label} ?`}
                        >
                          Supprimer ce format
                        </Envoyer>
                      </FormAction>
                    </li>
                  ))}
                </ul>

                <details className="mt-4">
                  <summary className="eyebrow cursor-pointer text-graphite-doux">
                    + Ajouter un format
                  </summary>
                  <FormAction
                    action={enregistrerVariante}
                    className="mt-3 grid items-end gap-3 rounded border border-dashed border-trait p-3 sm:grid-cols-3 lg:grid-cols-7"
                  >
                    <input type="hidden" name="product_id" value={product.id} />
                    <Champ label="Format" name="size_label" placeholder="150 ml" required />
                    <Champ label="Demi-gros (DA)" name="price_demi_gros" type="number" min={0} />
                    <Champ label="Gros (DA)" name="price_gros" type="number" min={0} />
                    <Champ
                      label="Pièces / carton"
                      name="units_per_carton"
                      type="number"
                      min={1}
                      defaultValue={12}
                    />
                    <Champ label="Photo" name="image" className="lg:col-span-2" />
                    <div className="flex items-end gap-3">
                      <Bascule label="Actif" name="active" defaultChecked />
                      <div className="pb-0.5">
                        <Envoyer variante="or">Ajouter</Envoyer>
                      </div>
                    </div>
                  </FormAction>
                </details>
              </div>
            </li>
          );
        })}
      </ul>

      <section className="mt-10 rounded-[10px] border border-dashed border-trait bg-porcelaine-haut p-5">
        <h2 className="display display-m">Ajouter un produit</h2>
        <p className="mt-1 text-[13.5px] text-graphite-doux">
          Créez d&apos;abord le produit, puis ajoutez-lui ses formats.
        </p>
        <FormAction action={enregistrerProduit} className="mt-4">
          <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Champ label="Nom" name="name" required />
            <Champ label="Slug" name="slug" placeholder="rouge-sensuel-brume" required />
            <Liste label="Type" name="type" options={optionsTypes} />
            <Liste label="Gamme" name="gamme_id" options={optionsGammes} />
            <Champ label="Couleur (filtre)" name="color_name" />
            <Champ label="Teinte" name="color_hex" type="color" defaultValue="#c4102b" />
            <Champ label="Image par défaut" name="image" className="lg:col-span-2" />
            <Champ
              label="Ordre"
              name="sort_order"
              type="number"
              defaultValue={products.length + 1}
            />
            <div className="flex items-end gap-3">
              <Bascule label="Visible" name="active" defaultChecked />
              <div className="pb-0.5">
                <Envoyer variante="or">Créer</Envoyer>
              </div>
            </div>
          </div>
        </FormAction>
      </section>
    </div>
  );
}
