import Image from "next/image";
import {
  Bascule,
  Champ,
  Envoyer,
  FormAction,
  Zone,
} from "@/components/admin/Champs";
import { AmorcerBase } from "@/components/admin/AmorcerBase";
import { enregistrerGamme, supprimerGamme } from "@/lib/actions";
import { getGammes, getProducts } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function Gammes() {
  const [gammes, products] = await Promise.all([getGammes(), getProducts()]);

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-graphite-doux">Catalogue</p>
          <h1 className="display display-l mt-2">Gammes</h1>
        </div>
        <AmorcerBase />
      </header>

      <p className="mt-4 max-w-[60ch] text-[14px] leading-relaxed text-graphite-doux">
        Les gammes ordonnent la bande horizontale de la page d&apos;accueil. La
        couleur sert aussi de filtre dans la boutique — changez-la ici et le
        filtre suit.
      </p>

      <ul className="mt-8 space-y-4">
        {gammes.map((gamme) => {
          const nb = products.filter((p) => p.gamme_id === gamme.id).length;
          return (
            <li
              key={gamme.id}
              className="overflow-hidden rounded-[10px] border border-trait bg-porcelaine-haut"
            >
              <div className="flex items-center gap-4 border-b border-trait px-5 py-3">
                <span
                  className="h-8 w-8 shrink-0 rounded"
                  style={{ background: gamme.color_hex }}
                />
                {gamme.cover_image && (
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded">
                    <Image
                      src={gamme.cover_image}
                      alt=""
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="display text-[1.05rem]">{gamme.name}</p>
                  <p className="data text-[12px] text-graphite-doux">
                    {gamme.color_name} · {nb} produit{nb > 1 ? "s" : ""}
                    {!gamme.active && " · masquée"}
                  </p>
                </div>
                <FormAction action={supprimerGamme}>
                  <input type="hidden" name="id" value={gamme.id} />
                  <Envoyer
                    variante="danger"
                    confirmer={`Supprimer la gamme « ${gamme.name} » et tous ses produits ?`}
                  >
                    Supprimer
                  </Envoyer>
                </FormAction>
              </div>

              <FormAction action={enregistrerGamme} className="p-5">
                <input type="hidden" name="id" value={gamme.id} />
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Champ label="Nom" name="name" defaultValue={gamme.name} required />
                  <Champ label="Slug" name="slug" defaultValue={gamme.slug} required />
                  <Champ
                    label="Surtitre"
                    name="tagline"
                    defaultValue={gamme.tagline}
                  />
                  <Champ
                    label="Nom de la couleur (filtre)"
                    name="color_name"
                    defaultValue={gamme.color_name}
                  />
                  <Champ
                    label="Couleur"
                    name="color_hex"
                    type="color"
                    defaultValue={gamme.color_hex}
                  />
                  <Champ
                    label="Ordre"
                    name="sort_order"
                    type="number"
                    defaultValue={gamme.sort_order}
                  />
                  <Champ
                    label="Image de couverture (URL ou /chemin)"
                    name="cover_image"
                    defaultValue={gamme.cover_image}
                    className="lg:col-span-2"
                  />
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
                  <Zone
                    label="Description"
                    name="description"
                    defaultValue={gamme.description}
                    rows={2}
                  />
                  <Bascule label="Visible" name="active" defaultChecked={gamme.active} />
                  <div className="pt-1">
                    <Envoyer />
                  </div>
                </div>
              </FormAction>
            </li>
          );
        })}
      </ul>

      <section className="mt-10 rounded-[10px] border border-dashed border-trait bg-porcelaine-haut p-5">
        <h2 className="display display-m">Ajouter une gamme</h2>
        <FormAction action={enregistrerGamme} className="mt-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Champ label="Nom" name="name" required />
            <Champ label="Slug" name="slug" placeholder="rouge-sensuel" required />
            <Champ label="Surtitre" name="tagline" />
            <Champ label="Nom de la couleur (filtre)" name="color_name" />
            <Champ label="Couleur" name="color_hex" type="color" defaultValue="#c4102b" />
            <Champ label="Ordre" name="sort_order" type="number" defaultValue={gammes.length + 1} />
            <Champ
              label="Image de couverture"
              name="cover_image"
              className="lg:col-span-2"
            />
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
            <Zone label="Description" name="description" rows={2} />
            <Bascule label="Visible" name="active" defaultChecked />
            <div className="pt-1">
              <Envoyer variante="or">Créer la gamme</Envoyer>
            </div>
          </div>
        </FormAction>
      </section>
    </div>
  );
}
