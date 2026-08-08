import Image from "next/image";
import {
  Champ,
  Envoyer,
  FormAction,
  Liste,
  Zone,
} from "@/components/admin/Champs";
import { Televersement } from "@/components/admin/Televersement";
import { EnTetePage, Ligne, Volet } from "@/components/admin/Volet";
import {
  enregistrerReglages,
  enregistrerSlide,
  enregistrerVideo,
  supprimerSlide,
  supprimerVideo,
} from "@/lib/actions";
import { getGammes, getHeroSlides, getSettings, getVideos } from "@/lib/data";
import { supabaseAdminConfigured } from "@/lib/supabase";
import { fill } from "@/i18n";
import { getT } from "@/i18n/server";

export const dynamic = "force-dynamic";

export default async function Contenu() {
  const { t } = await getT();
  const [settings, slides, videos, gammes] = await Promise.all([
    getSettings(),
    getHeroSlides(),
    getVideos(),
    getGammes(),
  ]);
  const a = t.admin;
  const optionsGammes = gammes.map((g) => ({ value: g.id, label: g.name }));

  return (
    <div className="max-w-[68rem]">
      <EnTetePage eyebrow={a.contenu.reglages} titre={a.contenu.titre} />

      <div className="space-y-10">
        {/* ---------------------------------------------------- réglages */}
        <section>
          <h2 className="display display-m">{a.contenu.commandeContact}</h2>
          <FormAction
            action={enregistrerReglages}
            className="mt-3 rounded-[10px] border border-trait p-4 sm:p-5"
          >
            <div className="grid gap-3 sm:grid-cols-3">
              <Champ
                label={a.contenu.numeroWhatsapp}
                name="whatsapp_number"
                defaultValue={settings.whatsapp_number}
                placeholder="213555123456"
                required
              />
              <Champ
                label={a.contenu.minGros}
                name="min_gros_cartons"
                type="number"
                min={1}
                defaultValue={settings.min_gros_cartons}
              />
              <Champ
                label={a.contenu.minDemi}
                name="min_demi_gros_pieces"
                type="number"
                min={1}
                defaultValue={settings.min_demi_gros_pieces}
              />
              <Champ
                label={a.contenu.telephoneAffiche}
                name="contact_phone"
                defaultValue={settings.contact_phone}
              />
              <Champ
                label={a.contenu.email}
                name="contact_email"
                type="email"
                defaultValue={settings.contact_email}
              />
              <Champ
                label={a.contenu.adresse}
                name="contact_address"
                defaultValue={settings.contact_address}
              />
              <Champ label="Instagram" name="instagram_url" defaultValue={settings.instagram_url} />
              <Champ label="Facebook" name="facebook_url" defaultValue={settings.facebook_url} />
              <Champ label="TikTok" name="tiktok_url" defaultValue={settings.tiktok_url} />
            </div>

            <p className="eyebrow mt-6 text-graphite-doux">
              {a.contenu.textesHero}
            </p>
            <div className="mt-2 grid gap-3">
              <Champ
                label={a.contenu.surtitre}
                name="hero_eyebrow"
                defaultValue={settings.hero_eyebrow}
              />
              <Zone
                label={a.contenu.titreHero}
                name="hero_title"
                defaultValue={settings.hero_title}
                rows={2}
              />
              <Zone
                label={a.contenu.accroche}
                name="hero_lede"
                defaultValue={settings.hero_lede}
                rows={2}
              />
            </div>

            <details className="mt-4 rounded border border-dashed border-trait p-3">
              <summary className="eyebrow cursor-pointer text-graphite-doux">
                {a.commun.traductions}
              </summary>
              <p className="mt-2 text-[12.5px] text-graphite-doux">
                {a.commun.videFrRepris}
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Champ
                  label={`${a.contenu.surtitre} — ${a.commun.arabe}`}
                  name="hero_eyebrow_ar"
                  defaultValue={settings.hero_eyebrow_ar}
                />
                <Champ
                  label={`${a.contenu.surtitre} — ${a.commun.anglais}`}
                  name="hero_eyebrow_en"
                  defaultValue={settings.hero_eyebrow_en}
                />
                <Zone
                  label={`${a.commun.titreChamp} — ${a.commun.arabe}`}
                  name="hero_title_ar"
                  defaultValue={settings.hero_title_ar}
                  rows={2}
                />
                <Zone
                  label={`${a.commun.titreChamp} — ${a.commun.anglais}`}
                  name="hero_title_en"
                  defaultValue={settings.hero_title_en}
                  rows={2}
                />
                <Zone
                  label={`${a.contenu.accroche} — ${a.commun.arabe}`}
                  name="hero_lede_ar"
                  defaultValue={settings.hero_lede_ar}
                  rows={2}
                />
                <Zone
                  label={`${a.contenu.accroche} — ${a.commun.anglais}`}
                  name="hero_lede_en"
                  defaultValue={settings.hero_lede_en}
                  rows={2}
                />
              </div>
            </details>

            <div className="mt-4">
              <Envoyer variante="or">{a.contenu.enregistrerReglages}</Envoyer>
            </div>
          </FormAction>
        </section>

        {/* --------------------------------------------------- fichiers */}
        <section>
          <h2 className="display display-m">{a.contenu.fichiers}</h2>
          <p className="mt-1 text-[13.5px] text-graphite-doux">
            {a.contenu.fichiersAide}
          </p>
          <div className="mt-3">
            <Televersement
              actif={supabaseAdminConfigured}
              labels={{
                champ: a.contenu.televerser,
                bouton: a.contenu.televersement,
                envoi: a.contenu.envoi,
                envoye: a.contenu.envoye,
                inactif: a.contenu.televersementInactif,
              }}
            />
          </div>
        </section>

        {/* -------------------------------------------------- slideshow */}
        <section>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="display display-m">{a.contenu.slideshow}</h2>
              <p className="mt-1 max-w-[60ch] text-[13.5px] text-graphite-doux">
                {a.contenu.slideshowAide}
              </p>
            </div>
            <Volet
              label={a.contenu.ajouterVisuel}
              labelOuvert={a.commun.annuler}
              ton="principal"
            >
              <FormAction
                action={enregistrerSlide}
                className="rounded-[10px] border border-dashed border-trait p-4"
              >
                <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <Champ label={a.commun.image} name="image" required />
                  <Champ label={a.contenu.surtitre} name="eyebrow" />
                  <Champ label={a.contenu.legende} name="caption" />
                  <Liste
                    label={a.produits.gamme}
                    name="gamme_id"
                    options={optionsGammes}
                  />
                  <Champ
                    label={a.commun.ordre}
                    name="sort_order"
                    type="number"
                    defaultValue={slides.length + 1}
                  />
                  <div>
                    <Envoyer variante="or">{a.commun.ajouter}</Envoyer>
                  </div>
                </div>
              </FormAction>
            </Volet>
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
                      <Image
                        src={slide.image}
                        alt=""
                        fill
                        sizes="44px"
                        className="object-cover"
                      />
                    )}
                  </span>
                }
                titre={slide.caption || slide.image}
                meta={slide.eyebrow}
                actions={
                  <FormAction action={supprimerSlide}>
                    <input type="hidden" name="id" value={slide.id} />
                    <Envoyer variante="danger" confirmer={a.contenu.confirmSupprVisuel}>
                      {a.commun.supprimer}
                    </Envoyer>
                  </FormAction>
                }
              >
                <FormAction action={enregistrerSlide}>
                  <input type="hidden" name="id" value={slide.id} />
                  <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <Champ
                      label={a.commun.image}
                      name="image"
                      defaultValue={slide.image}
                      required
                    />
                    <Champ
                      label={a.contenu.surtitre}
                      name="eyebrow"
                      defaultValue={slide.eyebrow}
                    />
                    <Champ
                      label={a.contenu.legende}
                      name="caption"
                      defaultValue={slide.caption}
                    />
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
                  </div>

                  <details className="mt-3 rounded border border-dashed border-trait p-3">
                    <summary className="eyebrow cursor-pointer text-graphite-doux">
                      {a.commun.traductions}
                    </summary>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <Champ
                        label={`${a.contenu.surtitre} — ${a.commun.arabe}`}
                        name="eyebrow_ar"
                        defaultValue={slide.eyebrow_ar}
                      />
                      <Champ
                        label={`${a.contenu.surtitre} — ${a.commun.anglais}`}
                        name="eyebrow_en"
                        defaultValue={slide.eyebrow_en}
                      />
                      <Champ
                        label={`${a.contenu.legende} — ${a.commun.arabe}`}
                        name="caption_ar"
                        defaultValue={slide.caption_ar}
                      />
                      <Champ
                        label={`${a.contenu.legende} — ${a.commun.anglais}`}
                        name="caption_en"
                        defaultValue={slide.caption_en}
                      />
                    </div>
                  </details>

                  <div className="mt-4">
                    <Envoyer>{a.commun.enregistrer}</Envoyer>
                  </div>
                </FormAction>
              </Ligne>
            ))}
          </ul>
        </section>

        {/* ----------------------------------------------------- vidéos */}
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
            <Volet
              label={a.contenu.ajouterVideo}
              labelOuvert={a.commun.annuler}
              ton="principal"
            >
              <FormAction
                action={enregistrerVideo}
                className="rounded-[10px] border border-dashed border-trait p-4"
              >
                <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <Champ label={a.commun.titreChamp} name="title" />
                  <Champ label={a.contenu.sousTitre} name="note" />
                  <Champ
                    label={a.contenu.fichierVideo}
                    name="src"
                    placeholder="/videos/…"
                    required
                  />
                  <Champ label={a.contenu.imageAttente} name="poster" />
                  <Champ
                    label={a.commun.ordre}
                    name="sort_order"
                    type="number"
                    defaultValue={videos.length + 1}
                  />
                  <div>
                    <Envoyer variante="or">{a.commun.ajouter}</Envoyer>
                  </div>
                </div>
              </FormAction>
            </Volet>
          </div>

          <ul className="mt-4 space-y-2.5">
            {videos.map((video) => (
              <Ligne
                key={video.id}
                labelModifier={a.commun.modifier}
                labelFermer={a.commun.fermer}
                titre={video.title || video.src}
                meta={video.note}
                actions={
                  <FormAction action={supprimerVideo}>
                    <input type="hidden" name="id" value={video.id} />
                    <Envoyer variante="danger" confirmer={a.contenu.confirmSupprVideo}>
                      {a.commun.supprimer}
                    </Envoyer>
                  </FormAction>
                }
              >
                <FormAction action={enregistrerVideo}>
                  <input type="hidden" name="id" value={video.id} />
                  <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <Champ
                      label={a.commun.titreChamp}
                      name="title"
                      defaultValue={video.title}
                    />
                    <Champ
                      label={a.contenu.sousTitre}
                      name="note"
                      defaultValue={video.note}
                    />
                    <Champ
                      label={a.contenu.fichierVideo}
                      name="src"
                      defaultValue={video.src}
                      required
                    />
                    <Champ
                      label={a.contenu.imageAttente}
                      name="poster"
                      defaultValue={video.poster}
                    />
                    <Champ
                      label={a.commun.ordre}
                      name="sort_order"
                      type="number"
                      defaultValue={video.sort_order}
                    />
                  </div>

                  <details className="mt-3 rounded border border-dashed border-trait p-3">
                    <summary className="eyebrow cursor-pointer text-graphite-doux">
                      {a.commun.traductions}
                    </summary>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <Champ
                        label={`${a.commun.titreChamp} — ${a.commun.arabe}`}
                        name="title_ar"
                        defaultValue={video.title_ar}
                      />
                      <Champ
                        label={`${a.commun.titreChamp} — ${a.commun.anglais}`}
                        name="title_en"
                        defaultValue={video.title_en}
                      />
                      <Champ
                        label={`${a.contenu.sousTitre} — ${a.commun.arabe}`}
                        name="note_ar"
                        defaultValue={video.note_ar}
                      />
                      <Champ
                        label={`${a.contenu.sousTitre} — ${a.commun.anglais}`}
                        name="note_en"
                        defaultValue={video.note_en}
                      />
                    </div>
                  </details>

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
