/**
 * Les wilayas proposées à la commande.
 *
 * Saisie libre auparavant : « Alger », « alger », « Alger centre », « 16 » et
 * « Algiers » désignaient le même endroit sans qu'aucun tri ne soit possible.
 * Une liste fermée rend les commandes comparables — regrouper les livraisons
 * par zone suppose que la zone s'écrive toujours pareil.
 *
 * Le code est conservé avec le nom : c'est lui qui sert de repère pour les
 * tarifs de livraison, et il lève l'ambiguïté entre transcriptions.
 *
 * Note : les entrées 59 à 69 ne sont pas des wilayas au sens administratif —
 * ce sont des daïras (Aflou relève de Laghouat, Barika de Batna, Bou Saâda de
 * M'Sila…). Elles figurent ici parce qu'elles ont été demandées comme zones de
 * livraison, ce qui est un découpage commercial, pas administratif.
 */
export type Wilaya = { code: string; fr: string; ar: string };

export const WILAYAS: Wilaya[] = [
  { code: "01", fr: "Adrar", ar: "أدرار" },
  { code: "02", fr: "Chlef", ar: "الشلف" },
  { code: "03", fr: "Laghouat", ar: "الأغواط" },
  { code: "04", fr: "Oum El Bouaghi", ar: "أم البواقي" },
  { code: "05", fr: "Batna", ar: "باتنة" },
  { code: "06", fr: "Béjaïa", ar: "بجاية" },
  { code: "07", fr: "Biskra", ar: "بسكرة" },
  { code: "08", fr: "Béchar", ar: "بشار" },
  { code: "09", fr: "Blida", ar: "البليدة" },
  { code: "10", fr: "Bouira", ar: "البويرة" },
  { code: "11", fr: "Tamanrasset", ar: "تمنراست" },
  { code: "12", fr: "Tébessa", ar: "تبسة" },
  { code: "13", fr: "Tlemcen", ar: "تلمسان" },
  { code: "14", fr: "Tiaret", ar: "تيارت" },
  { code: "15", fr: "Tizi Ouzou", ar: "تيزي وزو" },
  { code: "16", fr: "Alger", ar: "الجزائر" },
  { code: "17", fr: "Djelfa", ar: "الجلفة" },
  { code: "18", fr: "Jijel", ar: "جيجل" },
  { code: "19", fr: "Sétif", ar: "سطيف" },
  { code: "20", fr: "Saïda", ar: "سعيدة" },
  { code: "21", fr: "Skikda", ar: "سكيكدة" },
  { code: "22", fr: "Sidi Bel Abbès", ar: "سيدي بلعباس" },
  { code: "23", fr: "Annaba", ar: "عنابة" },
  { code: "24", fr: "Guelma", ar: "قالمة" },
  { code: "25", fr: "Constantine", ar: "قسنطينة" },
  { code: "26", fr: "Médéa", ar: "المدية" },
  { code: "27", fr: "Mostaganem", ar: "مستغانم" },
  { code: "28", fr: "M'Sila", ar: "المسيلة" },
  { code: "29", fr: "Mascara", ar: "معسكر" },
  { code: "30", fr: "Ouargla", ar: "ورقلة" },
  { code: "31", fr: "Oran", ar: "وهران" },
  { code: "32", fr: "El Bayadh", ar: "البيض" },
  { code: "33", fr: "Illizi", ar: "إليزي" },
  { code: "34", fr: "Bordj Bou Arréridj", ar: "برج بوعريريج" },
  { code: "35", fr: "Boumerdès", ar: "بومرداس" },
  { code: "36", fr: "El Tarf", ar: "الطارف" },
  { code: "37", fr: "Tindouf", ar: "تندوف" },
  { code: "38", fr: "Tissemsilt", ar: "تيسمسيلت" },
  { code: "39", fr: "El Oued", ar: "الوادي" },
  { code: "40", fr: "Khenchela", ar: "خنشلة" },
  { code: "41", fr: "Souk Ahras", ar: "سوق أهراس" },
  { code: "42", fr: "Tipaza", ar: "تيبازة" },
  { code: "43", fr: "Mila", ar: "ميلة" },
  { code: "44", fr: "Aïn Defla", ar: "عين الدفلى" },
  { code: "45", fr: "Naâma", ar: "النعامة" },
  { code: "46", fr: "Aïn Témouchent", ar: "عين تموشنت" },
  { code: "47", fr: "Ghardaïa", ar: "غرداية" },
  { code: "48", fr: "Relizane", ar: "غليزان" },
  { code: "49", fr: "Timimoun", ar: "تيميمون" },
  { code: "50", fr: "Bordj Badji Mokhtar", ar: "برج باجي مختار" },
  { code: "51", fr: "Ouled Djellal", ar: "أولاد جلال" },
  { code: "52", fr: "Béni Abbès", ar: "بني عباس" },
  { code: "53", fr: "In Salah", ar: "عين صالح" },
  { code: "54", fr: "In Guezzam", ar: "عين قزام" },
  { code: "55", fr: "Touggourt", ar: "تقرت" },
  { code: "56", fr: "Djanet", ar: "جانت" },
  { code: "57", fr: "El M'Ghair", ar: "المغير" },
  { code: "58", fr: "El Meniaâ", ar: "المنيعة" },
  { code: "59", fr: "Aflou", ar: "أفلو" },
  { code: "60", fr: "Barika", ar: "بريكة" },
  { code: "61", fr: "El Kantara", ar: "القنطرة" },
  { code: "62", fr: "Bir El Ater", ar: "بئر العاتر" },
  { code: "63", fr: "El Aricha", ar: "العريشة" },
  { code: "64", fr: "Ksar Chellala", ar: "قصر الشلالة" },
  { code: "65", fr: "Aïn Oussara", ar: "عين وسارة" },
  { code: "66", fr: "Messaad", ar: "مسعد" },
  { code: "67", fr: "Ksar El Boukhari", ar: "قصر البخاري" },
  { code: "68", fr: "Bou Saâda", ar: "بوسعادة" },
  { code: "69", fr: "El Abiodh Sidi Cheikh", ar: "الأبيض سيدي الشيخ" },
];

/**
 * Ce qui est enregistré avec la commande, identique quelle que soit la langue
 * de la cliente. Le back-office et le message WhatsApp restent lisibles même
 * si la commande a été passée en arabe.
 */
export function valeurWilaya(w: Wilaya) {
  return `${w.code} — ${w.fr}`;
}

/** Ce qui s'affiche dans la liste, dans la langue en cours. */
export function libelleWilaya(w: Wilaya, locale: string) {
  return locale === "ar" ? `${w.code} — ${w.ar}` : valeurWilaya(w);
}
