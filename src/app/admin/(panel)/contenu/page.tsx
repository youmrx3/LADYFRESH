import {
  Champ,
  Envoyer,
  FormAction,
  Liste,
  Zone,
} from "@/components/admin/Champs";
import { ChampImage } from "@/components/admin/ChampImage";
import { OngletsLangue } from "@/components/admin/OngletsLangue";
import { EnTetePage, Ligne, Volet } from "@/components/admin/Volet";
import {
  changerLangueSite,
  enregistrerReglages,
  enregistrerSlide,
  enregistrerVideo,
  supprimerSlide,
  supprimerVideo,
} from "@/lib/actions";
import {
  getGammesAdmin,
  getHeroSlides,
  getSettings,
  getVideos,
} from "@/lib/data";
import { fill } from "@/i18n";
import { champ } from "@/i18n/contenu";
import { DEFAULT_LOCALE, isLocale, LOCALES, LOCALE_LABEL, type Locale } from "@/i18n/config";
import { getT } from "@/i18n/server";

export const dynamic = "force-dynamic";

export default async function Contenu({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const { t } = await getT();
  const { edit } = await searchParams;
  const langue: Locale = isLocale(edit) ? edit : DEFAULT_LOCALE;
  const fr = langue === "fr";
  const dir = langue === "ar" ? "rtl" : "ltr";

  const [settings, slides, videos, gammes] = await Promise.all([
    getSettings(),
    getHeroSlides(),
    getVideos(),
    getGammesAdmin(),
  ]);
  const a = t.admin;
  const optionsGammes = gammes.map((g) => ({ value: g.id, label: g.name }));

  const labelsImage = {
    choisirFichier: a.commun.choisirFichier,
    televersement: a.commun.televersement,
    retirer: a.commun.retirerImage,
    aucune: a.commun.aucuneImage,
    ouCollerUrl: a.commun.ouCollerUrl,
  };

  return (
    <div className="max-w-[68rem]">
      <EnTetePage eyebrow={a.contenu.reglages} titre={a.contenu.titre} />

      <div className="mb-6">
        <OngletsLangue
          actif={langue}
          base="/admin/contenu"
          label={a.commun.langueEditee}
        />
        {!fr && (
          <p className="mt-2 text-[12.5px] text-graphite-doux">
            {a.commun.videFrRepris}
          </p>
        )}
      </div>

      <div className="space-y-10">
        {/* ------------------------------------------------ langue du site */}
        <section>
          <h2 className="display display-m">{a.contenu.langueSite}</h2>
          <p className="mt-1 max-w-[60ch] text-[13.5px] text-graphite-doux">
            {a.contenu.langueSiteAide}
          </p>
          <FormAction
            action={changerLangueSite}
            className="mt-3 flex flex-wrap items-end gap-3 rounded-[10px] border border-trait p-4"
          >
            <Liste
              label={a.contenu.langueSite}
              name="locale"
              options={LOCALES.map((code) => ({
                value: code,
                label: LOCALE_LABEL[code],
              }))}
              defaultValue={settings.locale}
              className="min-w-[12rem]"
            />
            <Envoyer variante="or">{a.contenu.appliquer}</Envoyer>
          </FormAction>
        </section>

        {/* ------------------------------------------- commande et contact */}
        <section>
          <h2 className="display display-m">{a.contenu.commandeContact}</h2>
          <FormAction
            action={enregistrerReglages}
            className="mt-3 rounded-[10px] border border-trait p-4 sm:p-5"
          >
            <input type="hidden" name="edit_lang" value={langue} />

            {fr && (
              <>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Champ
                    label={a.contenu.numeroWhatsapp}
                    name="whatsapp_number"
                    dir="ltr"
                    defaultValue={settings.whatsapp_number}
                    placeholder="213555123456"
                    required
                  />
                  {/*
                    Le réglage qui décide de ce que la vitrine met en avant.
                    Un seul choix, ici, plutôt qu'une question posée à chaque
                    visiteuse avant qu'elle ne voie un prix.
                  */}
                  <Liste
                    label={a.contenu.modeBoutique}
                    name="mode_boutique"
                    options={[
                      { value: "packs", label: a.contenu.modePacks },
                      { value: "produits", label: a.contenu.modeProduits },
                    ]}
                    defaultValue={settings.mode_boutique}
                  />
                  <Champ
                    label={a.contenu.minProduit}
                    name="min_produit"
                    type="number"
                    min={1}
                    defaultValue={settings.min_produit}
                  />
                  <Champ
                    label={a.contenu.telephoneAffiche}
                    name="contact_phone"
                    dir="ltr"
                    defaultValue={settings.contact_phone}
                  />
                  <Champ
                    label={a.contenu.email}
                    name="contact_email"
                    type="email"
                    dir="ltr"
                    defaultValue={settings.contact_email}
                  />
                  <Champ
                    label={a.contenu.adresse}
                    name="contact_address"
                    defaultValue={settings.contact_address}
                  />
                  <Champ label="Instagram" name="instagram_url" dir="ltr" defaultValue={settings.instagram_url} />
                  <Champ label="Facebook" name="facebook_url" dir="ltr" defaultValue={settings.facebook_url} />
                  <Champ label="TikTok" name="tiktok_url" dir="ltr" defaultValue={settings.tiktok_url} />
                </div>
                <p className="eyebrow mt-6 text-graphite-doux">
                  {a.contenu.textesHero}
                </p>
              </>
            )}

            <div className={`grid gap-3 ${fr ? "mt-2" : ""}`}>
              <Champ
                label={a.contenu.surtitre}
                name="hero_eyebrow"
                dir={dir}
                defaultValue={champ(settings, "hero_eyebrow", langue)}
              />
              <Zone
                label={a.contenu.titreHero}
                name="hero_title"
                dir={dir}
                defaultValue={champ(settings, "hero_title", langue)}
                rows={2}
              />
              <Zone
                label={a.contenu.accroche}
                name="hero_lede"
                dir={dir}
                defaultValue={champ(settings, "hero_lede", langue)}
                rows={2}
              />
            </div>

            <div className="mt-4">
              <Envoyer variante="or">{a.contenu.enregistrerReglages}</Envoyer>
            </div>
          </FormAction>
        </section>

        {/* ------------------------------------------------------ slideshow */}
        <section>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="display display-m">{a.contenu.slideshow}</h2>
              <p className="mt-1 max-w-[60ch] text-[13.5px] text-graphite-doux">
                {a.contenu.slideshowAide}
              </p>
            </div>
            {fr && (
              <Volet
                label={a.contenu.ajouterVisuel}
                labelOuvert={a.commun.annuler}
                ton="principal"
              >
                <FormAction
                  action={enregistrerSlide}
                  className="rounded-[10px] border border-dashed border-trait p-4"
                >
                  <input type="hidden" name="edit_lang" value="fr" />
                  <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <Champ label={a.contenu.surtitre} name="eyebrow" />
                    <Champ label={a.contenu.legende} name="caption" />
                    <Liste
                      label={a.produits.gamme}
                      name="gamme_id"
                      options={optionsGammes}
                      placeholder={a.produits.gamme}
                    />
                    <Champ
                      label={a.commun.ordre}
                      name="sort_order"
                      type="number"
                      defaultValue={slides.length + 1}
                    />
                  </div>
                  <div className="mt-3">
                    <ChampImage
                      label={a.commun.image}
                      name="image"
                      labels={labelsImage}
                      ratio="3 / 4"
                      required
                    />
                  </div>
                  <div className="mt-4">
                    <Envoyer variante="or">{a.commun.ajouter}</Envoyer>
                  </div>
                </FormAction>
              </Volet>
            )}
          </div>

          <ul className="mt-4 space-y-2.5">
            {slides.map((slide) => (
              <Ligne
                key={slide.id}
                labelModifier={a.commun.modifier}
                labelFermer={a.commun.fermer}
                visuel={
                  <span className="relative block h-14 w-11 shrink-0 overflow-hidden rounded bg-comptoir">
                    {slide.image && (
                      /* URL arbitraire : pas de next/image ici. */
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={slide.image}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    )}
                  </span>
                }
                titre={champ(slide, "caption", langue) || slide.image}
                meta={champ(slide, "eyebrow", langue)}
                actions={
                  fr ? (
                    <FormAction action={supprimerSlide}>
                      <input type="hidden" name="id" value={slide.id} />
                      <Envoyer variante="danger" confirmer={a.contenu.confirmSupprVisuel}>
                        {a.commun.supprimer}
                      </Envoyer>
                    </FormAction>
                  ) : undefined
                }
              >
                <FormAction action={enregistrerSlide}>
                  <input type="hidden" name="id" value={slide.id} />
                  <input type="hidden" name="edit_lang" value={langue} />
                  <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <Champ
                      label={a.contenu.surtitre}
                      name="eyebrow"
                      dir={dir}
                      defaultValue={champ(slide, "eyebrow", langue)}
                    />
                    <Champ
                      label={a.contenu.legende}
                      name="caption"
                      dir={dir}
                      defaultValue={champ(slide, "caption", langue)}
                    />
                    {fr && (
                      <>
                        <Liste
                          label={a.produits.gamme}
                          name="gamme_id"
                          options={optionsGammes}
                          defaultValue={slide.gamme_id}
                        />
                        <Champ
                          label={a.commun.ordre}
                          name="sort_order"
                          type="number"
                          defaultValue={slide.sort_order}
                        />
                      </>
                    )}
                  </div>
                  {fr && (
                    <div className="mt-3">
                      <ChampImage
                        label={a.commun.image}
                        name="image"
                        defaultValue={slide.image}
                        labels={labelsImage}
                        ratio="3 / 4"
                        required
                      />
                    </div>
                  )}
                  <div className="mt-4">
                    <Envoyer>{a.commun.enregistrer}</Envoyer>
                  </div>
                </FormAction>
              </Ligne>
            ))}
          </ul>
        </section>

        {/* --------------------------------------------------------- vidéos */}
        <section>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="display display-m">{a.contenu.videosTitre}</h2>
              <p className="mt-1 max-w-[60ch] text-[13.5px] text-graphite-doux">
                {fill(
                  videos.length > 1
                    ? a.contenu.videosAidePluriel
                    : a.contenu.videosAide,
                  { n: videos.length },
                )}
              </p>
            </div>
            {fr && (
              <Volet
                label={a.contenu.ajouterVideo}
                labelOuvert={a.commun.annuler}
                ton="principal"
              >
                <FormAction
                  action={enregistrerVideo}
                  className="rounded-[10px] border border-dashed border-trait p-4"
                >
                  <input type="hidden" name="edit_lang" value="fr" />
                  <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <Champ label={a.commun.titreChamp} name="title" />
                    <Champ label={a.contenu.sousTitre} name="note" />
                    <Champ
                      label={a.commun.ordre}
                      name="sort_order"
                      type="number"
                      defaultValue={videos.length + 1}
                    />
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <ChampImage
                      label={a.contenu.fichierVideo}
                      name="src"
                      accept="video/*"
                      labels={labelsImage}
                      ratio="16 / 9"
                      required
                    />
                    <ChampImage
                      label={a.contenu.imageAttente}
                      name="poster"
                      labels={labelsImage}
                      ratio="16 / 9"
                    />
                  </div>
                  <div className="mt-4">
                    <Envoyer variante="or">{a.commun.ajouter}</Envoyer>
                  </div>
                </FormAction>
              </Volet>
            )}
          </div>

          <ul className="mt-4 space-y-2.5">
            {videos.map((video) => (
              <Ligne
                key={video.id}
                labelModifier={a.commun.modifier}
                labelFermer={a.commun.fermer}
                titre={champ(video, "title", langue) || video.src}
                meta={champ(video, "note", langue)}
                actions={
                  fr ? (
                    <FormAction action={supprimerVideo}>
                      <input type="hidden" name="id" value={video.id} />
                      <Envoyer variante="danger" confirmer={a.contenu.confirmSupprVideo}>
                        {a.commun.supprimer}
                      </Envoyer>
                    </FormAction>
                  ) : undefined
                }
              >
                <FormAction action={enregistrerVideo}>
                  <input type="hidden" name="id" value={video.id} />
                  <input type="hidden" name="edit_lang" value={langue} />
                  <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <Champ
                      label={a.commun.titreChamp}
                      name="title"
                      dir={dir}
                      defaultValue={champ(video, "title", langue)}
                    />
                    <Champ
                      label={a.contenu.sousTitre}
                      name="note"
                      dir={dir}
                      defaultValue={champ(video, "note", langue)}
                    />
                    {fr && (
                      <Champ
                        label={a.commun.ordre}
                        name="sort_order"
                        type="number"
                        defaultValue={video.sort_order}
                      />
                    )}
                  </div>
                  {fr && (
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <ChampImage
                        label={a.contenu.fichierVideo}
                        name="src"
                        accept="video/*"
                        defaultValue={video.src}
                        labels={labelsImage}
                        ratio="16 / 9"
                        required
                      />
                      <ChampImage
                        label={a.contenu.imageAttente}
                        name="poster"
                        defaultValue={video.poster}
                        labels={labelsImage}
                        ratio="16 / 9"
                      />
                    </div>
                  )}
                  <div className="mt-4">
                    <Envoyer>{a.commun.enregistrer}</Envoyer>
                  </div>
                </FormAction>
              </Ligne>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
