import Link from "next/link";
import { Envoyer, FormAction } from "@/components/admin/Champs";
import { EnTetePage } from "@/components/admin/Volet";
import {
  changerStatutCommande,
  supprimerCommande,
  testerEmail,
} from "@/lib/actions";
import { PAR_PAGE, compterCommandes, getOrders } from "@/lib/data";
import { da, formatDate } from "@/lib/format";
import { fill } from "@/i18n";
import { HTML_LANG } from "@/i18n/config";
import { getT } from "@/i18n/server";
import type { OrderStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

/*
  Trois états, plus quatre.

  « en cours, traitée, livrée » décrivait un travail qui se fait ailleurs : une
  fois la commande confirmée au téléphone, c'est le transporteur qui la suit.
  Ce qui se décide ici tient en un geste — confirmer — plus le cas du retour,
  qu'on veut pouvoir compter.
*/
const STATUTS: OrderStatus[] = ["nouvelle", "confirmee", "retour"];

const TEINTE: Record<string, string> = {
  nouvelle: "#c4102b",
  confirmee: "#2f8f5b",
  retour: "#b8860b",
  // Anciennes valeurs : encore portées par des commandes d'avant la migration.
  en_cours: "#b8860b",
  traitee: "#2e7d9a",
  livree: "#2f8f5b",
};

export default async function Commandes({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string; page?: string }>;
}) {
  const { t, locale } = await getT();
  const { statut, page } = await searchParams;

  const filtre = STATUTS.includes(statut as OrderStatus)
    ? (statut as OrderStatus)
    : undefined;
  const p = Math.max(0, Number(page) || 0);

  const [{ orders, total }, compteurs] = await Promise.all([
    getOrders({ page: p, statut: filtre }),
    compterCommandes(),
  ]);

  const a = t.admin.commandes;
  const pages = Math.ceil(total / PAR_PAGE);

  const lien = (n: number) => {
    const q = new URLSearchParams();
    if (filtre) q.set("statut", filtre);
    if (n > 0) q.set("page", String(n));
    const s = q.toString();
    return s ? `/admin?${s}` : "/admin";
  };

  return (
    <div>
      <EnTetePage
        eyebrow={a.suivi}
        titre={a.titre}
        action={
          <div className="flex flex-wrap items-center gap-2">
            {/*
              L'export part vers la société de livraison : on ne lui envoie que
              ce qui est bon à expédier, donc les confirmées seules.
            */}
            <a
              href="/admin/export"
              className="adm-btn adm-btn-neutre"
              style={{ textDecoration: "none" }}
            >
              {a.exporter}
            </a>
            <FormAction action={testerEmail} garderOuvert>
              <Envoyer variante="discret">{a.testerEmail}</Envoyer>
            </FormAction>
          </div>
        }
      />

      {/* Les compteurs servent aussi de filtre : un clic, pas de menu. */}
      <nav className="flex flex-wrap gap-2">
        <Onglet
          href="/admin"
          actif={!filtre}
          label={a.filtreTous}
          n={compteurs.tous ?? total}
        />
        {STATUTS.map((s) => (
          <Onglet
            key={s}
            href={`/admin?statut=${s}`}
            actif={filtre === s}
            label={t.statuts[s]}
            n={compteurs[s] ?? 0}
            teinte={TEINTE[s]}
          />
        ))}
      </nav>

      {orders.length === 0 ? (
        <p className="adm-vide mt-6">{a.vide}</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {orders.map((order) => (
            <li key={order.id} className="adm-carte overflow-hidden">
              <details className="group">
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
                        style={{
                          fontSize: "var(--adm-t-sm)",
                          color: "var(--adm-muted)",
                        }}
                      >
                        {order.customer_name || a.clientAbsent}
                      </span>
                    </span>
                    <span
                      className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1"
                      style={{
                        fontSize: "var(--adm-t-xs)",
                        color: "var(--adm-muted)",
                      }}
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
                  {/* ------------------------------------------ la cliente */}
                  <div className="p-4">
                    <p className="adm-etiquette">{a.client}</p>
                    <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                      <Info label={t.commande.nom}>
                        {order.customer_name || "—"}
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
                          "—"
                        )}
                      </Info>
                      <Info label={t.commande.wilaya}>{order.wilaya || "—"}</Info>
                      <Info label={a.adresse}>{order.address || "—"}</Info>
                      {order.livraison_mode && (
                        <Info label={a.livraison}>
                          {order.livraison_mode === "stopdesk"
                            ? t.livraison.stopdesk
                            : t.livraison.domicile}
                          {order.livraison_prix > 0 &&
                            ` — ${da(order.livraison_prix, t.unites.devise)}`}
                        </Info>
                      )}
                      {order.note && (
                        <Info label={a.note} large>
                          {order.note}
                        </Info>
                      )}
                    </dl>
                  </div>

                  {/* ------------------------------------------- le contenu */}
                  <div
                    className="border-t p-4"
                    style={{ borderColor: "var(--adm-line)" }}
                  >
                    <p className="adm-etiquette">{a.articles}</p>
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
                        <span className="adm-etiquette mb-0">{a.totalLigne}</span>
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
                    Un seul geste par état, et la suppression à l'autre bout :
                    on ne veut pas la frôler en confirmant une commande.
                  */}
                  <div
                    className="flex flex-wrap items-center gap-2 border-t p-4"
                    style={{
                      borderColor: "var(--adm-line)",
                      background: "var(--adm-surface-2)",
                    }}
                  >
                    {order.status !== "confirmee" && (
                      <Statut
                        id={order.id}
                        valeur="confirmee"
                        libelle={a.confirmer}
                        variante="principal"
                      />
                    )}
                    {order.status !== "nouvelle" && (
                      <Statut
                        id={order.id}
                        valeur="nouvelle"
                        libelle={a.remettreNouvelle}
                      />
                    )}
                    {order.status !== "retour" && (
                      <Statut id={order.id} valeur="retour" libelle={a.marquerRetour} />
                    )}

                    <span className="ms-auto">
                      <FormAction action={supprimerCommande}>
                        <input type="hidden" name="id" value={order.id} />
                        <Envoyer
                          variante="danger"
                          confirmer={fill(a.confirmSuppr, { ref: order.ref })}
                        >
                          {a.supprimer}
                        </Envoyer>
                      </FormAction>
                    </span>
                  </div>
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}

      {/*
        La pagination n'est pas un ornement : le plafond précédent était de trois
        cents lignes, et tout ce qui dépassait disparaissait sans le dire.
      */}
      {pages > 1 && (
        <nav
          className="mt-6 flex items-center justify-between gap-3"
          aria-label={a.pages}
        >
          <PageLien href={lien(p - 1)} actif={p > 0} libelle={a.precedente} />
          <span className="adm-aide">
            {fill(a.pageSur, { n: p + 1, total: pages })}
          </span>
          <PageLien
            href={lien(p + 1)}
            actif={p + 1 < pages}
            libelle={a.suivante}
          />
        </nav>
      )}
    </div>
  );
}

function Statut({
  id,
  valeur,
  libelle,
  variante,
}: {
  id: string;
  valeur: OrderStatus;
  libelle: string;
  variante?: "principal" | "neutre";
}) {
  return (
    <FormAction action={changerStatutCommande}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={valeur} />
      <Envoyer variante={variante ?? "neutre"}>{libelle}</Envoyer>
    </FormAction>
  );
}

function PageLien({
  href,
  actif,
  libelle,
}: {
  href: string;
  actif: boolean;
  libelle: string;
}) {
  if (!actif)
    return (
      <span className="adm-btn adm-btn-neutre" style={{ opacity: 0.4 }}>
        {libelle}
      </span>
    );
  return (
    <Link href={href} className="adm-btn adm-btn-neutre" style={{ textDecoration: "none" }}>
      {libelle}
    </Link>
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
      className={`adm-btn ${actif ? "adm-btn-principal" : "adm-btn-neutre"}`}
      style={{ borderRadius: "999px", textDecoration: "none" }}
    >
      {teinte && (
        <span
          aria-hidden
          className="inline-block h-2 w-2 shrink-0 rounded-full"
          style={{ background: actif ? "currentColor" : teinte }}
        />
      )}
      {label}
      <span className="data" style={{ opacity: 0.7 }}>
        {n}
      </span>
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
