import { Bascule, Envoyer, FormAction } from "@/components/admin/Champs";
import { CarteSection, EnTetePage, PiedFormulaire } from "@/components/admin/Volet";
import { enregistrerLivraison } from "@/lib/actions";
import { getSettings, getTarifsAdmin } from "@/lib/data";
import { getT } from "@/i18n/server";
import { WILAYAS } from "@/lib/wilayas";

export const dynamic = "force-dynamic";

/*
  Cinquante-huit wilayas, deux prix chacune, un seul enregistrement.

  Un écran par wilaya ferait cinquante-huit allers-retours pour poser une
  grille qui se décide en une fois, en recopiant le tarif du transporteur. La
  page est donc un unique formulaire : on remplit, on enregistre, c'est fini.

  Rien n'est facturé tant que l'interrupteur du haut est éteint — et tant qu'il
  l'est, le choix stop desk / domicile n'apparaît nulle part sur le site.
*/
export default async function Livraison() {
  const { t } = await getT();
  const [tarifs, reglages] = await Promise.all([getTarifsAdmin(), getSettings()]);
  const l = t.admin.livraison;

  const parCode = new Map(tarifs.map((x) => [x.wilaya_code, x]));

  return (
    <div>
      <EnTetePage eyebrow={l.eyebrow} titre={l.titre} aide={l.aide} />

      <FormAction action={enregistrerLivraison} garderOuvert>
        <div className="space-y-4">
          <CarteSection titre={l.activer} aide={l.activerAide}>
            <Bascule
              label={l.activer}
              name="livraison_active"
              defaultChecked={reglages.livraison_active}
            />
          </CarteSection>

          <CarteSection titre={l.titre}>
            {/*
              Une ligne par wilaya, pas un tableau : sur un téléphone, un
              tableau à quatre colonnes se lit à la loupe ou se fait défiler
              latéralement, et on perd de vue la wilaya qu'on est en train de
              remplir.
            */}
            <ul className="divide-y" style={{ borderColor: "var(--adm-line)" }}>
              {WILAYAS.map((w) => {
                const tarif = parCode.get(w.code);
                return (
                  <li
                    key={w.code}
                    className="grid grid-cols-2 items-end gap-3 py-3 sm:grid-cols-[minmax(0,1fr)_7rem_7rem_auto]"
                    style={{ borderColor: "var(--adm-line)" }}
                  >
                    <p
                      className="col-span-2 sm:col-span-1"
                      style={{ fontSize: "var(--adm-t-md)" }}
                    >
                      <span className="data" style={{ color: "var(--adm-muted)" }}>
                        {w.code}
                      </span>{" "}
                      {w.fr}
                    </p>

                    <Prix
                      name={`sd_${w.code}`}
                      label={l.gabarit}
                      defaultValue={tarif?.stopdesk}
                      devise={t.unites.devise}
                    />
                    <Prix
                      name={`dom_${w.code}`}
                      label={l.gabaritDom}
                      defaultValue={tarif?.domicile}
                      devise={t.unites.devise}
                    />

                    <label
                      className="col-span-2 flex cursor-pointer items-center gap-2 sm:col-span-1"
                      style={{
                        fontSize: "var(--adm-t-sm)",
                        color: "var(--adm-muted)",
                        minHeight: "var(--adm-h)",
                      }}
                    >
                      <input
                        type="checkbox"
                        name={`on_${w.code}`}
                        defaultChecked={tarif ? tarif.active : true}
                        className="h-4.5 w-4.5"
                        style={{ height: "1.125rem", width: "1.125rem" }}
                      />
                      {l.desservie}
                    </label>
                  </li>
                );
              })}
            </ul>
          </CarteSection>
        </div>

        <PiedFormulaire>
          <Envoyer variante="principal">{l.enregistrer}</Envoyer>
        </PiedFormulaire>
      </FormAction>
    </div>
  );
}

function Prix({
  name,
  label,
  defaultValue,
  devise,
}: {
  name: string;
  label: string;
  defaultValue?: number;
  devise: string;
}) {
  return (
    <div>
      <label className="adm-etiquette" htmlFor={name}>
        {label}
      </label>
      <div className="relative">
        <input
          id={name}
          name={name}
          type="number"
          min={0}
          step={50}
          inputMode="numeric"
          defaultValue={defaultValue ? String(defaultValue) : ""}
          placeholder="0"
          className="adm-champ"
          style={{ paddingInlineEnd: "2.6rem" }}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute top-1/2 -translate-y-1/2"
          style={{
            insetInlineEnd: "0.7rem",
            fontSize: "var(--adm-t-xs)",
            color: "var(--adm-muted)",
          }}
        >
          {devise}
        </span>
      </div>
    </div>
  );
}
