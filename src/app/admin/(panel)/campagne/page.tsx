import Link from "next/link";
import {
  Bascule,
  Champ,
  Envoyer,
  FormAction,
  Liste,
  Zone,
} from "@/components/admin/Champs";
import { ChampImage } from "@/components/admin/ChampImage";
import { OngletsLangue } from "@/components/admin/OngletsLangue";
import { EnTetePage, PiedFormulaire } from "@/components/admin/Volet";
import { enregistrerCampagne } from "@/lib/actions";
import { getPacks, getSettingsAdmin } from "@/lib/data";
import { champ, traduction } from "@/i18n/contenu";
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

  const [settings, packs] = await Promise.all([getSettingsAdmin(), getPacks()]);
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
            className="adm-btn adm-btn-discret underline underline-offset-4"
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
        {/*
          Dire ce que fait l'onglet, une fois pour toutes.

          Ces champs traduisent le contenu de la page publique ; ils ne changent
          pas la langue de ce back-office — celle-là se règle dans « Contenu du
          site ». Et un champ laissé vide n'est pas un oubli : c'est le texte
          français qui sera repris, ce qui est presque toujours ce qu'on veut
          pour un nom de marque.
        */}
        {!fr && <p className="adm-aide mt-2 max-w-[70ch]">{a.aideTraduction}</p>}
      </div>

      {packs.length === 0 && (
        <p className="mb-5 rounded border border-dashed border-[color:var(--adm-line)] px-5 py-4 text-[length:var(--adm-t-md)] text-[color:var(--adm-muted)]">
          {a.sansCoffret}{" "}
          <Link href="/admin/packs" className="underline underline-offset-2">
            {t.admin.onglets.packs}
          </Link>
        </p>
      )}

      <FormAction action={enregistrerCampagne}>
        <input type="hidden" name="edit_lang" value={langue} />

        {/*
          La langue de la page publique, distincte de celle du site.

          Le site de marque et la publicité ne s'adressent pas au même monde :
          on peut vouloir la vitrine en français et faire tourner une campagne
          en arabe. Réglé depuis l'onglet français seulement — c'est un choix,
          pas une traduction.
        */}
        {fr && (
          <div className="adm-carte mb-4 p-4 sm:p-5">
            <Liste
              label={a.langue}
              name="locale_boutique"
              defaultValue={settings.locale_boutique}
              aide={a.langueAide}
              options={[
                { value: "", label: a.langueSuivre },
                { value: "fr", label: "Français" },
                { value: "ar", label: "العربية" },
                { value: "en", label: "English" },
              ]}
            />
          </div>
        )}

        <div className="adm-carte p-4 sm:p-5">
          {/* ------------------------------------------------- bandeau */}
          <p className="adm-etiquette">{a.sectionBandeau}</p>
          <p className="mb-3 text-[length:var(--adm-t-sm)] text-[color:var(--adm-muted)]">{a.bandeauAide}</p>

          <Champ
            label={a.bandeau}
            name="camp_bandeau"
            dir={dir}
            defaultValue={traduction(settings, "camp_bandeau", langue)}
              placeholder={fr ? undefined : champ(settings, "camp_bandeau", "fr")}
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
        <div className="adm-carte mt-4 p-4 sm:p-5">
          <p className="adm-etiquette">{a.sectionHero}</p>
          <p className="mb-3 text-[length:var(--adm-t-sm)] text-[color:var(--adm-muted)]">{a.heroAide}</p>

          <div className="grid gap-3 sm:grid-cols-2">
            <Champ
              label={a.surtitre}
              name="camp_eyebrow"
              dir={dir}
              defaultValue={traduction(settings, "camp_eyebrow", langue)}
              placeholder={fr ? undefined : champ(settings, "camp_eyebrow", "fr")}
            />
            <Champ
              label={a.bouton}
              name="camp_cta"
              dir={dir}
              defaultValue={traduction(settings, "camp_cta", langue)}
              placeholder={fr ? undefined : champ(settings, "camp_cta", "fr")}
            />
          </div>

          <div className="mt-3">
            <Zone
              label={a.titreHero}
              name="camp_titre"
              dir={dir}
              rows={2}
              defaultValue={traduction(settings, "camp_titre", langue)}
              placeholder={fr ? undefined : champ(settings, "camp_titre", "fr")}
            />
            <p className="mt-1 text-[length:var(--adm-t-sm)] text-[color:var(--adm-muted)]">{a.titreAide}</p>
          </div>

          <div className="mt-3">
            <Zone
              label={a.lede}
              name="camp_lede"
              dir={dir}
              rows={3}
              defaultValue={traduction(settings, "camp_lede", langue)}
              placeholder={fr ? undefined : champ(settings, "camp_lede", "fr")}
            />
          </div>

          <div className="mt-3">
            <Champ
              label={a.gages}
              name="camp_gages"
              dir={dir}
              defaultValue={traduction(settings, "camp_gages", langue)}
              placeholder={
                fr
                  ? "Livraison 58 wilayas|Paiement à la réception|On vous rappelle"
                  : champ(settings, "camp_gages", "fr")
              }
            />
            <p className="mt-1 text-[length:var(--adm-t-sm)] text-[color:var(--adm-muted)]">{a.gagesAide}</p>
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
              <p className="mt-1 text-[length:var(--adm-t-sm)] text-[color:var(--adm-muted)]">{a.photoAide}</p>
            </div>
          ) : (
            <p className="mt-3 text-[length:var(--adm-t-sm)] text-[color:var(--adm-muted)]">
              {t.admin.commun.videFrRepris}
            </p>
          )}
        </div>

        <PiedFormulaire><Envoyer variante="principal">{t.admin.commun.enregistrer}</Envoyer></PiedFormulaire>
      </FormAction>
    </div>
  );
}
