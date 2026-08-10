/**
 * Dictionnaire de référence. Les autres langues sont typées d'après celui-ci,
 * donc une clé oubliée casse la compilation.
 */
export const fr = {
  meta: {
    title: "Lady Fresh — Brumes, gels intimes et déodorants",
    description:
      "Sept gammes de brumes parfumées, gels lavants intimes et déodorants. Vente au détail, en demi-gros dès 5 pièces et en gros par carton. Commande par WhatsApp.",
  },

  unites: {
    devise: "DA",
    piece: "pièce",
    pieces: "pièces",
    pieceCourt: "pc",
    carton: "carton",
    cartons: "cartons",
    cartonCourt: "ct",
  },

  couleurs: {
    Rouge: "Rouge",
    Rose: "Rose",
    Bordeaux: "Bordeaux",
    "Rose gold": "Rose gold",
    Violet: "Violet",
    Bleu: "Bleu",
    "Vert d'eau": "Vert d'eau",
  },

  achat: {
    gros: "Gros",
    demi_gros: "Demi-gros",
  },

  nav: {
    accueil: "Accueil",
    commander: "Comment commander",
    gammes: "Nos gammes",
    boutique: "Boutique",
    contact: "Contact",
    cta: "Commander",
    ouvrirMenu: "Ouvrir le menu",
    fermerMenu: "Fermer le menu",
    principale: "Principale",
    menuMobile: "Menu mobile",
    accueilAria: "Lady Fresh — accueil",
    theme: "Thème",
    themeClair: "Clair",
    themeSombre: "Sombre",
    langue: "Langue",
  },

  hero: {
    ctaBoutique: "Voir la boutique",
    ctaCommander: "Comment commander",
    statGammes: "Gammes",
    statReferences: "Références",
    index: "L'index",
    vitrineAria: "Gammes en vitrine",
  },

  commander: {
    eyebrow: "Comment commander",
    titre: "Trois étapes, et c'est envoyé.",
    etapes: [
      {
        titre: "Choisissez votre format",
        texte:
          "Gros par carton, ou demi-gros à partir de {min} pièces. Les prix de la boutique s'ajustent au format choisi.",
      },
      {
        titre: "Composez votre commande",
        texte:
          "Filtrez par produit ou par couleur, indiquez les quantités. Le récapitulatif se met à jour au fur et à mesure.",
      },
      {
        titre: "Envoyez-la",
        texte:
          "Un bouton ouvre WhatsApp avec votre commande déjà écrite. Pas de WhatsApp ? Le formulaire nous l'envoie directement.",
      },
    ],
  },

  gammes: {
    eyebrow: "Nos gammes",
    titre: "Sept couleurs, un même geste.",
    intro:
      "Chaque gamme porte un parfum et une couleur. Les formats changent d'une gamme à l'autre — le détail est dans la colonne.",
    voirBoutique: "Voir en boutique",
    aria: "Gamme {nom} — voir en boutique",
  },

  format: {
    eyebrow: "Votre format",
    titre: "Vous achetez en gros ou en demi-gros ?",
    lede: "Ce choix fixe les prix et l'unité de quantité pour toute la boutique. Vous pouvez en changer à tout moment.",
    aria: "Type d'achat",
    repere: "Brume 250 ml",
    alaPiece: "à la pièce",
    auCarton: "au carton",
    minDemi: "Dès {n} pièces",
    minGros: "Dès {n} carton par référence",
    minGrosPluriel: "Dès {n} cartons par référence",
    detailDemi:
      "Vous commandez à l'unité et mélangez librement les gammes. Le minimum porte sur l'ensemble de la commande.",
    detailGros:
      "Vous commandez par carton complet. Le meilleur tarif, appliqué à chaque pièce du carton.",
    indice:
      "Les prix affichés sont ceux du demi-gros. Choisissez « Gros » pour voir les tarifs par carton.",
  },

  boutique: {
    eyebrow: "Boutique",
    titre: "Le catalogue complet.",
    tarifs: "Tarifs {format}",
    reference: "référence",
    references: "références",
    filtreProduit: "Produit",
    filtreCouleur: "Couleur",
    tous: "Tous",
    toutes: "Toutes",
    toutAfficher: "Tout afficher",
    videTitre: "Aucune référence dans ce filtre.",
    videTexte: "Essayez une autre couleur, ou affichez tout le catalogue.",
    parPiece: "/ pièce",
    cartonDe: "Carton de {n} = {prix}",
    ajouterCarton: "+ 1 carton",
    ajouterPieces: "+ {n} pièces",
    formatAria: "Format",
    quantiteAria: "Quantité en {unite}",
    retirerUne: "Retirer une unité",
    ajouterUne: "Ajouter une unité",
    egale: "= {n} pièces",
    barreCommander: "Commander",
  },

  commande: {
    eyebrow: "Votre commande",
    titre: "Le récapitulatif.",
    toutVider: "Tout vider",
    videTitre: "Rien pour l'instant.",
    videTexte:
      "Ajoutez des références depuis la boutique, elles s'empilent ici.",
    videCta: "Aller à la boutique",
    colRef: "Référence",
    colQte: "Qté",
    colPu: "P.U.",
    colTotal: "Total",
    parCarton: "{n} pc/carton",
    retirer: "Retirer {nom}",
    quantiteLigne: "Quantité — {nom}",
    envoyer: "Envoyer la commande",
    nom: "Nom",
    telephone: "Téléphone",
    wilaya: "Wilaya",
    adresse: "Adresse de livraison",
    note: "Note",
    whatsapp: "Commander via WhatsApp",
    whatsappPrep: "Préparation…",
    whatsappAide: "Ouvre WhatsApp avec le récapitulatif déjà écrit.",
    sansWhatsapp: "Pas de WhatsApp ? Envoyer par formulaire",
    envoyerForm: "Envoyer la commande",
    envoiEnCours: "Envoi…",
    formAide: "Nom et téléphone sont nécessaires pour vous rappeler.",
    manqueGros: "Chaque référence doit atteindre {n} carton.",
    manqueGrosPluriel: "Chaque référence doit atteindre {n} cartons.",
    manqueDemi: "Le demi-gros démarre à {n} pièces. Il en manque {reste}.",
    piedDePage:
      "Toutes les commandes, WhatsApp ou formulaire, arrivent dans le même suivi. Une question avant de commander ?",
    reseau: "Connexion interrompue. Vérifiez votre réseau et réessayez.",
    envoiImpossible: "Envoi impossible.",
    okEyebrow: "Commande enregistrée",
    okTitre: "C'est noté. Réf.",
    okWhatsapp:
      "WhatsApp s'est ouvert avec votre récapitulatif. Envoyez le message pour confirmer — nous vous rappelons pour la livraison.",
    okForm:
      "Nous avons reçu votre commande et nous vous rappelons sur le numéro indiqué pour confirmer la livraison.",
    okCta: "Passer une autre commande",
  },

  videos: {
    eyebrow: "Pourquoi nous choisir",
    titre: "La preuve, en mouvement.",
    intro:
      "Les produits en situation, filmés pour nos revendeurs et nos clientes.",
    lire: "Lire la vidéo : {titre}",
  },

  appel: {
    titre: "Prête à commander ?",
    lede: "Demi-gros dès {min} pièces, gros au carton. Composez votre commande, envoyez-la, on s'occupe du reste.",
    cta: "Composer ma commande",
    ctaWhatsapp: "Nous écrire sur WhatsApp",
  },

  footer: {
    tagline:
      "Brumes parfumées, gels lavants intimes et déodorants. Fabriqués pour la fraîcheur qui tient toute la journée.",
    site: "Le site",
    contact: "Contact",
    liensRapides: "Liens rapides",
    formats: "Gros & demi-gros",
    droits: "Tous droits réservés",
    gestion: "Espace gestion",
  },

  api: {
    /* Le francais insere une espace fine avant le deux-points, pas les autres. */
    sep: " : ",
    tropDeCommandes: "Trop de commandes envoyées depuis cette connexion. Réessayez plus tard.",
    illisible: "Requête illisible.",
    vide: "Votre commande est vide.",
    aucuneRef: "Aucune référence valide dans la commande.",
    minDemi:
      "Le demi-gros démarre à {min} pièces. Votre commande en compte {n}.",
    minGros: "Le gros démarre à {min} carton par référence.",
    nomTel: "Indiquez au moins votre nom et votre téléphone.",
    echec: "La commande n'a pas pu être enregistrée. Réessayez.",
    bonjour: "Bonjour Lady Fresh, je souhaite passer commande.",
    ref: "Réf.",
    format: "Format",
    total: "Total",
    nom: "Nom",
    telephone: "Téléphone",
    wilaya: "Wilaya",
    note: "Note",
  },

  statuts: {
    nouvelle: "Nouvelle",
    en_cours: "En cours",
    traitee: "Traitée",
    livree: "Livrée",
  },

  admin: {
    gestion: "Gestion",
    seDeconnecter: "Se déconnecter",
    connexion: "Connexion",
    espaceGestion: "Espace gestion",
    motDePasse: "Mot de passe",
    entrer: "Entrer",
    verification: "Vérification…",
    retourSite: "← Retour au site",
    pasDeMotDePasse:
      "Aucun mot de passe n'est configuré. En local : ajoutez ADMIN_PASSWORD dans .env.local, puis relancez le serveur. En ligne : ajoutez-le aux variables d'environnement de l'hébergeur, puis « Redeploy » — une variable ajoutée après coup ne s'applique qu'au déploiement suivant.",
    baseAbsente:
      "Base de données non connectée — les modifications ne sont pas enregistrées.",
    baseAbsenteAide:
      "Exécutez supabase/schema.sql puis renseignez les clés Supabase dans .env.local, ou dans les variables d'environnement de l'hébergeur suivies d'un « Redeploy ». Le site affiche en attendant le catalogue de référence.",

    onglets: {
      courts: {
        commandes: "Commandes",
        types: "Types",
        gammes: "Gammes",
        produits: "Produits",
        formats: "Formats",
        contenu: "Contenu",
      },
      commandes: "Commandes",
      gammes: "Gammes",
      produits: "Produits",
      types: "Types de produits",
      formats: "Formats & prix",
      contenu: "Contenu du site",
    },

    commandes: {
      suivi: "Suivi",
      titre: "Commandes",
      total: "{n} au total",
      vide: "Aucune commande pour l'instant. Les commandes WhatsApp et formulaire arrivent toutes ici.",
      statut: "Statut",
      supprimer: "Supprimer la commande",
      confirmSuppr: "Supprimer définitivement la commande {ref} ? Cette action est irréversible.",
      mettreAJour: "Mettre à jour",
      clientAbsent: "Client non renseigné",
      adresse: "Adresse",
      note: "Note",
      canalWhatsapp: "WhatsApp",
      canalForm: "Formulaire",
      filtreTous: "Toutes",
    },

    commun: {
      enregistrer: "Enregistrer",
      creer: "Créer",
      ajouter: "Ajouter",
      supprimer: "Supprimer",
      annuler: "Annuler",
      modifier: "Modifier",
      fermer: "Fermer",
      nom: "Nom",
      slug: "Slug",
      ordre: "Ordre",
      visible: "Visible",
      actif: "Actif",
      masque: "masqué",
      image: "Image",
      couleur: "Couleur",
      description: "Description",
      titreChamp: "Titre",
      rechercher: "Rechercher",
      aucunResultat: "Aucun résultat.",
      enCours: "…",
      traductions: "Traductions",
      arabe: "Arabe",
      anglais: "Anglais",
      langueEditee: "Langue éditée",
      choisirFichier: "Choisir un fichier",
      televersement: "Envoi…",
      retirerImage: "Retirer l'image",
      aucuneImage: "Aucune image",
      ouCollerUrl: "ou collez une adresse",
      apercu: "Aperçu",
      obligatoire: "obligatoire",
      videFrRepris: "Vide = le français est repris.",
    },

    types: {
      titre: "Types de produits",
      nouveau: "Nouveau type",
      aide: "Les types classent le catalogue et alimentent le filtre « Produit » de la boutique. Un type utilisé par des produits ne peut pas être supprimé.",
      nom: "Nom complet",
      nomCourt: "Nom court (filtre)",
      confirmSuppr: "Supprimer le type « {nom} » ?",
      utilise: "{n} produit utilise ce type",
      utilisePluriel: "{n} produits utilisent ce type",
      inutilise: "Aucun produit",
      encoreUtilise:
        "Ce type est encore utilisé par {n} produit(s). Changez leur type avant de le supprimer.",
    },
    formats: {
      titre: "Formats & prix",
      nouveau: "Nouveau format",
      aide: "Choisissez le produit, puis ajoutez-lui un format avec son prix et sa photo. Un produit sans format n'apparaît pas en boutique.",
      demiCourt: "Demi-gros",
      grosCourt: "Gros",
      produit: "Produit",
      choisirProduit: "Choisissez un produit",
      aucunFormat: "Aucun format — ce produit n'est pas en vente.",
      total: "{n} format sur {p} produits",
      totalPluriel: "{n} formats sur {p} produits",
    },
    gammes: {
      catalogue: "Catalogue",
      titre: "Gammes",
      nouvelle: "Nouvelle gamme",
      aide: "Les gammes ordonnent la bande horizontale de la page d'accueil. La couleur sert aussi de filtre dans la boutique.",
      surtitre: "Surtitre",
      nomCouleur: "Nom de la couleur (filtre)",
      couverture: "Image de couverture",
      produits: "{n} produit",
      produitsPluriel: "{n} produits",
      confirmSuppr:
        "Supprimer la gamme « {nom} » et tous ses produits ?",
      amorcer: "Amorcer la base",
      amorcage: "Amorçage…",
      confirmAmorcer:
        "Copier le catalogue de référence dans Supabase ?",
    },

    produits: {
      titre: "Produits",
      nouveau: "Nouveau produit",
      aide: "Un produit porte un ou plusieurs formats. Le prix, la photo et le nombre de pièces par carton se règlent par format.",
      seuils:
        "Seuils : gros dès {gros} carton, demi-gros dès {demi} pièces.",
      type: "Type",
      gamme: "Gamme",
      couleurFiltre: "Couleur (filtre)",
      teinte: "Teinte",
      imageDefaut: "Image par défaut",
      formats: "Formats et prix",
      format: "Format",
      prixDemi: "Demi-gros ({devise})",
      prixGros: "Gros ({devise})",
      parCarton: "Pièces / carton",
      photo: "Photo",
      ajouterFormat: "Ajouter un format",
      supprimerFormat: "Supprimer ce format",
      confirmSupprFormat: "Supprimer le format {format} ?",
      confirmSuppr: "Supprimer « {nom} » et ses formats ?",
      nbFormats: "{n} format",
      nbFormatsPluriel: "{n} formats",
      cartonEgale: "Carton de {n} = {prix} en gros",
      dabordProduit:
        "Créez d'abord le produit, puis ajoutez-lui ses formats.",
    },

    contenu: {
      langueSite: "Langue du site",
      langueSiteAide:
        "Vitrine et back-office suivent ce choix. Les visiteurs ne peuvent pas en changer.",
      appliquer: "Appliquer",
      reglages: "Réglages",
      titre: "Contenu du site",
      commandeContact: "Commande et contact",
      numeroWhatsapp: "Numéro WhatsApp (indicatif compris)",
      minGros: "Minimum gros (cartons)",
      minDemi: "Minimum demi-gros (pièces)",
      telephoneAffiche: "Téléphone affiché",
      email: "E-mail",
      adresse: "Adresse",
      textesHero: "Textes du hero",
      surtitre: "Surtitre",
      titreHero: "Titre (un retour à la ligne = deuxième ligne, en or)",
      accroche: "Accroche",
      enregistrerReglages: "Enregistrer les réglages",
      fichiers: "Fichiers",
      fichiersAide:
        "Envoyez une image ou une vidéo, puis collez l'adresse obtenue dans le champ concerné.",
      televerser: "Téléverser un fichier",
      televersement: "Téléverser",
      envoi: "Envoi…",
      envoye: "Envoyé. Copiez cette adresse dans le champ voulu :",
      televersementInactif:
        "Le téléversement demande Supabase. En attendant, déposez vos fichiers dans public/ et indiquez le chemin, par exemple /videos/ma-video.mp4.",
      slideshow: "Slideshow du hero",
      slideshowAide:
        "Chaque visuel est rattaché à une gamme : sa couleur teinte le hero pendant l'affichage.",
      legende: "Légende",
      ajouterVisuel: "Ajouter un visuel",
      confirmSupprVisuel: "Supprimer ce visuel ?",
      videosTitre: "Vidéos « Pourquoi nous choisir »",
      videosAide:
        "{n} vidéo en ligne. La section s'adapte au nombre : ajoutez-en jusqu'à quatre.",
      videosAidePluriel:
        "{n} vidéos en ligne. La section s'adapte au nombre : ajoutez-en jusqu'à quatre.",
      sousTitre: "Sous-titre",
      fichierVideo: "Fichier vidéo",
      imageAttente: "Image d'attente",
      ajouterVideo: "Ajouter une vidéo",
      confirmSupprVideo: "Supprimer cette vidéo ?",
    },
  },
} as const;

/** Élargit les types littéraux de `as const` pour que ar et en s'y conforment. */
type Widen<T> = T extends string
  ? string
  : T extends readonly (infer U)[]
    ? readonly Widen<U>[]
    : { readonly [K in keyof T]: Widen<T[K]> };

export type Dictionary = Widen<typeof fr>;
