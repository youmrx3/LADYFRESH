import { Envoyer, FormAction } from "@/components/admin/Champs";
import { changerStatutCommande } from "@/lib/actions";
import { getOrders } from "@/lib/data";
import { da, formatDate, purchaseLabel, quantityUnit } from "@/lib/format";
import { ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const TEINTE: Record<OrderStatus, string> = {
  nouvelle: "#c4102b",
  en_cours: "#cba53c",
  traitee: "#2e9daf",
  livree: "#2f8f5b",
};

export default async function Commandes() {
  const orders = await getOrders();

  const compte = (statut: OrderStatus) =>
    orders.filter((o) => o.status === statut).length;

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-graphite-doux">Suivi</p>
          <h1 className="display display-l mt-2">Commandes</h1>
        </div>
        <p className="data text-[13px] text-graphite-doux">
          {orders.length} au total
        </p>
      </header>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(Object.keys(ORDER_STATUS_LABEL) as OrderStatus[]).map((statut) => (
          <div
            key={statut}
            className="rounded border border-trait bg-porcelaine-haut px-4 py-3"
          >
            <p className="eyebrow flex items-center gap-1.5 text-graphite-doux">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: TEINTE[statut] }}
              />
              {ORDER_STATUS_LABEL[statut]}
            </p>
            <p className="data mt-1 text-[1.35rem]">{compte(statut)}</p>
          </div>
        ))}
      </div>

      {orders.length === 0 ? (
        <p className="mt-10 rounded border border-dashed border-trait px-6 py-16 text-center text-[15px] text-graphite-doux">
          Aucune commande pour l&apos;instant. Les commandes WhatsApp et
          formulaire arrivent toutes ici.
        </p>
      ) : (
        <ul className="mt-8 space-y-4">
          {orders.map((order) => (
            <li
              key={order.id}
              className="overflow-hidden rounded-[10px] border border-trait bg-porcelaine-haut"
            >
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-trait px-5 py-4">
                <div>
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="data text-[15px]">{order.ref}</span>
                    <span
                      className="eyebrow rounded-full px-2 py-0.5 text-[9.5px] text-white"
                      style={{ background: TEINTE[order.status] }}
                    >
                      {ORDER_STATUS_LABEL[order.status]}
                    </span>
                    <span className="eyebrow rounded-full border border-trait px-2 py-0.5 text-[9.5px] text-graphite-doux">
                      {order.channel === "whatsapp" ? "WhatsApp" : "Formulaire"}
                    </span>
                    <span className="eyebrow rounded-full border border-trait px-2 py-0.5 text-[9.5px] text-graphite-doux">
                      {purchaseLabel(order.purchase_type)}
                    </span>
                  </p>
                  <p className="mt-1.5 text-[14px]">
                    {order.customer_name || "Client non renseigné"}
                    {order.phone && (
                      <a
                        href={`tel:${order.phone.replace(/\s/g, "")}`}
                        className="data ml-2 text-graphite-doux underline underline-offset-2"
                      >
                        {order.phone}
                      </a>
                    )}
                  </p>
                  <p className="data mt-0.5 text-[12px] text-graphite-doux">
                    {formatDate(order.created_at)}
                    {order.wilaya && ` · ${order.wilaya}`}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <span className="data text-[1.2rem]">{da(order.total)}</span>
                  <FormAction
                    action={changerStatutCommande}
                    className="flex items-end gap-2"
                  >
                    <input type="hidden" name="id" value={order.id} />
                    <label className="block">
                      <span className="etiquette">Statut</span>
                      <select
                        name="status"
                        defaultValue={order.status}
                        className="champ !w-auto !py-2 !text-[13px]"
                      >
                        {(Object.keys(ORDER_STATUS_LABEL) as OrderStatus[]).map(
                          (s) => (
                            <option key={s} value={s}>
                              {ORDER_STATUS_LABEL[s]}
                            </option>
                          ),
                        )}
                      </select>
                    </label>
                    <Envoyer>Mettre à jour</Envoyer>
                  </FormAction>
                </div>
              </div>

              <table className="w-full">
                <tbody className="divide-y divide-trait">
                  {order.items?.map((item) => (
                    <tr key={item.id || `${item.product_name}${item.size_label}`}>
                      <td className="px-5 py-2.5 text-[14px]">
                        {item.product_name}
                        <span className="data ml-2 text-[12px] text-graphite-doux">
                          {item.size_label}
                        </span>
                      </td>
                      <td className="data px-3 py-2.5 text-right text-[13px] text-graphite-doux">
                        {item.quantity}{" "}
                        {quantityUnit(order.purchase_type, item.quantity)}
                      </td>
                      <td className="data px-3 py-2.5 text-right text-[13px] text-graphite-doux">
                        {da(item.unit_price)}
                      </td>
                      <td className="data px-5 py-2.5 text-right text-[14px]">
                        {da(item.line_total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {(order.address || order.note) && (
                <div className="border-t border-trait bg-porcelaine/60 px-5 py-3 text-[13px] text-graphite-doux">
                  {order.address && <p>Adresse : {order.address}</p>}
                  {order.note && <p>Note : {order.note}</p>}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
