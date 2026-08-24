import Link from "next/link";
import { Envoyer, FormAction } from "@/components/admin/Champs";
import { EnTetePage } from "@/components/admin/Volet";
import {
  changerStatutCommande,
  supprimerCommande,
  testerEmail,
} from "@/lib/actions";
import { getOrders } from "@/lib/data";
import { da, formatDate } from "@/lib/format";
import { fill } from "@/i18n";
import { HTML_LANG } from "@/i18n/config";
import { getT } from "@/i18n/server";
import type { OrderStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATUTS: OrderStatus[] = ["nouvelle", "en_cours", "traitee", "livree"];

const TEINTE: Record<OrderStatus, string> = {
  nouvelle: "#c4102b",
  en_cours: "#b8860b",
  traitee: "#2e7d9a",
  livree: "#2f8f5b",
};

export default async function Commandes({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string }>;
}) {
  const { t, locale } = await getT();
  const { statut } = await searchParams;
  const orders = await getOrders();

  const filtre = STATUTS.includes(statut as OrderStatus)
    ? (statut as OrderStatus)
    : null;
  const visibles = filtre ? orders.filter((o) => o.status === filtre) : orders;
  const compte = (s: OrderStatus) => orders.filter((o) => o.status === s).length;

  return (
    <div>
      <EnTetePage
        eyebrow={t.admin.commandes.suivi}
        titre={t.admin.commandes.titre}
        action={
          <div className="flex flex-col items-end gap-1.5">
            <p className="data text-[length:var(--adm-t-sm)] text-[color:var(--adm-muted)]">
              {fill(t.admin.commandes.total, { n: orders.length })}
            </p>
            {/*
              Un avis qui ne part pas ne se voit nulle part : il faudrait
              ouvrir les journaux de l'hébergeur. Ce bouton tente un envoi et
              écrit ici même ce qui a échoué, ou vers où c'est parti.
            */}
            <FormAction action={testerEmail}>
              <Envoyer variante="neutre">{t.admin.commandes.testerEmail}</Envoyer>
            </FormAction>
          </div>
        }
      />

      {/* Les compteurs servent aussi de filtre : un clic, pas de menu. */}
      <nav className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <Onglet
          href="/admin"
          actif={!filtre}
          label={t.admin.commandes.filtreTous}
          n={orders.length}
        />
        {STATUTS.map((s) => (
          <Onglet
            key={s}
            href={`/admin?statut=${s}`}
            actif={filtre === s}
            label={t.statuts[s]}
            n={compte(s)}
            teinte={TEINTE[s]}
          />
        ))}
      </nav>

      {visibles.length === 0 ? (
        <p className="mt-8 rounded border border-dashed border-[color:var(--adm-line)] px-6 py-16 text-center text-[length:var(--adm-t-md)] text-[color:var(--adm-muted)]">
          {t.admin.commandes.vide}
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {visibles.map((order) => (
            <li key={order.id} className="adm-carte overflow-hidden">
              <details className="group">
                {/* ------------------------------------------- en-tête */}
                <summary
                  className="flex cursor-pointer list-none items-center gap-3 p-3 sm:p-4"
                  style={{ minHeight: "var(--adm-h-lg)" }}
                >
                  <span
                    aria-hidden
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: TEINTE[order.status] }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-baseline gap-x-2">
                      <span
                        className="data"
                        style={{ fontSize: "var(--adm-t-md)", fontWeight: 500 }}
                      >
                        {order.ref}
                      </span>
                      <span
                        className="truncate"
                        style={{ fontSize: "var(--adm-t-sm)", color: "var(--adm-muted)" }}
                      >
                        {order.customer_name || t.admin.commandes.clientAbsent}
                      </span>
                    </span>
                    <span
                      className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1"
                      style={{ fontSize: "var(--adm-t-xs)", color: "var(--adm-muted)" }}
                    >
                      <span className="data">
                        {formatDate(order.created_at, HTML_LANG[locale])}
                      </span>
                      <span aria-hidden>·</span>
                      <span>{t.statuts[order.status]}</span>
                      {order.source && (
                        <span
                          className="adm-pastille adm-pastille-nue"
                          style={{
                            background:
                              "color-mix(in srgb, var(--adm-accent) 16%, transparent)",
                            borderColor: "transparent",
                            color: "var(--or-trait)",
                          }}
                        >
                          {order.source}
                        </span>
                      )}
                    </span>
                  </span>
                  <span
                    className="data shrink-0"
                    style={{ fontSize: "var(--adm-t-md)", fontWeight: 500 }}
                  >
                    {da(order.total, t.unites.devise)}
                  </span>
                  <span
                    aria-hidden
                    className="shrink-0 transition-transform duration-200 group-open:rotate-180"
                    style={{ color: "var(--adm-muted)" }}
                  >
                    &#9662;
                  </span>
                </summary>

                <div className="border-t" style={{ borderColor: "var(--adm-line)" }}>
                  {/* ----------------------------------------- la cliente */}
                  <div className="p-4">
                    <p className="adm-etiquette">{t.admin.commandes.client}</p>
                    <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                      <Info label={t.commande.nom}>
                        {order.customer_name || "\u2014"}
                      </Info>
                      <Info label={t.commande.telephone}>
                        {order.phone ? (
                          <a
                            href={"tel:" + order.phone.replace(/\s/g, "")}
                            dir="ltr"
                            className="data underline underline-offset-4"
                            style={{ fontSize: "var(--adm-t-champ)" }}
                          >
                            {order.phone}
                          </a>
                        ) : (
                          "\u2014"
                        )}
                      </Info>
                      <Info label={t.commande.wilaya}>{order.wilaya || "\u2014"}</Info>
                      <Info label={t.admin.commandes.adresse}>
                        {order.address || "\u2014"}
                      </Info>
                      {order.note && (
                        <Info label={t.admin.commandes.note} large>
                          {order.note}
                        </Info>
                      )}
                    </dl>
                  </div>

                  {/* ------------------------------------------ le contenu */}
                  <div className="border-t p-4" style={{ borderColor: "var(--adm-line)" }}>
                    <p className="adm-etiquette">{t.admin.commandes.articles}</p>
                    <ul className="space-y-1.5">
                      {order.items?.map((item, i) => (
                        <li
                          key={item.id || item.product_name + "-" + i}
                          className="flex items-baseline justify-between gap-3"
                          style={{ fontSize: "var(--adm-t-md)" }}
                        >
                          <span className="min-w-0">
                            {item.product_name}{" "}
                            <span
                              className="data"
                              style={{
                                fontSize: "var(--adm-t-sm)",
                                color: "var(--adm-muted)",
                              }}
                            >
                              {item.size_label} &middot; &times;{item.quantity}
                            </span>
                          </span>
                          <span className="data shrink-0">
                            {da(item.line_total, t.unites.devise)}
                          </span>
                        </li>
                      ))}
                      <li
                        className="mt-2 flex items-baseline justify-between gap-3 border-t pt-2"
                        style={{ borderColor: "var(--adm-line)" }}
                      >
                        <span className="adm-etiquette mb-0">
                          {t.admin.commandes.totalLigne}
                        </span>
                        <span
                          className="data"
                          style={{ fontSize: "var(--adm-t-lg)", fontWeight: 500 }}
                        >
                          {da(order.total, t.unites.devise)}
                        </span>
                      </li>
                    </ul>
                  </div>

                  {/*
                    Le statut se pose d'un seul geste. Le menu déroulant suivi
                    d'un bouton en demandait trois, pour quatre valeurs
                    possibles — et laissait la ligne ouverte sans rien dire.

                    La suppression est reléguée à l'autre bout de la rangée :
                    on ne veut pas la frôler en changeant un statut.
                  */}
                  <div
                    className="border-t p-4"
                    style={{
                      borderColor: "var(--adm-line)",
                      background: "var(--adm-surface-2)",
                    }}
                  >
                    <p className="adm-etiquette">{t.admin.commandes.statut}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      {STATUTS.map((s) => {
                        const on = s === order.status;
                        return (
                          <FormAction key={s} action={changerStatutCommande}>
                            <input type="hidden" name="id" value={order.id} />
                            <input type="hidden" name="status" value={s} />
                            <button
                              type="submit"
                              disabled={on}
                              aria-current={on ? "true" : undefined}
                              className="adm-btn"
                              style={{
                                background: on ? TEINTE[s] : "var(--adm-surface)",
                                color: on ? "#fff" : "var(--adm-fg)",
                                borderColor: on ? TEINTE[s] : "var(--adm-line)",
                                opacity: 1,
                                cursor: on ? "default" : "pointer",
                              }}
                            >
                              {t.statuts[s]}
                            </button>
                          </FormAction>
                        );
                      })}

                      <span className="ms-auto">
                        <FormAction action={supprimerCommande}>
                          <input type="hidden" name="id" value={order.id} />
                          <Envoyer
                            variante="danger"
                            confirmer={fill(t.admin.commandes.confirmSuppr, {
                              ref: order.ref,
                            })}
                          >
                            {t.admin.commandes.supprimer}
                          </Envoyer>
                        </FormAction>
                      </span>
                    </div>
                  </div>
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Onglet({
  href,
  actif,
  label,
  n,
  teinte,
}: {
  href: string;
  actif: boolean;
  label: string;
  n: number;
  teinte?: string;
}) {
  return (
    <Link
      href={href}
      aria-current={actif ? "page" : undefined}
      className="rounded border px-3 py-2.5 transition-colors"
      style={{
        borderColor: actif ? "var(--comptoir-fg)" : "var(--adm-line)",
        background: actif ? "var(--comptoir-fg)" : "var(--adm-surface)",
        color: actif ? "var(--adm-surface)" : "inherit",
      }}
    >
      <span className="eyebrow flex items-center gap-1.5 text-[length:var(--adm-t-xs)] opacity-70">
        {teinte && (
          <span
            aria-hidden
            className="inline-block h-2 w-2 shrink-0 rounded-full"
            style={{ background: teinte }}
          />
        )}
        {label}
      </span>
      <span className="data mt-0.5 block text-[1.2rem]">{n}</span>
    </Link>
  );
}


/** Une paire étiquette / valeur, alignée avec ses voisines. */
function Info({
  label,
  children,
  large,
}: {
  label: string;
  children: React.ReactNode;
  large?: boolean;
}) {
  return (
    <div className={large ? "sm:col-span-2" : undefined}>
      <dt
        style={{
          fontSize: "var(--adm-t-xs)",
          color: "var(--adm-muted)",
          marginBottom: "2px",
        }}
      >
        {label}
      </dt>
      <dd style={{ fontSize: "var(--adm-t-md)", margin: 0 }}>{children}</dd>
    </div>
  );
}
