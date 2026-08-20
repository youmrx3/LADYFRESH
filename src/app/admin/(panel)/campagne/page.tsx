import Link from "next/link";
import {
  Bascule,
  Champ,
  Envoyer,
  FormAction,
  Zone,
} from "@/components/admin/Champs";
import { ChampImage } from "@/components/admin/ChampImage";
import { OngletsLangue } from "@/components/admin/OngletsLangue";
import { EnTetePage } from "@/components/admin/Volet";
import { enregistrerCampagne } from "@/lib/actions";
import { getPacks, getSettings } from "@/lib/data";
import { champ } from "@/i18n/contenu";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/i18n/config";
import { getT } from "@/i18n/server";

export const dynamic = "force-dynamic";

/**
 * La page de campagne, côté gestion.
 *
 * Tout ce qui se lit sur /boutique avant le rayon : le bandeau, l'ouverture,
 * le bouton, les garanties. Séparé des réglages du site parce que ça ne vit
 * pas au même rythme — un titre de campagne se change entre deux publicités,
 * une adresse de contact une fois par an.
 */
export default async function Campagne({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const { t } = await getT();
  const { edit } = await searchParams;
  const langue: Locale = isLocale(edit) ? edit : DEFAULT_LOCALE;

  const [settings, packs] = await Promise.all([getSettings(), getPacks()]);
  const a = t.admin.campagne;
  const fr = langue === "fr";
  const dir = langue === "ar" ? "rtl" : "ltr";

  const labelsImage = {
    choisirFichier: t.admin.commun.choisirFichier,
    televersement: t.admin.commun.televersement,
    retirer: t.admin.commun.retirerImage,
    aucune: t.admin.commun.aucuneImage,
    ouCollerUrl: t.admin.commun.ouCollerUrl,
  };

  return (
    <div>
      <EnTetePage
        eyebrow={a.eyebrow}
        titre={a.titre}
        aide={a.aide}
        action={
          <Link
            href="/boutique"
            target="_blank"
            rel="noreferrer"
            className="eyebrow text-graphite-doux underline underline-offset-4 hover:text-graphite"
          >
            {a.voir} →
          </Link>
        }
      />

      <div className="mb-5">
        <OngletsLangue
          actif={langue}
          base="/admin/campagne"
          label={t.admin.commun.langueEditee}
        />
      </div>

      {packs.length === 0 && (
        <p className="mb-5 rounded border border-dashed border-trait px-5 py-4 text-[13.5px] text-graphite-doux">
          {a.sansCoffret}{" "}
          <Link href="/admin/packs" className="underline underline-offset-2">
            {t.admin.onglets.packs}
          </Link>
        </p>
      )}

      <FormAction action={enregistrerCampagne}>
        <input type="hidden" name="edit_lang" value={langue} />

        <div
          className="rounded-[10px] border border-trait p-4"
          style={{ background: "var(--comptoir-surface)" }}
        >
          {/* ------------------------------------------------- bandeau */}
          <p className="eyebrow text-graphite-doux">{a.sectionBandeau}</p>
          <p className="mb-3 text-[12.5px] text-graphite-doux">{a.bandeauAide}</p>

          <Champ
            label={a.bandeau}
            name="camp_bandeau"
            dir={dir}
            defaultValue={champ(settings, "camp_bandeau", langue)}
          />
          {fr && (
            <div className="mt-3">
              <Bascule
                label={a.bandeauActif}
                name="camp_bandeau_actif"
                defaultChecked={settings.camp_bandeau_actif}
              />
            </div>
          )}
        </div>

        {/* -------------------------------------------------- ouverture */}
        <div
          className="mt-4 rounded-[10px] border border-trait p-4"
          style={{ background: "var(--comptoir-surface)" }}
        >
          <p className="eyebrow text-graphite-doux">{a.sectionHero}</p>
          <p className="mb-3 text-[12.5px] text-graphite-doux">{a.heroAide}</p>

          <div className="grid gap-3 sm:grid-cols-2">
            <Champ
              label={a.surtitre}
              name="camp_eyebrow"
              dir={dir}
              defaultValue={champ(settings, "camp_eyebrow", langue)}
            />
            <Champ
              label={a.bouton}
              name="camp_cta"
              dir={dir}
              defaultValue={champ(settings, "camp_cta", langue)}
            />
          </div>

          <div className="mt-3">
            <Zone
              label={a.titreHero}
              name="camp_titre"
              dir={dir}
              rows={2}
              defaultValue={champ(settings, "camp_titre", langue)}
            />
            <p className="mt-1 text-[12px] text-graphite-doux">{a.titreAide}</p>
          </div>

          <div className="mt-3">
            <Zone
              label={a.lede}
              name="camp_lede"
              dir={dir}
              rows={3}
              defaultValue={champ(settings, "camp_lede", langue)}
            />
          </div>

          <div className="mt-3">
            <Champ
              label={a.gages}
              name="camp_gages"
              dir={dir}
              defaultValue={champ(settings, "camp_gages", langue)}
              placeholder="Livraison 58 wilayas|Paiement à la réception|On vous rappelle"
            />
            <p className="mt-1 text-[12px] text-graphite-doux">{a.gagesAide}</p>
          </div>

          {fr ? (
            <div className="mt-4">
              <ChampImage
                label={a.photo}
                name="camp_image"
                defaultValue={settings.camp_image}
                labels={labelsImage}
                ratio="4 / 5"
              />
              <p className="mt-1 text-[12px] text-graphite-doux">{a.photoAide}</p>
            </div>
          ) : (
            <p className="mt-3 text-[12.5px] text-graphite-doux">
              {t.admin.commun.videFrRepris}
            </p>
          )}
        </div>

        <div className="mt-4">
          <Envoyer variante="or">{t.admin.commun.enregistrer}</Envoyer>
        </div>
      </FormAction>
    </div>
  );
}
