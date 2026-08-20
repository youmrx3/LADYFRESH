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
import { clePiste, terminerSession } from "@/lib/piste";
import { WILAYAS, libelleWilaya, valeurWilaya } from "@/lib/wilayas";

type Etat =
  | { phase: "repos" }
  | { phase: "envoi" }
  | { phase: "envoyee"; ref: string }
  | { phase: "erreur"; message: string };

/** Marque discrète des champs sans lesquels la commande ne part pas. */
function Requis() {
  return (
    <span aria-hidden="true" style={{ color: "var(--or-plein)" }}>
      *
    </span>
  );
}

/**
 * Le bon de commande et son formulaire.
 *
 * Tout est à l'écran d'un coup : le récapitulatif, les coordonnées, le bouton.
 * Sur une page de campagne, chaque volet à déplier est une occasion de partir —
 * et le pixel avait montré exactement cela.
 */
export function Commande() {
  const { lignes, total, nombreArticles, poser, vider } = useBoutique();
  const { t, locale } = useReglages();
  const router = useRouter();

  const [etat, setEtat] = useState<Etat>({ phase: "repos" });
  const [client, setClient] = useState({
    name: "",
    phone: "",
    wilaya: "",
    address: "",
    note: "",
  });

  const vide = lignes.length === 0;
  const devise = t.unites.devise;

  /*
    Étiquette de campagne posée par ?c=…, mémorisée le temps de la visite : la
    cliente peut défiler, revenir, et l'attribution doit survivre au détour.
  */
  const [campagne, setCampagne] = useState("");
  useEffect(() => {
    try {
      setCampagne(sessionStorage.getItem("ladyfresh.campagne") ?? "");
    } catch {
      // Mode privé : pas d'attribution, la commande passe quand même.
    }
  }, []);

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

  /* Ce qui part au serveur : des identifiants et des quantités, jamais un prix. */
  const pourEnvoi = lignes.map((l) => ({
    kind: l.kind,
    id: l.id,
    quantity: l.quantity,
  }));
  const empreinte = JSON.stringify(pourEnvoi);

  /*
    La piste de rappel : ce qui a été saisi part dès qu'il y a de quoi rappeler,
    une seconde et demie après la dernière frappe. L'appel n'est jamais attendu
    et son échec est sans conséquence — le suivi est accessoire, la commande ne
    l'est pas.
  */
  useEffect(() => {
    if (vide) return;
    const cle = clePiste(client.phone);
    if (!cle) return;

    const minuteur = setTimeout(() => {
      fetch("/api/prospects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pisteId: cle,
          locale,
          source: campagne,
          customer: client,
          lignes: JSON.parse(empreinte),
        }),
        keepalive: true,
      }).catch(() => {
        // Sans effet sur le parcours : la commande reste possible.
      });
    }, 1500);

    return () => clearTimeout(minuteur);
  }, [client, vide, locale, campagne, empreinte]);

  async function envoyer() {
    setEtat({ phase: "envoi" });

    const pourPixel = lignes.map((l) => ({
      variantId: l.id,
      quantity: l.quantity,
    }));
    pixel("InitiateCheckout", {
      ...contenus(pourPixel),
      num_items: lignes.length,
      value: total,
      currency: DEVISE_PIXEL,
    });

    try {
      const reponse = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pisteId: clePiste(client.phone),
          locale,
          source: campagne,
          customer: client,
          lignes: pourEnvoi,
        }),
      });
      const data = await reponse.json();

      if (!reponse.ok) {
        setEtat({
          phase: "erreur",
          message: data.error ?? t.commande.envoiImpossible,
        });
        return;
      }

      /*
        La valeur vient du serveur, jamais du bon local : c'est le total
        recalculé sur les prix en base. Un total client se trafique depuis la
        console, et Meta apprendrait sur des montants inventés.
      */
      const achat = {
        ...contenus(pourPixel),
        value: data.total ?? total,
        currency: DEVISE_PIXEL,
        campagne: campagne || "direct",
      };

      let remis = false;
      try {
        const charge: ChargeMerci = { ref: data.ref, achat };
        sessionStorage.setItem(CLE_MERCI, JSON.stringify(charge));
        remis = true;
      } catch {
        pixel("Purchase", achat);
      }

      terminerSession();
      setEtat({ phase: "envoyee", ref: data.ref });
      vider();
      if (remis) router.push("/merci");
    } catch {
      setEtat({ phase: "erreur", message: t.commande.reseau });
    }
  }

  if (etat.phase === "envoyee") {
    return (
      <section
        id="commande"
        className="etage-comptoir saut-ancre border-t border-trait py-16"
      >
        <div className="shell max-w-[36rem] text-center">
          <p className="eyebrow text-graphite-doux">{t.commande.okEyebrow}</p>
          <h2 className="display display-l mt-3">
            {t.commande.okTitre}{" "}
            <span className="data text-[0.68em]">{etat.ref}</span>
          </h2>
          <p className="lede mt-4 text-graphite-doux">{t.commande.okForm}</p>
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
      className="etage-comptoir saut-ancre border-t border-trait py-14 sm:py-20"
    >
      <div className="shell max-w-[42rem]">
        <p className="eyebrow text-graphite-doux">{t.commande.eyebrow}</p>
        <h2 className="display display-l mt-2.5">{t.commande.titre}</h2>

        {vide ? (
          <div className="mt-7 rounded-[12px] border border-dashed border-trait px-5 py-12 text-center">
            <p className="text-[15px]">{t.commande.videTitre}</p>
            <a
              href="#boutique"
              className="eyebrow mt-4 inline-block text-or underline underline-offset-4"
            >
              {t.commande.videCta}
            </a>
          </div>
        ) : (
          <>
            {/* --------------------------------------------- récapitulatif */}
            <ul className="mt-7 space-y-2.5">
              {lignes.map((l) => (
                <li
                  key={l.cle}
                  className="flex items-center gap-3 rounded-[10px] border border-trait p-2.5"
                  style={{ background: "var(--comptoir-surface)" }}
                >
                  <span
                    className="relative block h-14 w-14 shrink-0 overflow-hidden rounded"
                    style={{
                      background: `color-mix(in srgb, ${l.couleur} 10%, transparent)`,
                    }}
                  >
                    {l.image && (
                      <Image
                        src={l.image}
                        alt=""
                        fill
                        sizes="56px"
                        className={
                          l.kind === "pack" ? "object-cover" : "object-contain p-1"
                        }
                      />
                    )}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px]">{l.nom}</span>
                    {l.detail && (
                      <span className="data block truncate text-[12px] text-graphite-doux">
                        {l.detail}
                      </span>
                    )}
                    <span className="data block text-[12.5px] text-graphite-doux">
                      {da(l.unit, devise)} × {l.quantity}
                    </span>
                  </span>

                  <span className="flex shrink-0 items-center gap-1.5">
                    <span className="data text-[14px]">{da(l.total, devise)}</span>
                    <button
                      type="button"
                      onClick={() => poser(l.cle, 0)}
                      aria-label={fill(t.commande.retirer, { nom: l.nom })}
                      className="flex h-9 w-9 items-center justify-center text-[18px] leading-none text-graphite-doux transition-colors hover:text-graphite"
                    >
                      ×
                    </button>
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-4 flex items-center justify-between border-t border-trait pt-4">
              <span className="eyebrow text-graphite-doux">
                {fill(
                  nombreArticles > 1
                    ? t.commande.articlesPluriel
                    : t.commande.articles,
                  { n: nombreArticles },
                )}
              </span>
              <span className="data text-[1.35rem]">{da(total, devise)}</span>
            </div>

            <button
              type="button"
              onClick={vider}
              className="eyebrow mt-2 text-graphite-doux underline underline-offset-4 hover:text-graphite"
            >
              {t.commande.toutVider}
            </button>

            {/* ----------------------------------------------- coordonnées */}
            <div className="mt-8 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="etiquette" htmlFor="cmd-nom">
                    {t.commande.nom} <Requis />
                  </label>
                  <input
                    id="cmd-nom"
                    required
                    className="champ"
                    value={client.name}
                    onChange={(e) => setClient({ ...client, name: e.target.value })}
                    autoComplete="name"
                    placeholder={t.commande.nomExemple}
                  />
                </div>
                <div>
                  <label className="etiquette" htmlFor="cmd-tel">
                    {t.commande.telephone} <Requis />
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
                    placeholder="06 00 00 00 00"
                  />
                </div>
              </div>

              <div>
                <label className="etiquette" htmlFor="cmd-wilaya">
                  {t.commande.wilaya} <Requis />
                </label>
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

              <div>
                <label className="etiquette" htmlFor="cmd-adresse">
                  {t.commande.adresse}
                </label>
                <input
                  id="cmd-adresse"
                  className="champ"
                  value={client.address}
                  onChange={(e) => setClient({ ...client, address: e.target.value })}
                  autoComplete="street-address"
                  placeholder={t.commande.adresseExemple}
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
            </div>

            {/* Dire ce qui manque : un bouton éteint sans raison apparente ne se
                répare pas tout seul. */}
            {!clientComplet && (
              <p
                role="status"
                className="mt-4 text-center text-[12.5px] text-graphite-doux"
              >
                {fill(t.commande.champsRequis, { champs: manquants.join(", ") })}
              </p>
            )}

            <button
              type="button"
              disabled={!clientComplet || etat.phase === "envoi"}
              onClick={envoyer}
              className="btn btn-or mt-5 w-full !whitespace-normal !px-4 !py-4 !leading-snug !tracking-[0.1em]"
            >
              {etat.phase === "envoi"
                ? t.commande.envoiEnCours
                : fill(t.commande.confirmer, { total: da(total, devise) })}
            </button>

            <p className="mt-2.5 text-center text-[12px] text-graphite-doux">
              {t.commande.formAide}
            </p>

            {etat.phase === "erreur" && (
              <p
                role="alert"
                className="mt-3 text-center text-[13px]"
                style={{ color: "var(--danger)" }}
              >
                {etat.message}
              </p>
            )}
          </>
        )}
      </div>
    </section>
  );
}
