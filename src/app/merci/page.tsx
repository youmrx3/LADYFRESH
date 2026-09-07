import type { Metadata } from "next";
import { Merci } from "@/components/Merci";
import { getT } from "@/i18n/server";

/* La page suit la langue du site, elle ne peut donc pas être figée à la
   compilation : la confirmation serait rendue dans la langue du build. */
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return {
    title: t.commande.okEyebrow,
    /*
      Une confirmation n'a rien à faire dans un index : elle ne veut rien dire
      sans la commande qui la précède, et un moteur la servirait à froid.
    */
    robots: { index: false, follow: false },
  };
}

/**
 * L'adresse de confirmation.
 *
 * Elle existe pour deux choses : sortir l'événement Purchase de la course
 * avec la redirection WhatsApp, et donner à Meta une URL sur laquelle asseoir
 * une conversion personnalisée. Le détail est dans `Merci`.
 */
export default function PageMerci() {
  return <Merci />;
}
