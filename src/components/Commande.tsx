"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useBoutique } from "./BoutiqueProvider";
import { CLE_MERCI, type ChargeMerci } from "./Merci";
import { useReglages } from "./Reglages";
import { fill } from "@/i18n";
import { da } from "@/lib/format";
import { DEVISE_PIXEL, contenus, pixel } from "@/lib/pixel";
import { WILAYAS, libelleWilaya, valeurWilaya } from "@/lib/wilayas";
import { nomType } from "@/i18n/contenu";

type Etat =
  | { phase: "repos" }
  | { phase: "envoi"; canal: "whatsapp" | "formulaire" }
  | { phase: "envoyee"; canal: "whatsapp" | "formulaire"; ref: string }
  | { phase: "erreur"; message: string };

export function Commande() {
  const {
    lines,
    total,
    pieceCount,
    purchase,
    setQuantity,
    clear,
    minQuantity,
    meetsMinimum,
    settings,
    types,
  } = useBoutique();
  const { t, locale } = useReglages();
  const router = useRouter();

  const [etat, setEtat] = useState<Etat>({ phase: "repos" });
  const [formOuvert, setFormOuvert] = useState(false);
  const [client, setClient] = useState({
    name: "",
    phone: "",
    wilaya: "",
    address: "",
    note: "",
  });

  const vide = lines.length === 0;
  const devise = t.unites.devise;

  /*
    Nom, téléphone et wilaya sont exigés sur les deux canaux.

    Le départ vers WhatsApp ne dispensait de rien : la commande est enregistrée
    avant la redirection, et une commande sans numéro ni wilaya ne se rappelle
    ni ne se livre — elle occupe une ligne dans le back-office sans pouvoir
    être honorée.
  */
  const manquants = (
    [
      ["name", t.commande.nom],
      ["phone", t.commande.telephone],
      ["wilaya", t.commande.wilaya],
    ] as const
  )
    .filter(([cle]) => !client[cle].trim())
    .map(([, label]) => label);
  const clientComplet = manquants.length === 0;

  /*
    Étiquette de campagne posée par /boutique?c=…, mémorisée le temps de la
    visite : le client peut passer par la vitrine avant de commander, et
    l'attribution doit survivre à ce détour.
  */
  const [campagne, setCampagne] = useState("");
  useEffect(() => {
    try {
      setCampagne(sessionStorage.getItem("ladyfresh.campagne") ?? "");
    } catch {
      // Mode privé : pas d'attribution, la commande passe quand même.
    }
  }, []);

  async function envoyer(canal: "whatsapp" | "formulaire") {
    // Ouvert avant l'await : un onglet ouvert plus tard serait bloqué.
    const onglet = canal === "whatsapp" ? window.open("", "_blank") : null;
    setEtat({ phase: "envoi", canal });

    const lignesPixel = lines.map((l) => ({
      variantId: l.variantId,
      quantity: l.quantity,
    }));
    pixel("InitiateCheckout", {
      ...contenus(lignesPixel),
      num_items: lines.length,
      value: total,
      currency: DEVISE_PIXEL,
    });

    try {
      const reponse = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: canal,
          purchase,
          locale,
          source: campagne,
          customer: client,
          items: lines.map((l) => ({
            variantId: l.variantId,
            quantity: l.quantity,
          })),
        }),
      });
      const data = await reponse.json();

      if (!reponse.ok) {
        onglet?.close();
        setEtat({
          phase: "erreur",
          message: data.error ?? t.commande.envoiImpossible,
        });
        return;
      }

      /*
        La valeur vient du serveur, jamais du panier local : c'est le total
        recalculé à partir des prix en base. Un total client se trafique depuis
        la console, et Meta apprendrait sur des montants inventés.
      */
      const achat = {
        ...contenus(lignesPixel),
        value: data.total ?? total,
        currency: DEVISE_PIXEL,
        content_category: purchase === "gros" ? "gros" : "demi_gros",
        // Permet de comparer les campagnes dans les ventilations Meta.
        campagne: campagne || "direct",
        canal,
      };

      /*
        Purchase ne part plus d'ici mais de /merci : sur un chargement de page
        distinct, rien ne peut couper l'envoi, et l'événement porte une adresse
        sur laquelle bâtir une conversion personnalisée.

        Si sessionStorage est fermé — navigation privée —, la remise n'arrive
        pas et la vente ne serait comptée nulle part : on émet alors sur place
        et on reste sur l'écran de confirmation d'ici.
      */
      let remis = false;
      try {
        const charge: ChargeMerci = { ref: data.ref, canal, achat };
        sessionStorage.setItem(CLE_MERCI, JSON.stringify(charge));
        remis = true;
      } catch {
        pixel("Purchase", achat);
      }

      /*
        L'onglet a été ouvert avant l'attente. S'il a été bloqué, on ne part
        plus vers WhatsApp depuis cette page — c'est ce départ qui coupait
        l'événement au vol.

        La commande est enregistrée quoi qu'il arrive et le rappel se fait au
        téléphone : dans ce cas rare, le client ne verra pas la conversation
        s'ouvrir. La page de remerciement n'offre plus de rattrapage, elle ne
        propose que de commander à nouveau.
      */
      if (canal === "whatsapp" && data.whatsappUrl && onglet) {
        onglet.location.href = data.whatsappUrl;
      } else {
        onglet?.close();
      }

      setEtat({ phase: "envoyee", canal, ref: data.ref });
      clear();
      if (remis) router.push("/merci");
    } catch {
      onglet?.close();
      setEtat({ phase: "erreur", message: t.commande.reseau });
    }
  }

  if (etat.phase === "envoyee") {
    return (
      <section
        id="commande"
        className="etage-comptoir saut-ancre border-t border-trait py-20"
      >
        <div className="shell max-w-[38rem] text-center">
          <p className="eyebrow text-graphite-doux">{t.commande.okEyebrow}</p>
          <h2 className="display display-l mt-4">
            {t.commande.okTitre}{" "}
            <span className="data text-[0.68em]">{etat.ref}</span>
          </h2>
          <p className="lede mt-4 text-graphite-doux">
            {etat.canal === "whatsapp" ? t.commande.okWhatsapp : t.commande.okForm}
          </p>
          <button
            type="button"
            onClick={() => setEtat({ phase: "repos" })}
            className="btn btn-encre mt-8"
          >
            {t.commande.okCta}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section
      id="commande"
      className="etage-comptoir saut-ancre border-t border-trait py-16 sm:py-20"
    >
      <div className="shell">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-graphite-doux">{t.commande.eyebrow}</p>
            <h2 className="display display-l mt-3">{t.commande.titre}</h2>
          </div>
          {!vide && (
            <button
              type="button"
              onClick={clear}
              className="eyebrow text-graphite-doux underline underline-offset-4 hover:text-graphite"
            >
              {t.commande.toutVider}
            </button>
          )}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_23rem] lg:gap-8">
          {/* ------------------------------------------------- le bordereau */}
          <div
            className="overflow-hidden rounded-[var(--radius-plaque)] border border-trait"
            style={{ background: "var(--comptoir-surface)" }}
          >
            {vide ? (
              <div className="px-6 py-20 text-center">
                <p className="display display-m">{t.commande.videTitre}</p>
                <p className="mt-2 text-[15px] text-graphite-doux">
                  {t.commande.videTexte}
                </p>
                <a href="#boutique" className="btn btn-encre mt-6">
                  {t.commande.videCta}
                </a>
              </div>
            ) : (
              <>
                <div className="hidden border-b border-trait bg-comptoir px-5 py-2.5 sm:grid sm:grid-cols-[1fr_5.5rem_6rem_6.5rem_2rem] sm:gap-3">
                  {[
                    t.commande.colRef,
                    t.commande.colQte,
                    t.commande.colPu,
                    t.commande.colTotal,
                    "",
                  ].map((h, i) => (
                    <span
                      key={h || i}
                      className="eyebrow text-[10px] text-graphite-doux"
                      style={{ textAlign: i === 0 ? "start" : "end" }}
                    >
                      {h}
                    </span>
                  ))}
                </div>

                <ul className="divide-y divide-trait">
                  {lines.map((l) => {
                    const nom = `${nomType(l.product, types, locale)} ${l.gamme?.name ?? ""}`;
                    return (
                      <li
                        key={l.variantId}
                        className="grid grid-cols-[3.25rem_1fr_auto] items-center gap-3 px-4 py-3 sm:grid-cols-[3.25rem_1fr_5.5rem_6rem_6.5rem_2rem] sm:px-5"
                      >
                        <div
                          className="relative h-14 w-full overflow-hidden rounded"
                          style={{
                            background: `color-mix(in srgb, ${l.product.color_hex} 8%, var(--comptoir-surface))`,
                          }}
                        >
                          <Image
                            src={l.variant.image}
                            alt=""
                            fill
                            sizes="52px"
                            className="object-contain p-1"
                          />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-[14.5px] leading-tight">
                            {nomType(l.product, types, locale)}{" "}
                            <span className="text-graphite-doux">
                              {l.gamme?.name}
                            </span>
                          </p>
                          <p className="data mt-0.5 text-[11.5px] text-graphite-doux">
                            {l.variant.size_label}
                            {purchase === "gros" &&
                              ` · ${fill(t.commande.parCarton, {
                                n: l.variant.units_per_carton,
                              })}`}
                          </p>
                          <p className="data mt-1 text-[12px] text-graphite-doux sm:hidden">
                            {l.quantity}{" "}
                            {purchase === "gros"
                              ? t.unites.cartons
                              : t.unites.pieces}{" "}
                            × {da(l.unit, devise)} ={" "}
                            <strong>{da(l.total, devise)}</strong>
                          </p>
                        </div>

                        <div className="hidden items-center justify-end sm:flex">
                          <input
                            type="number"
                            min={1}
                            value={l.quantity}
                            onChange={(e) =>
                              setQuantity(
                                l.variantId,
                                Math.max(0, Number(e.target.value) || 0),
                              )
                            }
                            /* Même seuil qu'en boutique : 0 retire, sinon minimum. */
                            onBlur={(e) => {
                              const n = Math.max(0, Number(e.target.value) || 0);
                              if (n > 0 && n < minQuantity)
                                setQuantity(l.variantId, minQuantity);
                            }}
                            aria-label={fill(t.commande.quantiteLigne, { nom })}
                            className="data h-9 w-full max-w-[4.75rem] rounded border border-trait bg-transparent text-center text-[13px] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>
                        <span className="data hidden text-end text-[13px] text-graphite-doux sm:block">
                          {da(l.unit, devise)}
                        </span>
                        <span className="data hidden text-end text-[14px] sm:block">
                          {da(l.total, devise)}
                        </span>

                        <button
                          type="button"
                          onClick={() => setQuantity(l.variantId, 0)}
                          aria-label={fill(t.commande.retirer, { nom })}
                          className="justify-self-end text-[18px] leading-none text-graphite-doux transition-colors hover:text-graphite"
                        >
                          ×
                        </button>
                      </li>
                    );
                  })}
                </ul>

                <div className="flex flex-wrap items-baseline justify-between gap-4 border-t border-trait bg-comptoir px-5 py-4">
                  <span className="eyebrow text-graphite-doux">
                    {t.achat[purchase]} · {pieceCount} {t.unites.pieces}
                  </span>
                  <span className="data text-[1.4rem]">{da(total, devise)}</span>
                </div>
              </>
            )}
          </div>

          {/* ------------------------------------------------- l'expédition */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div
              className="rounded-[var(--radius-plaque)] border border-trait p-5 sm:p-6"
              style={{ background: "var(--comptoir-surface)" }}
            >
              <h3 className="display display-m">{t.commande.envoyer}</h3>

              {!vide && !meetsMinimum && (
                <p
                  className="mt-4 rounded border px-3 py-2.5 text-[13px] leading-snug"
                  style={{
                    borderColor: "color-mix(in srgb, var(--or-trait) 40%, transparent)",
                    background: "color-mix(in srgb, var(--or-trait) 8%, transparent)",
                  }}
                >
                  {purchase === "gros"
                    ? fill(
                        minQuantity > 1
                          ? t.commande.manqueGrosPluriel
                          : t.commande.manqueGros,
                        { n: minQuantity },
                      )
                    : fill(t.commande.manqueDemi, {
                        n: minQuantity,
                        reste: minQuantity - pieceCount,
                      })}
                </p>
              )}

              <div className="mt-5 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="etiquette" htmlFor="cmd-nom">
                      {t.commande.nom}
                    </label>
                    <input
                      id="cmd-nom"
                    required
                      className="champ"
                      value={client.name}
                      onChange={(e) => setClient({ ...client, name: e.target.value })}
                      autoComplete="name"
                    />
                  </div>
                  <div>
                    <label className="etiquette" htmlFor="cmd-tel">
                      {t.commande.telephone}
                    </label>
                    <input
                      id="cmd-tel"
                    required
                      className="champ"
                      inputMode="tel"
                      dir="ltr"
                      value={client.phone}
                      onChange={(e) => setClient({ ...client, phone: e.target.value })}
                      autoComplete="tel"
                    />
                  </div>
                </div>
                <div>
                  <label className="etiquette" htmlFor="cmd-wilaya">
                    {t.commande.wilaya}
                  </label>
                  {/*
                    Liste fermée plutôt que saisie libre : sur un téléphone,
                    taper « Bordj Bou Arréridj » invite la faute de frappe, et
                    deux orthographes d'une même wilaya se regroupent mal au
                    moment d'organiser les livraisons.
                  */}
                  <select
                    id="cmd-wilaya"
                    required
                    className="champ"
                    dir={locale === "ar" ? "rtl" : "ltr"}
                    value={client.wilaya}
                    onChange={(e) => setClient({ ...client, wilaya: e.target.value })}
                  >
                    <option value="">{t.commande.wilayaChoisir}</option>
                    {WILAYAS.map((w) => (
                      <option key={w.code} value={valeurWilaya(w)}>
                        {libelleWilaya(w, locale)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/*
                Dire ce qui manque, plutôt que de laisser un bouton éteint sans
                raison apparente — le client ne devine pas quel champ le bloque.
              */}
              {!vide && meetsMinimum && !clientComplet && (
                <p
                  role="status"
                  className="mt-4 text-center text-[12.5px] text-graphite-doux"
                >
                  {fill(t.commande.champsRequis, {
                    champs: manquants.join(", "),
                  })}
                </p>
              )}

              <button
                type="button"
                disabled={
                  vide || !meetsMinimum || !clientComplet || etat.phase === "envoi"
                }
                onClick={() => envoyer("whatsapp")}
                className="btn btn-whatsapp mt-5 w-full"
              >
                {etat.phase === "envoi" && etat.canal === "whatsapp"
                  ? t.commande.whatsappPrep
                  : t.commande.whatsapp}
              </button>
              <p className="mt-2 text-center text-[12px] text-graphite-doux">
                {t.commande.whatsappAide}
              </p>

              {/* ------------------------------- solution sans WhatsApp */}
              {/*
                C'était un <summary> en petites capitales grises, replanté sous
                le bouton vert : rigoureusement invisible. Or tout le monde n'a
                pas WhatsApp, et cette porte-là était la seule qui restait —
                une commande perdue faute d'avoir vu le lien est une commande
                perdue pour de bon.

                Bouton doré plein, pleine largeur, comme le vert. Il reste doré
                une fois ouvert et sert à refermer : le libellé et le chevron
                disent déjà l'état, et l'envoi qui apparaît dessous est encre
                sur fond clair — les deux ne se confondent pas.
              */}
              <div className="mt-6 border-t border-trait pt-5">
                <button
                  type="button"
                  onClick={() => setFormOuvert((v) => !v)}
                  aria-expanded={formOuvert}
                  aria-controls="cmd-form-sans-whatsapp"
                  className="btn btn-or w-full !whitespace-normal"
                >
                  {formOuvert ? t.commande.fermerForm : t.commande.sansWhatsapp}
                  <span
                    aria-hidden="true"
                    className="transition-transform duration-200"
                    style={{ transform: formOuvert ? "rotate(180deg)" : "none" }}
                  >
                    ▾
                  </span>
                </button>
              </div>

              {formOuvert && (
                <div id="cmd-form-sans-whatsapp" className="mt-4 space-y-3">
                  <div>
                    <label className="etiquette" htmlFor="cmd-adresse">
                      {t.commande.adresse}
                    </label>
                    <input
                      id="cmd-adresse"
                      className="champ"
                      value={client.address}
                      onChange={(e) =>
                        setClient({ ...client, address: e.target.value })
                      }
                      autoComplete="street-address"
                    />
                  </div>
                  <div>
                    <label className="etiquette" htmlFor="cmd-note">
                      {t.commande.note}
                    </label>
                    <textarea
                      id="cmd-note"
                      className="champ resize-y"
                      rows={2}
                      value={client.note}
                      onChange={(e) => setClient({ ...client, note: e.target.value })}
                    />
                  </div>
                  <button
                    type="button"
                    disabled={
                  vide || !meetsMinimum || !clientComplet || etat.phase === "envoi"
                }
                    onClick={() => envoyer("formulaire")}
                    className="btn btn-encre w-full"
                  >
                    {etat.phase === "envoi" && etat.canal === "formulaire"
                      ? t.commande.envoiEnCours
                      : t.commande.envoyerForm}
                  </button>
                  <p className="text-center text-[12px] text-graphite-doux">
                    {t.commande.formAide}
                  </p>
                </div>
              )}

              {etat.phase === "erreur" && (
                <p
                  role="alert"
                  className="mt-4 rounded border px-3 py-2.5 text-[13px] leading-snug"
                  style={{
                    borderColor: "color-mix(in srgb, var(--danger) 40%, transparent)",
                    background: "color-mix(in srgb, var(--danger) 7%, transparent)",
                    color: "var(--danger)",
                  }}
                >
                  {etat.message}
                </p>
              )}
            </div>

            <p className="mt-4 px-1 text-[12.5px] leading-relaxed text-graphite-doux">
              {t.commande.piedDePage}{" "}
              <a
                href={`tel:${settings.contact_phone.replace(/\s/g, "")}`}
                dir="ltr"
                className="underline underline-offset-2"
              >
                {settings.contact_phone}
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
