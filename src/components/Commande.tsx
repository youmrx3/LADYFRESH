"use client";

import Image from "next/image";
import { useState } from "react";
import { useBoutique } from "./BoutiqueProvider";
import { da, purchaseLabel, quantityUnit } from "@/lib/format";
import { PRODUCT_TYPE_LABEL } from "@/lib/types";

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
  } = useBoutique();

  const [etat, setEtat] = useState<Etat>({ phase: "repos" });
  const [client, setClient] = useState({
    name: "",
    phone: "",
    wilaya: "",
    address: "",
    note: "",
  });

  const vide = lines.length === 0;

  async function envoyer(canal: "whatsapp" | "formulaire") {
    // Ouverte avant l'await : un onglet ouvert plus tard serait bloqué.
    const onglet = canal === "whatsapp" ? window.open("", "_blank") : null;
    setEtat({ phase: "envoi", canal });

    try {
      const reponse = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: canal,
          purchase,
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
        setEtat({ phase: "erreur", message: data.error ?? "Envoi impossible." });
        return;
      }

      if (canal === "whatsapp" && data.whatsappUrl) {
        if (onglet) onglet.location.href = data.whatsappUrl;
        else window.location.href = data.whatsappUrl;
      }

      setEtat({ phase: "envoyee", canal, ref: data.ref });
      clear();
    } catch {
      onglet?.close();
      setEtat({
        phase: "erreur",
        message: "Connexion interrompue. Vérifiez votre réseau et réessayez.",
      });
    }
  }

  if (etat.phase === "envoyee") {
    return (
      <section id="commande" className="etage-clair saut-ancre border-t border-trait py-20">
        <div className="shell max-w-[38rem] text-center">
          <p className="eyebrow text-graphite-doux">Commande enregistrée</p>
          <h2 className="display display-l mt-4">
            C&apos;est noté. Réf.{" "}
            <span className="data text-[0.68em]">{etat.ref}</span>
          </h2>
          <p className="lede mt-4 text-graphite-doux">
            {etat.canal === "whatsapp"
              ? "WhatsApp s'est ouvert avec votre récapitulatif. Envoyez le message pour confirmer — nous vous rappelons pour la livraison."
              : "Nous avons reçu votre commande et nous vous rappelons sur le numéro indiqué pour confirmer la livraison."}
          </p>
          <button
            type="button"
            onClick={() => setEtat({ phase: "repos" })}
            className="btn btn-encre mt-8"
          >
            Passer une autre commande
          </button>
        </div>
      </section>
    );
  }

  return (
    <section id="commande" className="etage-clair saut-ancre border-t border-trait py-16 sm:py-20">
      <div className="shell">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-graphite-doux">Votre commande</p>
            <h2 className="display display-l mt-3">Le récapitulatif.</h2>
          </div>
          {!vide && (
            <button
              type="button"
              onClick={clear}
              className="eyebrow text-graphite-doux underline underline-offset-4 hover:text-graphite"
            >
              Tout vider
            </button>
          )}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_23rem] lg:gap-8">
          {/* ------------------------------------------------- le bordereau */}
          <div className="overflow-hidden rounded-[var(--radius-plaque)] border border-trait bg-porcelaine-haut">
            {vide ? (
              <div className="px-6 py-20 text-center">
                <p className="display display-m">Rien pour l&apos;instant.</p>
                <p className="mt-2 text-[15px] text-graphite-doux">
                  Ajoutez des références depuis la boutique, elles s&apos;empilent ici.
                </p>
                <a href="#boutique" className="btn btn-encre mt-6">
                  Aller à la boutique
                </a>
              </div>
            ) : (
              <>
                <div className="hidden border-b border-trait bg-porcelaine/60 px-5 py-2.5 sm:grid sm:grid-cols-[1fr_5.5rem_6rem_6.5rem_2rem] sm:gap-3">
                  {["Référence", "Qté", "P.U.", "Total", ""].map((h, i) => (
                    <span
                      key={h || i}
                      className="eyebrow text-[10px] text-graphite-doux"
                      style={{ textAlign: i === 0 ? "left" : "right" }}
                    >
                      {h}
                    </span>
                  ))}
                </div>

                <ul className="divide-y divide-trait">
                  {lines.map((l) => (
                    <li
                      key={l.variantId}
                      className="grid grid-cols-[3.25rem_1fr_auto] items-center gap-3 px-4 py-3 sm:grid-cols-[3.25rem_1fr_5.5rem_6rem_6.5rem_2rem] sm:px-5"
                    >
                      <div
                        className="relative h-14 w-full overflow-hidden rounded"
                        style={{
                          background: `color-mix(in srgb, ${l.product.color_hex} 8%, #fff)`,
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
                          {PRODUCT_TYPE_LABEL[l.product.type]}{" "}
                          <span className="text-graphite-doux">
                            {l.gamme?.name}
                          </span>
                        </p>
                        <p className="data mt-0.5 text-[11.5px] text-graphite-doux">
                          {l.variant.size_label}
                          {purchase === "gros" &&
                            ` · ${l.variant.units_per_carton} pc/carton`}
                        </p>
                        <p className="data mt-1 text-[12px] text-graphite-doux sm:hidden">
                          {l.quantity} {quantityUnit(purchase, l.quantity)} ×{" "}
                          {da(l.unit)} = <strong>{da(l.total)}</strong>
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
                          aria-label={`Quantité — ${l.product.name}`}
                          className="data h-9 w-[4.25rem] rounded border border-trait bg-transparent text-center text-[13px] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                      <span className="data hidden text-right text-[13px] text-graphite-doux sm:block">
                        {da(l.unit)}
                      </span>
                      <span className="data hidden text-right text-[14px] sm:block">
                        {da(l.total)}
                      </span>

                      <button
                        type="button"
                        onClick={() => setQuantity(l.variantId, 0)}
                        aria-label={`Retirer ${l.product.name}`}
                        className="justify-self-end text-[18px] leading-none text-graphite-doux transition-colors hover:text-graphite"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>

                <div className="flex items-baseline justify-between gap-4 border-t border-trait bg-porcelaine/60 px-5 py-4">
                  <span className="eyebrow text-graphite-doux">
                    {purchaseLabel(purchase)} · {pieceCount} pièces
                  </span>
                  <span className="data text-[1.4rem]">{da(total)}</span>
                </div>
              </>
            )}
          </div>

          {/* ------------------------------------------------- l'expédition */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-[var(--radius-plaque)] border border-trait bg-porcelaine-haut p-5 sm:p-6">
              <h3 className="display display-m">Envoyer la commande</h3>

              {!vide && !meetsMinimum && (
                <p className="mt-4 rounded border border-or/40 bg-or/8 px-3 py-2.5 text-[13px] leading-snug text-graphite">
                  {purchase === "gros"
                    ? `Chaque référence doit atteindre ${minQuantity} carton${
                        minQuantity > 1 ? "s" : ""
                      }.`
                    : `Le demi-gros démarre à ${minQuantity} pièces. Il en manque ${
                        minQuantity - pieceCount
                      }.`}
                </p>
              )}

              <div className="mt-5 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="etiquette" htmlFor="cmd-nom">
                      Nom
                    </label>
                    <input
                      id="cmd-nom"
                      className="champ"
                      value={client.name}
                      onChange={(e) =>
                        setClient({ ...client, name: e.target.value })
                      }
                      autoComplete="name"
                    />
                  </div>
                  <div>
                    <label className="etiquette" htmlFor="cmd-tel">
                      Téléphone
                    </label>
                    <input
                      id="cmd-tel"
                      className="champ"
                      inputMode="tel"
                      value={client.phone}
                      onChange={(e) =>
                        setClient({ ...client, phone: e.target.value })
                      }
                      autoComplete="tel"
                    />
                  </div>
                </div>
                <div>
                  <label className="etiquette" htmlFor="cmd-wilaya">
                    Wilaya
                  </label>
                  <input
                    id="cmd-wilaya"
                    className="champ"
                    value={client.wilaya}
                    onChange={(e) =>
                      setClient({ ...client, wilaya: e.target.value })
                    }
                  />
                </div>
              </div>

              <button
                type="button"
                disabled={vide || !meetsMinimum || etat.phase === "envoi"}
                onClick={() => envoyer("whatsapp")}
                className="btn btn-whatsapp mt-5 w-full"
              >
                {etat.phase === "envoi" && etat.canal === "whatsapp"
                  ? "Préparation…"
                  : "Commander via WhatsApp"}
              </button>
              <p className="mt-2 text-center text-[12px] text-graphite-doux">
                Ouvre WhatsApp avec le récapitulatif déjà écrit.
              </p>

              {/* ------------------------------- solution sans WhatsApp */}
              <details className="mt-6 border-t border-trait pt-5">
                <summary className="eyebrow cursor-pointer list-none text-graphite-doux transition-colors hover:text-graphite">
                  Pas de WhatsApp ? Envoyer par formulaire
                </summary>

                <div className="mt-4 space-y-3">
                  <div>
                    <label className="etiquette" htmlFor="cmd-adresse">
                      Adresse de livraison
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
                      Note
                    </label>
                    <textarea
                      id="cmd-note"
                      className="champ resize-y"
                      rows={2}
                      value={client.note}
                      onChange={(e) =>
                        setClient({ ...client, note: e.target.value })
                      }
                    />
                  </div>
                  <button
                    type="button"
                    disabled={vide || !meetsMinimum || etat.phase === "envoi"}
                    onClick={() => envoyer("formulaire")}
                    className="btn btn-encre w-full"
                  >
                    {etat.phase === "envoi" && etat.canal === "formulaire"
                      ? "Envoi…"
                      : "Envoyer la commande"}
                  </button>
                  <p className="text-center text-[12px] text-graphite-doux">
                    Nom et téléphone sont nécessaires pour vous rappeler.
                  </p>
                </div>
              </details>

              {etat.phase === "erreur" && (
                <p
                  role="alert"
                  className="mt-4 rounded border border-[#c4102b]/35 bg-[#c4102b]/6 px-3 py-2.5 text-[13px] leading-snug text-[#8f0c20]"
                >
                  {etat.message}
                </p>
              )}
            </div>

            <p className="mt-4 px-1 text-[12.5px] leading-relaxed text-graphite-doux">
              Toutes les commandes, WhatsApp ou formulaire, arrivent dans le même
              suivi. Une question avant de commander ?{" "}
              <a
                href={`tel:${settings.contact_phone.replace(/\s/g, "")}`}
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
