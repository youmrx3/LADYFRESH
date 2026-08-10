import {
  Bascule,
  Champ,
  Envoyer,
  FormAction,
} from "@/components/admin/Champs";
import { OngletsLangue } from "@/components/admin/OngletsLangue";
import { EnTetePage, Ligne, Volet } from "@/components/admin/Volet";
import { enregistrerType, supprimerType } from "@/lib/actions";
import { getProductTypes, getProductsAdmin } from "@/lib/data";
import { fill } from "@/i18n";
import { champ } from "@/i18n/contenu";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/i18n/config";
import { getT } from "@/i18n/server";
import type { ProductType } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Types({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const { t } = await getT();
  const { edit } = await searchParams;
  const langue: Locale = isLocale(edit) ? edit : DEFAULT_LOCALE;

  const [types, products] = await Promise.all([
    getProductTypes(),
    getProductsAdmin(),
  ]);
  const a = t.admin;
  const compte = (id: string) => products.filter((p) => p.type_id === id).length;

  return (
    <div>
      <EnTetePage
        eyebrow={a.gammes.catalogue}
        titre={a.types.titre}
        aide={a.types.aide}
      />

      <div className="mb-5">
        <OngletsLangue
          actif={langue}
          base="/admin/types"
          label={a.commun.langueEditee}
        />
      </div>

      {langue === "fr" && (
        <Volet label={a.types.nouveau} labelOuvert={a.commun.annuler} ton="principal">
          <div
            className="rounded-[10px] border border-trait p-4"
            style={{ background: "var(--comptoir-surface)" }}
          >
            <FormAction action={enregistrerType}>
              <input type="hidden" name="edit_lang" value="fr" />
              <ChampsType t={t} langue="fr" ordreParDefaut={types.length + 1} />
              <div className="mt-4">
                <Envoyer variante="or">{a.commun.creer}</Envoyer>
              </div>
            </FormAction>
          </div>
        </Volet>
      )}

      <ul className="mt-6 space-y-2.5">
        {types.map((type) => {
          const n = compte(type.id);
          return (
            <Ligne
              key={type.id}
              labelModifier={a.commun.modifier}
              labelFermer={a.commun.fermer}
              titre={champ(type, "name", langue) || type.slug}
              meta={`${
                n === 0
                  ? a.types.inutilise
                  : fill(n > 1 ? a.types.utilisePluriel : a.types.utilise, { n })
              }${type.active ? "" : ` · ${a.commun.masque}`}`}
              actions={
                langue === "fr" ? (
                  <FormAction action={supprimerType}>
                    <input type="hidden" name="id" value={type.id} />
                    <Envoyer
                      variante="danger"
                      confirmer={fill(a.types.confirmSuppr, { nom: type.name })}
                    >
                      {a.commun.supprimer}
                    </Envoyer>
                  </FormAction>
                ) : undefined
              }
            >
              <FormAction action={enregistrerType}>
                <input type="hidden" name="id" value={type.id} />
                <input type="hidden" name="edit_lang" value={langue} />
                <ChampsType
                  t={t}
                  type={type}
                  langue={langue}
                  ordreParDefaut={type.sort_order}
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

function ChampsType({
  t,
  type,
  langue,
  ordreParDefaut,
}: {
  t: Awaited<ReturnType<typeof getT>>["t"];
  type?: ProductType;
  langue: Locale;
  ordreParDefaut: number;
}) {
  const a = t.admin;
  const dir = langue === "ar" ? "rtl" : "ltr";

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <Champ
          label={a.types.nom}
          name="name"
          dir={dir}
          defaultValue={type ? champ(type, "name", langue) : ""}
          required={langue === "fr"}
        />
        <Champ
          label={a.types.nomCourt}
          name="short_name"
          dir={dir}
          defaultValue={type ? champ(type, "short_name", langue) : ""}
        />
      </div>

      {/* Le slug, l'ordre et la visibilité ne dépendent pas de la langue. */}
      {langue === "fr" && (
        <div className="mt-3 grid items-end gap-3 sm:grid-cols-3">
          <Champ
            label={a.commun.slug}
            name="slug"
            defaultValue={type?.slug}
            placeholder="brume"
            required
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
            defaultChecked={type?.active ?? true}
          />
        </div>
      )}

      {langue !== "fr" && (
        <p className="mt-2 text-[12.5px] text-graphite-doux">
          {a.commun.videFrRepris}
        </p>
      )}
    </>
  );
}
