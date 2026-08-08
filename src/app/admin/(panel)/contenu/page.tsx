import Image from "next/image";
import {
  Champ,
  Envoyer,
  FormAction,
  Liste,
  Zone,
} from "@/components/admin/Champs";
import { Televersement } from "@/components/admin/Televersement";
import {
  enregistrerReglages,
  enregistrerSlide,
  enregistrerVideo,
  supprimerSlide,
  supprimerVideo,
} from "@/lib/actions";
import { getGammes, getHeroSlides, getSettings, getVideos } from "@/lib/data";
import { supabaseAdminConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function Contenu() {
  const [settings, slides, videos, gammes] = await Promise.all([
    getSettings(),
    getHeroSlides(),
    getVideos(),
    getGammes(),
  ]);

  const optionsGammes = gammes.map((g) => ({ value: g.id, label: g.name }));

  return (
    <div className="max-w-[64rem] space-y-12">
      <header>
        <p className="eyebrow text-graphite-doux">Réglages</p>
        <h1 className="display display-l mt-2">Contenu du site</h1>
      </header>

      {/* ---------------------------------------------------- commande */}
      <section>
        <h2 className="display display-m">Commande et contact</h2>
        <FormAction
          action={enregistrerReglages}
          className="mt-4 rounded-[10px] border border-trait bg-porcelaine-haut p-5"
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <Champ
              label="Numéro WhatsApp (indicatif compris)"
              name="whatsapp_number"
              defaultValue={settings.whatsapp_number}
              placeholder="213555123456"
              required
            />
            <Champ
              label="Minimum gros (cartons)"
              name="min_gros_cartons"
              type="number"
              min={1}
              defaultValue={settings.min_gros_cartons}
            />
            <Champ
              label="Minimum demi-gros (pièces)"
              name="min_demi_gros_pieces"
              type="number"
              min={1}
              defaultValue={settings.min_demi_gros_pieces}
            />
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <Champ
              label="Téléphone affiché"
              name="contact_phone"
              defaultValue={settings.contact_phone}
            />
            <Champ
              label="E-mail"
              name="contact_email"
              type="email"
              defaultValue={settings.contact_email}
            />
            <Champ
              label="Adresse"
              name="contact_address"
              defaultValue={settings.contact_address}
            />
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <Champ label="Instagram" name="instagram_url" defaultValue={settings.instagram_url} />
            <Champ label="Facebook" name="facebook_url" defaultValue={settings.facebook_url} />
            <Champ label="TikTok" name="tiktok_url" defaultValue={settings.tiktok_url} />
          </div>

          <p className="eyebrow mt-6 text-graphite-doux">Textes du hero</p>
          <div className="mt-2 grid gap-3">
            <Champ label="Surtitre" name="hero_eyebrow" defaultValue={settings.hero_eyebrow} />
            <Zone
              label="Titre (un retour à la ligne = deuxième ligne, en or)"
              name="hero_title"
              defaultValue={settings.hero_title}
              rows={2}
            />
            <Zone label="Accroche" name="hero_lede" defaultValue={settings.hero_lede} rows={2} />
          </div>

          <div className="mt-4">
            <Envoyer variante="or">Enregistrer les réglages</Envoyer>
          </div>
        </FormAction>
      </section>

      {/* ---------------------------------------------- téléversement */}
      <section>
        <h2 className="display display-m">Fichiers</h2>
        <p className="mt-1 text-[13.5px] text-graphite-doux">
          Envoyez une image ou une vidéo, puis collez l&apos;adresse obtenue
          dans le champ concerné ci-dessous.
        </p>
        <div className="mt-4">
          <Televersement actif={supabaseAdminConfigured} />
        </div>
      </section>

      {/* ------------------------------------------------ slideshow hero */}
      <section>
        <h2 className="display display-m">Slideshow du hero</h2>
        <p className="mt-1 text-[13.5px] text-graphite-doux">
          Chaque visuel est rattaché à une gamme : sa couleur teinte le hero
          pendant l&apos;affichage.
        </p>

        <ul className="mt-4 space-y-3">
          {slides.map((slide) => (
            <li
              key={slide.id}
              className="rounded-[10px] border border-trait bg-porcelaine-haut p-4"
            >
              <div className="flex gap-4">
                <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded bg-porcelaine">
                  {slide.image && (
                    <Image
                      src={slide.image}
                      alt=""
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  )}
                </div>
                <FormAction action={enregistrerSlide} className="min-w-0 flex-1">
                  <input type="hidden" name="id" value={slide.id} />
                  <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    <Champ
                      label="Image"
                      name="image"
                      defaultValue={slide.image}
                      className="lg:col-span-2"
                      required
                    />
                    <Champ label="Surtitre" name="eyebrow" defaultValue={slide.eyebrow} />
                    <Champ label="Légende" name="caption" defaultValue={slide.caption} />
                    <Champ
                      label="Ordre"
                      name="sort_order"
                      type="number"
                      defaultValue={slide.sort_order}
                    />
                    <Liste
                      label="Gamme"
                      name="gamme_id"
                      options={optionsGammes}
                      defaultValue={slide.gamme_id}
                    />
                    <div className="pb-0.5">
                      <Envoyer />
                    </div>
                  </div>
                </FormAction>
              </div>
              <FormAction action={supprimerSlide} className="mt-2">
                <input type="hidden" name="id" value={slide.id} />
                <Envoyer variante="danger" confirmer="Supprimer ce visuel ?">
                  Supprimer
                </Envoyer>
              </FormAction>
            </li>
          ))}
        </ul>

        <FormAction
          action={enregistrerSlide}
          className="mt-4 rounded-[10px] border border-dashed border-trait bg-porcelaine-haut p-4"
        >
          <p className="eyebrow text-graphite-doux">Ajouter un visuel</p>
          <div className="mt-3 grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Champ label="Image" name="image" className="lg:col-span-2" required />
            <Champ label="Surtitre" name="eyebrow" />
            <Champ label="Légende" name="caption" />
            <Champ
              label="Ordre"
              name="sort_order"
              type="number"
              defaultValue={slides.length + 1}
            />
            <Liste label="Gamme" name="gamme_id" options={optionsGammes} />
            <div className="pb-0.5">
              <Envoyer variante="or">Ajouter</Envoyer>
            </div>
          </div>
        </FormAction>
      </section>

      {/* ------------------------------------------------------- vidéos */}
      <section>
        <h2 className="display display-m">
          Vidéos « Pourquoi nous choisir »
        </h2>
        <p className="mt-1 text-[13.5px] text-graphite-doux">
          {videos.length} vidéo{videos.length > 1 ? "s" : ""} en ligne. La
          section s&apos;adapte au nombre : ajoutez-en jusqu&apos;à quatre.
        </p>

        <ul className="mt-4 space-y-3">
          {videos.map((video) => (
            <li
              key={video.id}
              className="rounded-[10px] border border-trait bg-porcelaine-haut p-4"
            >
              <FormAction action={enregistrerVideo}>
                <input type="hidden" name="id" value={video.id} />
                <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  <Champ label="Titre" name="title" defaultValue={video.title} />
                  <Champ label="Sous-titre" name="note" defaultValue={video.note} />
                  <Champ label="Fichier vidéo" name="src" defaultValue={video.src} required />
                  <Champ label="Image d'attente" name="poster" defaultValue={video.poster} />
                  <div className="flex items-end gap-3">
                    <Champ
                      label="Ordre"
                      name="sort_order"
                      type="number"
                      defaultValue={video.sort_order}
                    />
                    <div className="pb-0.5">
                      <Envoyer />
                    </div>
                  </div>
                </div>
              </FormAction>
              <FormAction action={supprimerVideo} className="mt-2">
                <input type="hidden" name="id" value={video.id} />
                <Envoyer variante="danger" confirmer="Supprimer cette vidéo ?">
                  Supprimer
                </Envoyer>
              </FormAction>
            </li>
          ))}
        </ul>

        <FormAction
          action={enregistrerVideo}
          className="mt-4 rounded-[10px] border border-dashed border-trait bg-porcelaine-haut p-4"
        >
          <p className="eyebrow text-graphite-doux">Ajouter une vidéo</p>
          <div className="mt-3 grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Champ label="Titre" name="title" />
            <Champ label="Sous-titre" name="note" />
            <Champ label="Fichier vidéo" name="src" placeholder="/videos/…" required />
            <Champ label="Image d'attente" name="poster" />
            <div className="flex items-end gap-3">
              <Champ
                label="Ordre"
                name="sort_order"
                type="number"
                defaultValue={videos.length + 1}
              />
              <div className="pb-0.5">
                <Envoyer variante="or">Ajouter</Envoyer>
              </div>
            </div>
          </div>
        </FormAction>
      </section>
    </div>
  );
}
