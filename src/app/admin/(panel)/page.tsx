import Link from "next/link";
import { Envoyer, FormAction } from "@/components/admin/Champs";
import { EnTetePage } from "@/components/admin/Volet";
import { changerStatutCommande, supprimerCommande } from "@/lib/actions";
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
          <p className="data text-[13px] text-graphite-doux">
            {fill(t.admin.commandes.total, { n: orders.length })}
          </p>
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
        <p className="mt-8 rounded border border-dashed border-trait px-6 py-16 text-center text-[15px] text-graphite-doux">
          {t.admin.commandes.vide}
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {visibles.map((order) => (
            <li
              key={order.id}
              className="overflow-hidden rounded-[10px] border border-trait"
              style={{ background: "var(--comptoir-surface)" }}
            >
              <details>
                <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-2 p-4">
                  <span
                    aria-hidden
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: TEINTE[order.status] }}
                  />
                  <span className="data text-[14px]">{order.ref}</span>
                  {/*
                    La pastille ne s'affiche plus que sur les commandes d'avant :
                    tout arrive maintenant par le site, la mention serait la
                    même sur chaque ligne.
                  */}
                  {order.channel === "whatsapp" && (
                    <span className="eyebrow rounded-full border border-trait px-2 py-0.5 text-[9.5px] text-graphite-doux">
                      {t.admin.commandes.canalWhatsapp}
                    </span>
                  )}
                  <span className="eyebrow rounded-full border border-trait px-2 py-0.5 text-[9.5px] text-graphite-doux">
                    {t.achat[order.purchase_type]}
                  </span>
                  {order.source && (
                    <span
                      className="eyebrow rounded-full px-2 py-0.5 text-[9.5px]"
                      style={{
                        background: "color-mix(in srgb, var(--or-plein) 22%, transparent)",
                        color: "var(--or-trait)",
                      }}
                    >
                      {order.source}
                    </span>
                  )}
                  <span className="min-w-0 flex-1 truncate text-[13.5px] text-graphite-doux">
                    {order.customer_name || t.admin.commandes.clientAbsent}
                  </span>
                  <span className="data text-[15px]">
                    {da(order.total, t.unites.devise)}
                  </span>
                </summary>

                <div className="border-t border-trait">
                  <div className="flex flex-wrap items-end justify-between gap-4 px-4 py-3">
                    <div className="text-[13px] text-graphite-doux">
                      <p className="data">
                        {formatDate(order.created_at, HTML_LANG[locale])}
                      </p>
                      {order.phone && (
                        <a
                          href={`tel:${order.phone.replace(/\s/g, "")}`}
                          dir="ltr"
                          className="data inline-block underline underline-offset-2"
                        >
                          {order.phone}
                        </a>
                      )}
                      {order.wilaya && <span> · {order.wilaya}</span>}
                    </div>

                    <FormAction
                      action={changerStatutCommande}
                      className="flex items-end gap-2"
                    >
                      <input type="hidden" name="id" value={order.id} />
                      <label className="block">
                        <span className="etiquette">
                          {t.admin.commandes.statut}
                        </span>
                        <select
                          name="status"
                          defaultValue={order.status}
                          className="champ !w-auto !py-2 !text-[13px]"
                        >
                          {STATUTS.map((s) => (
                            <option key={s} value={s}>
                              {t.statuts[s]}
                            </option>
                          ))}
                        </select>
                      </label>
                      <Envoyer>{t.admin.commandes.mettreAJour}</Envoyer>
                    </FormAction>

                    {/* Irréversible : la confirmation rappelle la référence. */}
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
                  </div>

                  <ul className="divide-y divide-trait border-t border-trait">
                    {order.items?.map((item, i) => (
                      <li
                        key={item.id || `${item.product_name}-${i}`}
                        className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-2.5"
                      >
                        <span className="text-[14px]">
                          {item.product_name}{" "}
                          <span className="data text-[12px] text-graphite-doux">
                            {item.size_label}
                          </span>
                        </span>
                        <span className="data text-[13px] text-graphite-doux">
                          {item.quantity}{" "}
                          {order.purchase_type === "gros"
                            ? t.unites.cartons
                            : t.unites.pieces}{" "}
                          × {da(item.unit_price, t.unites.devise)}
                        </span>
                        <span className="data text-[14px]">
                          {da(item.line_total, t.unites.devise)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {(order.address || order.note) && (
                    <div className="border-t border-trait bg-comptoir px-4 py-3 text-[13px] text-graphite-doux">
                      {order.address && (
                        <p>
                          {t.admin.commandes.adresse}{t.api.sep}{order.address}
                        </p>
                      )}
                      {order.note && (
                        <p>
                          {t.admin.commandes.note}{t.api.sep}{order.note}
                        </p>
                      )}
                    </div>
                  )}
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
        borderColor: actif ? "var(--comptoir-fg)" : "var(--comptoir-line)",
        background: actif ? "var(--comptoir-fg)" : "var(--comptoir-surface)",
        color: actif ? "var(--comptoir-surface)" : "inherit",
      }}
    >
      <span className="eyebrow flex items-center gap-1.5 text-[9.5px] opacity-70">
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
