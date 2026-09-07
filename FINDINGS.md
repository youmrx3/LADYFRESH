# FINDINGS — Lady Fresh

**Phase 1 (lecture seule).** Aucun fichier du projet n'a été modifié.
Date : 2026-09-07 · Branche : `main` (propre au démarrage)

- **Projet :** Lady Fresh — vitrine + page de campagne + back-office
- **Pile :** Next.js 15.5 (App Router) · React 19 · TypeScript 5.7 · Tailwind 4 · Supabase
  (pas de shadcn/ui : les composants d'interface sont écrits à la main sur une couche `.adm-*`)
- **Langues :** `fr` · `ar` · `en` — défaut `fr`
- **Routes d'administration :** `src/app/admin/**`
- **Fuseau / devise :** Africa/Algiers · DZD

Vérifications exécutées :

| Commande | Résultat |
|---|---|
| `npx tsc --noEmit` | ✅ aucune erreur |
| `npm run build` | ✅ compile, 19 routes, toutes dynamiques (`ƒ`) |
| `npx eslint . --format json` | ⛔ non exécuté — aucune configuration ESLint dans le dépôt, et `next lint` est déprécié sur Next 15 (voir X-02) |
| `npx knip` | ⛔ non exécuté — ajouter la dépendance sortirait du cadre de la phase 1. Le code mort a été relevé à la main (A-11) |

---

## Phase 2 — état des corrections

`npx tsc --noEmit` et `npm run build` passent après chaque palier. Un harnais de
40 vérifications rejoue la logique de langue (parité des dictionnaires, garde-fou
anti-recopie, replis, vidage des réglages, direction) : tout passe.

| # | Sévérité | État |
|---|---|---|
| A-01 | P1 | ✅ corrigé — l'en-tête est défait si les lignes ne passent pas |
| A-02 | P1 | ✅ corrigé — prix strictement positif, serveur et formulaire |
| A-03 | P1 | ✅ corrigé — le catalogue de rappel suit `mode_boutique` |
| A-04 | P1 | ✅ corrigé — suffixe à six caractères, plus une reprise sur doublon |
| A-05 | P2 | ✅ corrigé — `src/lib/media.ts`, suppressions et remplacements |
| A-06 | P2 | ✅ corrigé — pagination et compteurs en base |
| A-07 | P2 | ✅ corrigé — les pistes suivent la période choisie |
| A-08 | P2 | ✅ corrigé — le marquage est attendu |
| A-09 | P2 | ⏸ **non corrigé** — demande une migration (`updated_at`), voir Q8 |
| A-10 | P3 | ✅ corrigé |
| A-11 | P3 | ✅ corrigé — *avec une correction, voir ci-dessous* |
| A-12 | P3 | ⏸ **non corrigé** — demande un arbitrage, voir Q9 |
| B-01 | P2 | ✅ corrigé — le garde-fou est branché sur les cinq formulaires manquants |
| B-02 | P2 | ✅ corrigé — seuls les trois `hero_*` gardent leur repli |
| B-03 | P2 | ✅ corrigé — la langue voyage jusqu'à `/merci` |
| B-04 | P2 | ◐ partiellement — `robots.txt` et `sitemap.xml` posés ; `hreflang` reste impossible, voir Q10 |
| B-05 | P3 | ✅ corrigé — en-tête `X-LF-Langue` |
| B-06 | P2 | ✅ corrigé — **constat ajouté en phase 2**, voir ci-dessous |
| C-01 | P2 | ✅ corrigé — *après correction de l'analyse, voir ci-dessous* |
| C-02 | P2 | ✅ corrigé — arrondi à la saisie, total de ligne arrondi une fois |
| C-03 | P3 | ⏸ constat, pas défaut — aucune notion de stock |
| C-04 | P2 | ✅ corrigé — **constat ajouté en phase 2** |
| C-05 | P2 | ✅ corrigé — **constat ajouté en phase 2** |
| X-01 | P3 | ✅ corrigé — `cache()` de React, déduplication par requête |
| X-02 | P3 | ⏸ **non corrigé** — ajouter une dépendance sort du cadre, voir Q11 |

### Corrections apportées à la phase 1

Deux constats du rapport étaient faux, et un troisième incomplet. Les laisser
tels quels aurait été plus coûteux que de les avoir manqués.

**C-01, première moitié : fausse.** Le rapport annonçait qu'allumer
l'interrupteur de livraison sur une grille vide bloquait toutes les commandes.
C'est impossible : `enregistrerLivraison` écrit les cinquante-huit wilayas
**et** l'interrupteur dans la même action — on ne peut pas allumer l'un sans
peupler l'autre. Seule la seconde moitié était réelle, et c'est elle qui a été
corrigée : une wilaya dont aucun prix n'a été saisi était écrite « desservie à
zéro dinar ».

**A-11 : `min_demi_gros_pieces` n'était pas du code mort.** Il était lu dans
`AppelFinal` et `CommentCommander`. C'est en essayant de le retirer que le
compilateur l'a signalé — et que C-04 est apparu.

**B-06 manquait entièrement.** Le relevé de chaînes en dur de la phase 1 ne
cherchait que dans le JSX ; les messages des actions serveur n'y sont pas. Ils y
étaient tous, en français.

### [B-06] Le back-office parlait arabe, sauf quand il répondait
**Sévérité :** P2 · ✅ corrigé
**Emplacement :** les six modules de `src/lib/actions/`
**Problème :** une soixantaine de messages de retour — succès, refus de
validation, diagnostics — étaient des chaînes françaises écrites en dur. Une
gestionnaire travaillant en arabe lisait donc ses menus, ses libellés et ses
aides en arabe, puis « Coffret enregistré. » en français à chaque geste, et
« Le prix du coffret doit être supérieur à zéro. » quand elle se trompait —
c'est-à-dire au moment précis où le message compte. C'est très exactement le
« à moitié traduit est pire que pas traduit » de l'audit, et cela touchait la
moitié qui parle.
**Correctif appliqué :** section `admin.messages` dans les trois dictionnaires,
538 clefs par langue à parité vérifiée. Le type reste dérivé du français : une
clef oubliée casse la compilation.
**Reste :** les erreurs levées par la couche de données (« Base non connectée. »,
replis sur fichier local) sont encore en français. Elles n'apparaissent qu'en
développement sans Supabase, ou sur une installation incomplète que le
back-office signale déjà par un bandeau ; les traduire ferait descendre un
dictionnaire dans une couche qui sert aussi l'API publique.

### [C-04] La vitrine vendait une offre que le code a abandonnée
**Sévérité :** P2 · ✅ corrigé
**Emplacement :** `fr.ts`, `ar.ts`, `en.ts` — `commander.etapes[0].texte` et `appel.lede`
**Problème :** deux textes de l'accueil décrivaient l'achat en gros et en
demi-gros, que la boutique ne propose plus : le sélecteur a disparu,
`purchase_type` est figé côté serveur, `price_gros` est un vestige, et tout le
code répète que la vente est au détail. Le nombre interpolé venait par-dessus de
`min_demi_gros_pieces`, un réglage que le back-office n'expose plus — donc
incorrigible par la gérante — pendant que la commande applique `min_produit`.
La page annonçait un minimum, la caisse en appliquait un autre.
**Correctif appliqué :** les deux textes réécrits dans les trois langues, sans
minimum interpolé ; les clefs `minDemi`, `minGros`, `minGrosPluriel` retirées.
Le seuil reste dit par la boutique et par le message d'erreur de l'API, qui
lisent tous deux `min_produit`. La formulation est une proposition, voir Q12.

### [C-05] Le jeu de secours traduisait un français qui n'existait plus
**Sévérité :** P2 · ✅ corrigé
**Emplacement :** `src/lib/catalog.ts` — `hero_lede_ar`, `hero_lede_en`
**Problème :** trouvé en regardant la page rendue. Le `hero_lede` français du
jeu de secours dit « Livrés partout en Algérie, payés à la réception » ; ses
traductions arabe et anglaise disaient encore « au détail, en demi-gros dès
5 pièces, ou en gros par carton ». Elles traduisaient une version antérieure du
texte. Sur une installation neuve — le seul cas où ce jeu s'affiche — le site
aurait vendu deux offres différentes selon la langue du visiteur.
**Correctif appliqué :** les deux traductions alignées sur le français.

---

## 1. Orientation

### 1.1 Routes du back-office

Toutes sous le groupe `(panel)`, protégées par un seul `layout.tsx` qui appelle
`isAdmin()` avant de rendre quoi que ce soit.

| Route | Rôle |
|---|---|
| `/admin` | Commandes : liste paginée, filtre par statut, changement de statut, suppression, essai d'email |
| `/admin/pistes` | Paniers abandonnés : rappel, changement de statut, conversion en commande |
| `/admin/stats` | Chiffre d'affaires, panier moyen, top produits, wilayas, taux de transformation |
| `/admin/packs` | Coffrets : prix, prix barré, photo, composition |
| `/admin/produits` | Produits : slug, type, gamme, couleur, photo |
| `/admin/formats` | Formats (`product_variants`) : taille, prix, photo |
| `/admin/gammes` | Gammes : couleur, accroche, description, couverture |
| `/admin/types` | Types de produits |
| `/admin/livraison` | Grille tarifaire des 58 wilayas + interrupteur général |
| `/admin/campagne` | Textes et bandeau de `/boutique`, langue propre à la campagne |
| `/admin/contenu` | Réglages du site, hero, coordonnées, réseaux, visuels, vidéos |
| `/admin/login` | Connexion Supabase (hors du groupe `(panel)`) |
| `/admin/export` | CSV des commandes confirmées pour le transporteur |

### 1.2 Tables Supabase et RLS

| Table | RLS | Politique |
|---|---|---|
| `gammes`, `product_types`, `products`, `product_variants`, `hero_slides`, `videos`, `site_settings`, `packs`, `pack_items`, `livraison_tarifs` | activée | lecture publique (`select using (true)`), aucune écriture publique |
| `orders`, `order_items`, `prospects`, `admins` | activée | **aucune politique** — donc tout est refusé à la clé anon ; seule la clé de service, côté serveur, lit et écrit |
| `storage.objects` (bucket `media`) | — | lecture publique, aucune écriture publique |

C'est le bon dessin : la politique applicative et la politique base disent la
même chose, et la base est la plus stricte des deux.

### 1.3 Écritures en base

| Chemin | Garde |
|---|---|
| `POST /api/orders` | public par nécessité — bridé à 20/h/IP par le middleware, prix recalculés serveur |
| `POST /api/prospects` | public — bridé à 120/h/IP, répond toujours `{ok:true}` |
| `src/lib/actions/catalogue.ts` (8 actions) | `garde()` → `isAdmin()` + clé de service |
| `src/lib/actions/contenu.ts` (7 actions) | `garde()` ou `isAdmin()` |
| `src/lib/actions/commandes.ts` (6 actions) | `isAdmin()` explicite en tête |
| `src/lib/actions/medias.ts` (2 actions) | `isAdmin()` explicite |
| `src/lib/actions/amorcage.ts` | `garde()` |
| `src/lib/actions/session.ts` | connexion/déconnexion — publiques par nature, bridage global des échecs |

**Aucune action serveur n'écrit sans revérifier le rôle.** Le layout n'est pas
la seule barrière : chaque action refait le contrôle. Un non-admin qui poste
directement sur une action serveur reçoit « Session expirée. » et rien ne
s'écrit.

### 1.4 D'où vient la langue, et où elle s'écrit

**Une seule source, et c'est la bonne :** la colonne `site_settings.locale`,
lue par `getLocale()` dans `src/i18n/server.ts:37`.

- **Lecture :** `getSettings()` → `reglages.locale`. Sur `/boutique` seulement,
  `locale_boutique` prend le dessus s'il est renseigné (le chemin arrive par
  l'en-tête `x-lf-chemin` posé par le middleware).
- **Écriture :** `changerLangueSite()` et `enregistrerReglages()`
  (`src/lib/actions/contenu.ts:76` et `:35`), plus un repli fichier
  `.data/settings.json` quand Supabase est absent.
- **Ni cookie, ni URL, ni état React.** `LOCALE_COOKIE` existe dans le code mais
  personne ne l'écrit (voir B-05).

C'est un réglage **global**, pas une préférence par visiteur, et l'interface le
tient : il n'y a aucun sélecteur de langue côté vitrine. Le back-office suit la
même langue que la vitrine.

### 1.5 Où se calculent prix, remises et totaux

C'est le point que l'audit demandait de vérifier en premier. **Le total final
est calculé à un seul endroit**, côté serveur :

| Lieu | Rôle |
|---|---|
| `src/lib/panier.ts:40` `composer()` | **la seule autorité sur les prix marchandise.** Reçoit des identifiants et des quantités, relit prix et libellés en base, produit les lignes et le total |
| `src/lib/livraison.ts:40` `fraisLivraison()` | **la seule autorité sur le port.** Reçoit un mode, lit la grille, rend le prix |
| `src/app/api/orders/route.ts:115` | `total = panier.total + frais.prix` — le seul assemblage |
| `src/lib/actions/commandes.ts:214` | même assemblage, pour la conversion d'une piste |
| `src/components/BoutiqueProvider.tsx:159` | **affichage seulement.** Recalcule localement pour montrer un total avant l'envoi ; ce chiffre ne voyage jamais |
| `src/lib/format.ts:24-30` | `unitPrice()` / `lineTotal()`, partagées par les deux |

Le navigateur n'envoie que `{kind, id, quantity}` (`Commande.tsx:118`). Il n'y a
aucun chemin par lequel un prix ou un total posté depuis la console atteindrait
la base. **Ce n'est donc pas la finding #1 : c'est ce que le code fait de
mieux.**

Une nuance : la logique existe bien à deux endroits (commande et conversion de
piste), mais toutes deux passent par les mêmes `composer()` et
`fraisLivraison()`. La duplication est dans l'assemblage à trois lignes, pas
dans le calcul.

---

## 2. Focus A — Logique du back-office

### [A-01] Une commande peut s'enregistrer sans ses lignes
**Sévérité :** P1
**Emplacement :** `src/lib/data.ts:311-364`
**Problème :** `createOrder` fait deux écritures indépendantes — la commande,
puis ses lignes — sans transaction. Si le second `insert` échoue (contrainte,
coupure réseau, quota), la ligne `orders` reste en base avec son `total`, son
téléphone et son statut « nouvelle », mais sans aucun `order_items`. La fonction
lève, l'API rend une 500, la cliente voit « échec » et recommence — d'où une
seconde commande, celle-là complète.

La commande orpheline n'est pas inerte : elle est comptée dans les compteurs de
`/admin`, elle entre dans le chiffre d'affaires dès qu'on la confirme
(`getStatistiques` somme `orders.total`, pas les lignes), et une fois confirmée
elle part dans le CSV du transporteur avec un montant à encaisser et aucun
article à livrer.
**Correctif :** écrire les deux dans une fonction Postgres appelée par
`db.rpc()`, ou, à défaut de migration, supprimer la commande dans le `catch` du
second insert avant de relever. `[NEEDS DECISION]` — la première option demande
une fonction SQL, donc une migration ; la seconde tient dans le code existant
mais reste faillible si la suppression échoue à son tour.
**Rayon :** `orders`, `order_items`, `/admin`, `/admin/stats`, `/admin/export`.
**Confiance :** haute

### [A-02] Un format peut être enregistré à 0 DA et vendu gratuitement
**Sévérité :** P1
**Emplacement :** `src/lib/actions/catalogue.ts:166` · formulaire
`src/app/admin/(panel)/formats/page.tsx:97-101` et `:245-251`
**Problème :** `const prix = Number(formData.get("price_demi_gros") ?? 0)`. Le
champ n'est pas `required` et accepte `min={0}`. Laissé vide, `Number("")` vaut
`0` : le format s'enregistre à zéro dinar, sans erreur ni avertissement. Il
apparaît alors en boutique à « 0 DA », `composer()` reprend fidèlement ce prix
depuis la base — c'est même son rôle — et la commande part à zéro. Rien en aval
ne rattrape : ni la contrainte SQL (`check (price_demi_gros >= 0)` autorise
zéro), ni l'API.

L'asymétrie est ce qui rend la chose sûre à qualifier : le chemin des coffrets,
juste à côté, contrôle exactement cela — `if (!(prix > 0)) throw new Error(...)`
(`catalogue.ts:234`). Le contrôle existe, il n'a simplement pas été porté sur
les formats.
**Correctif :** dans `enregistrerVariante`, refuser `!(prix > 0)` avec le même
message ; ajouter `required` et `min={1}` sur les deux champs du formulaire.
**Rayon :** `product_variants`, boutique, `/api/orders`.
**Confiance :** haute

### [A-03] La conversion d'une piste en commande ne sait commander que des coffrets
**Sévérité :** P1
**Emplacement :** `src/lib/actions/commandes.ts:179` ·
`src/app/admin/(panel)/pistes/page.tsx:329`
**Problème :** `commanderDepuisPiste` lit les champs `qte_<id>` et les pousse
toutes en `{ kind: "pack", ... }`, en dur. Le formulaire, symétriquement, ne
liste que `getPacks()`.

Or `site_settings.mode_boutique` a deux valeurs. En mode `produits`, la boutique
vend des formats à l'unité, les paniers abandonnés contiennent donc des formats
— et l'écran de rappel affiche une liste de coffrets vide. Il n'y a rien à
cocher, `lignes` reste vide, et l'action lève « Le panier est vide. » à chaque
tentative. Le geste central de la liste d'appels — décrocher, corriger, valider
— devient impossible, et le back-office n'offre aucun autre moyen de saisir la
commande à la main.

Même en mode `packs`, le contenu réel de la piste n'est pas repris : une piste
peut porter des formats (`composer()` en accepte, `/api/prospects` les
enregistre) qui ne réapparaissent nulle part dans le formulaire.
**Correctif :** lister coffrets **et** formats selon `mode_boutique`, et porter
la nature dans le nom du champ pour que l'action pose le bon `kind`.
**Rayon :** `/admin/pistes`, `orders`.
**Confiance :** haute

### [A-04] Une collision de référence perd la commande, sans reprise
**Sévérité :** P1
**Emplacement :** `src/lib/format.ts:33-37` · `supabase/schema.sql`
**Problème :** `orderRef()` produit `LF-AAMMJJ-XXXX` où `XXXX` est
`Math.random().toString(36).slice(2,6)` en majuscules : quatre caractères
base36, soit 1 679 616 valeurs, et la date change chaque jour — les collisions
se jouent donc à l'intérieur d'une même journée.

Par le paradoxe des anniversaires, à 300 commandes/jour la probabilité d'au
moins une collision dans la journée est d'environ 2,7 % ; à 500/jour, environ
7 %. Le commentaire de `data.ts:369` évoque « mille commandes en trois jours » :
ce régime est donc celui qui est envisagé. Sur une année, l'événement devient
quasi certain.

Quand il survient : `ref` est `unique`, l'insert est rejeté, `createOrder` lève,
l'API rend une 500 avec `t.api.echec`, et il n'y a **aucune reprise** — pas de
seconde tentative avec une nouvelle référence. La cliente voit un échec
générique pour une commande parfaitement valable.
**Correctif :** soit élargir le suffixe (six caractères divisent le risque par
~1300), soit — mieux — réessayer une fois avec une nouvelle référence quand
l'erreur Postgres est un `23505` sur `orders_ref_key`.
**Rayon :** `/api/orders`, `orders`.
**Confiance :** haute (le calcul est arithmétique ; c'est la cadence réelle de
commandes qui décide de l'urgence — voir Q6)

### [A-05] Les images téléversées ne sont jamais supprimées du stockage
**Sévérité :** P2
**Emplacement :** `src/lib/actions/catalogue.ts:144,193,285` ·
`src/lib/actions/contenu.ts:117,159`
**Problème :** l'audit posait la question dans les deux sens, et la réponse est
« non » aux deux. `supprimerProduit`, `supprimerVariante`, `supprimerPack`,
`supprimerSlide`, `supprimerVideo` suppriment la ligne et rien d'autre : le
fichier reste dans le bucket `media`. Et lorsqu'on remplace une photo, le
formulaire écrit simplement la nouvelle URL dans la colonne — l'ancienne n'est
jamais retirée non plus.

Aucun appel à `db.storage.from("media").remove(...)` n'existe dans le dépôt. Le
bucket ne fait donc que grossir, avec des fichiers que plus rien ne référence et
qui restent publiquement accessibles à qui connaît leur URL. Ce n'est pas une
fuite (ce sont des photos produit), mais c'est une facture de stockage sans
plafond et un ménage qui deviendra impossible à faire à la main.
**Correctif :** à la suppression d'une ligne, extraire le chemin de l'URL
publique et appeler `remove()` ; idem pour l'ancienne valeur lors d'un
remplacement. L'échec de la suppression du fichier ne doit pas faire échouer la
suppression de la ligne — journaliser et continuer.
**Rayon :** bucket `media`.
**Confiance :** haute

### [A-06] La liste d'appels est plafonnée à 500 sans pagination ni signal
**Sévérité :** P2
**Emplacement :** `src/lib/data.ts:569-584` · `src/app/admin/(panel)/pistes/page.tsx:57-58`
**Problème :** `getPistesActives()` fait `.limit(500)` et l'écran affiche tout
d'un bloc. Passé 500 pistes ouvertes ou rappelées, les plus anciennes
disparaissent sans que rien ne le dise — et comme les compteurs des filtres sont
calculés depuis le tableau déjà chargé, ils affichent 500 au lieu du vrai
nombre : rien ne signale la troncature.

C'est exactement le bug corrigé pour les commandes, dont `data.ts:369` garde le
récit (« passé ce seuil, les commandes les plus anciennes disparaissaient de
l'écran comme si elles n'existaient pas »). La correction n'a pas été portée sur
les pistes, qui se remplissent pourtant bien plus vite que les commandes — une
piste s'écrit dès qu'un numéro complet est saisi, commande ou non.
**Correctif :** reprendre le dessin de `getOrders` — `range()` + `count:
"exact"` + navigation de pages, et compter les statuts par requête `head: true`
plutôt qu'en filtrant le tableau chargé.
**Rayon :** `/admin/pistes`.
**Confiance :** haute

### [A-07] Le taux de transformation mélange deux périodes
**Sévérité :** P2
**Emplacement :** `src/lib/data.ts:786-794` · `src/app/admin/(panel)/stats/page.tsx:36`
**Problème :** `getStatistiques(jours)` filtre les commandes sur
`created_at >= depuis`, mais les deux comptages de pistes qui suivent
(`pistesOuvertes`, `pistesConverties`) n'ont aucun filtre de date : ils comptent
depuis toujours. L'écran calcule ensuite
`taux = converties / (ouvertes + converties)` et l'affiche sous un onglet
« 7 jours » ou « 30 jours ».

Le chiffre affiché n'est donc le taux d'aucune période : il ne bouge pas quand
on change d'onglet, et il se dégrade mécaniquement à mesure que le site
vieillit, puisque son dénominateur ne fait que croître pendant que le reste de
l'écran parle de la semaine.
**Correctif :** ajouter `.gte("created_at", depuis)` aux deux comptages quand
`depuis` n'est pas nul.
**Rayon :** `/admin/stats`.
**Confiance :** haute

### [A-08] Le marquage « convertie » part sans être attendu
**Sévérité :** P2
**Emplacement :** `src/app/api/orders/route.ts:144`
**Problème :** `if (clePiste) void pisteConvertie(clePiste);` — la promesse
n'est ni attendue, ni confiée à `waitUntil`. Sur une plateforme serverless,
l'exécution peut être gelée dès la réponse rendue : rien ne garantit que la mise
à jour atteigne la base.

En pratique le `await avertirCommande(...)` de la ligne 151 laisse en général
assez de temps (un aller-retour HTTP vers Resend). Mais quand l'email est
désactivé — `RESEND_API_KEY` absente — `envoyer()` sort immédiatement, sans
requête réseau, et la fenêtre disparaît. La conséquence est visible : la piste
reste « ouverte », la cliente réapparaît dans la liste d'appels alors qu'elle
vient de commander, et on la rappelle pour rien.
**Correctif :** `await pisteConvertie(clePiste)` avant la réponse. L'appel est
déjà best-effort à l'intérieur (il journalise et ne lève jamais), l'attendre ne
peut donc pas coûter une vente.
**Rayon :** `prospects`, `/admin/pistes`.
**Confiance :** moyenne (le gel dépend de la plateforme ; le chemin sans email,
lui, est certain)

### [A-09] Deux gestionnaires sur la même ligne : le dernier écrase, en silence
**Sévérité :** P2
**Emplacement :** toutes les actions `enregistrer*` de `catalogue.ts` et `contenu.ts`
**Problème :** aucune écriture ne compare `updated_at` — les tables du catalogue
n'ont d'ailleurs pas cette colonne, seules `livraison_tarifs` et `prospects` en
ont une. Deux onglets ouverts sur le même coffret, deux enregistrements : le
second efface le premier sans que rien ne l'annonce. Le cas ne demande pas deux
personnes : deux onglets d'un même navigateur suffisent, ce qui est la situation
courante ici.

Sévérité tenue à P2 parce que la boutique est manifestement tenue par une ou
deux personnes : le risque est réel mais peu fréquent, et le correctif demande
une migration.
**Correctif :** `[NEEDS DECISION]` — ajouter `updated_at` aux tables du
catalogue et refuser l'écriture si la valeur postée ne correspond plus. C'est
une migration de schéma, donc hors du cadre d'une correction de phase 2 sans
arbitrage.
**Rayon :** tout le catalogue.
**Confiance :** haute (sur le fait) / moyenne (sur l'importance)

### [A-10] `amorcerBase` peut échouer sur un message illisible
**Sévérité :** P3
**Emplacement :** `src/lib/actions/amorcage.ts:20-32`
**Problème :** le garde-fou compte les lignes de `gammes`, mais la première
écriture porte sur `product_types`. Sur une base où les gammes ont été vidées
alors que les types subsistent, le contrôle passe, puis l'insertion des types
échoue sur un `slug` en double. Rien n'est encore écrit à ce stade, donc pas de
base incohérente — le défaut réel est un message d'erreur Postgres brut là où
`amorcerBase` sait par ailleurs très bien expliquer ses refus.
**Correctif :** compter sur `product_types`, puisque c'est la table écrite en
premier ; ou sur les deux.
**Rayon :** `/admin/contenu` (bouton d'amorçage).
**Confiance :** haute

### [A-11] Code mort
**Sévérité :** P3
**Emplacements :**
- `src/lib/data.ts:565` `getProspects()` — exportée, jamais appelée (remplacée par `getPistesActives`)
- `src/components/Reglages.tsx:44` `useT()` — définie, non exportée, non utilisée
- `src/components/Bascules.tsx:6` — `LOCALES`, `LOCALE_COOKIE`, `LOCALE_SHORT`, `LOCALE_LABEL` importés, aucun n'est employé dans le fichier : vestige d'un sélecteur de langue retiré (voir B-05)
- `src/app/api/prospects/route.ts:66,96` — `const settings = await getSettings()` suivi de `void settings;` : une lecture de base à chaque frappe utile, pour rien
- `site_settings.whatsapp_number` — colonne et champ de type, aucun lecteur dans le code
- `SiteSettings.min_gros_cartons` / `min_demi_gros_pieces` — vestiges de l'époque gros / demi-gros, plus lus
- `commande.parCarton` — clé présente dans les trois dictionnaires, rendue nulle part

Que quatre imports morts aient survécu s'explique par X-02 : aucun linter ne
tourne, et TypeScript ne les signale pas.
**Confiance :** haute

### [A-12] `units_per_carton` n'est jamais écrit par le back-office
**Sévérité :** P3
**Emplacement :** `src/lib/actions/catalogue.ts:167-181`
**Problème :** la colonne existe (`default 12`), elle est recopiée sur chaque
ligne de commande (`panier.ts:96`, `data.ts:357`), mais aucun champ du
formulaire ne la renseigne et `enregistrerVariante` ne l'écrit pas. Tout format
créé depuis le back-office porte donc 12, quelle que soit la réalité. La valeur
n'est affichée nulle part aujourd'hui (`parCarton` est morte), elle ne trompe
donc personne — mais elle est fausse en base, et le sera silencieusement le jour
où on la lira.
**Correctif :** soit ajouter le champ, soit retirer la colonne et ses recopies.
`[NEEDS DECISION]` — la retirer est une migration.
**Confiance :** haute

### Ce qui a été vérifié et se tient

Consigné parce que l'audit le demandait explicitement, et parce qu'un point
vérifié bon vaut d'être su :

- **Contrôle d'accès.** `layout.tsx:24` garde toutes les pages du groupe
  `(panel)` côté serveur, et **chaque action serveur refait le contrôle**
  (`garde()` ou `isAdmin()` en tête). Un non-admin qui poste directement sur une
  action ne peut rien écrire. `isAdmin()` emploie `getUser()` — vérification du
  jeton par Supabase — et non `getSession()`, qui se contente de lire un
  cookie : c'est la bonne primitive. La double condition « session valide **et**
  adresse inscrite dans `admins` » ferme la porte que laisseraient ouverte les
  inscriptions publiques du projet Supabase.
- **RLS.** Les politiques base disent la même chose que l'application, et sont
  plus strictes : `orders`, `order_items`, `prospects`, `admins` n'ont aucune
  politique, RLS activée — la clé anon ne peut rien y faire. L'application n'est
  pas le seul garde.
- **Mise à jour partielle.** `traduits()` ne nomme que les colonnes de la langue
  éditée, et les champs non traduisibles ne s'écrivent que depuis l'onglet
  français. Passer en arabe n'efface donc ni le prix, ni le slug, ni la photo.
  C'est fait délibérément et correctement — le piège le plus courant de cette
  section est évité.
- **Suppressions.** Les clés étrangères sont bien pensées :
  `order_items.variant_id` en `set null` (une commande passée survit à la
  suppression du produit, avec son libellé figé), `pack_items.variant_id` de
  même, `products.type_id` en `restrict` avec comptage préalable et message
  lisible. La suppression d'une gamme est en cascade, mais la boîte de dialogue
  annonce le nombre exact de produits emportés (`fr.ts:533`).
- **Fraîcheur.** `rafraichir()` invalide l'étiquette du catalogue et le rendu à
  chaque action réussie ; toutes les pages d'admin sont en `force-dynamic`.
- **Retours d'écran.** `FormAction` (`Champs.tsx:79-103`) n'annonce la réussite
  qu'après avoir lu `etat.ok` renvoyé par l'action. **Aucun endroit du code
  n'annonce un succès avant de l'avoir vérifié**, et il n'y a pas de mise à jour
  optimiste, donc rien à annuler en cas d'échec.
- **Pagination des commandes.** `getOrders` applique le même filtre à la requête
  de lignes et au `count: "exact"` — pas de décompte incohérent. `lien()`
  conserve le filtre en changeant de page. Le tri est fait en base
  (`order("created_at")`), pas sur la page courante.
- **Machine à états des commandes.** Trois états, validés contre
  `STATUTS_ACTIFS` avant écriture (`commandes.ts:38`). Les transitions arrière
  sont autorisées — c'est délibéré (le bouton « remettre en nouvelle » existe) et
  **sans danger, parce qu'aucun effet de bord n'est accroché au changement de
  statut** : ni décrément de stock, ni compteur. Le scénario du modèle d'audit
  (`delivered → pending` re-déclenchant le stock) n'a pas d'équivalent ici.
- **Export CSV.** Échappement des formules (`=`, `+`, `-`, `@`), préfixe sur les
  numéros de téléphone, BOM UTF-8, séparateur point-virgule, et seules les
  commandes confirmées partent. Correct.

---

## 3. Focus B — Langues, i18n, page de réglages

### [B-01] Le garde-fou anti-recopie du français ne tourne que sur deux formulaires sur sept
**Sévérité :** P2
**Emplacement :** `src/lib/actions/_socle.ts:57-93` (le garde-fou) ·
appels sans `actuel` : `catalogue.ts:16, 72, 224` · `contenu.ts:96, 141`
**Problème :** `traduits(formData, bases, actuel?)` ne compare la valeur postée
au français **que si `actuel` lui est passé**. Deux appels le font —
`enregistrerReglages` (`contenu.ts:28`) et `enregistrerCampagne`
(`contenu.ts:192`) — et cinq ne le font pas : les types, les gammes, les
coffrets, les visuels du hero, les vidéos.

Sur ces cinq-là, un texte français posté dans la colonne `_ar` s'y grave, et le
repli vers le français ne joue plus jamais : la page arabe affiche du français
pour toujours, sans que rien ne le signale. C'est le scénario que le commentaire
de `_socle.ts:74-85` raconte en détail — « une page laissée ouverte dans un
onglet, un retour en arrière du navigateur, un brouillon restauré, et le même
envoi repart ». Le raisonnement vaut mot pour mot pour un coffret ou une gamme.

Le formulaire, lui, est bien corrigé partout : les champs emploient
`traduction()` — sans repli — avec le texte français en simple indication de
saisie. C'est la seconde ceinture qui manque là où le correctif d'origine ne
l'a pas portée.
**Correctif :** charger la ligne courante avant l'écriture et la passer en
troisième argument, comme le font déjà les deux appels de `contenu.ts`. Pour une
création (pas d'`id`), il n'y a rien à comparer : l'argument reste absent.
**Rayon :** `product_types`, `gammes`, `packs`, `hero_slides`, `videos` —
colonnes `_ar` et `_en`.
**Confiance :** haute

### [B-02] Un texte de réglages ne peut pas être vidé : le texte d'usine revient
**Sévérité :** P2
**Emplacement :** `src/lib/data.ts:159-183` (`fusionnerReglages`) · seed
`src/lib/catalog.ts:484`
**Problème :** `rempli(v)` traite `""` comme « absent ». Pour toute colonne de
base non traduite, une chaîne vide en base est donc remplacée par la valeur du
jeu de secours `SETTINGS`. Le commentaire l'assume pour le hero (« une vitrine
sans titre serait pire que le titre par défaut »), mais la règle s'applique
indistinctement à **toutes** les colonnes, y compris celles où vide est une
réponse légitime :

| Colonne | Ce qui revient si on la vide |
|---|---|
| `contact_phone` | `+213 00 00 00 00` — affiché en pied de page, et en `href="tel:"` |
| `contact_email` | `contact@ladyfresh.dz` — en `href="mailto:"` |
| `contact_address` | `Alger, Algérie` |
| `instagram_url` / `facebook_url` / `tiktok_url` | `https://instagram.com/`, `https://facebook.com/`, `https://tiktok.com/` — des liens vers les pages d'accueil des réseaux |
| `camp_gages` | les trois garanties d'usine, impossibles à retirer |
| `camp_bandeau`, `camp_eyebrow`, `camp_cta` | les textes d'usine |

Deux conséquences. La première : le site publie des coordonnées de démonstration
tant que ces champs ne sont pas remplis — un numéro de téléphone cliquable qui
ne mène nulle part. La seconde : le formulaire ment. Le back-office affiche la
valeur réelle (`getSettingsAdmin` ne fusionne pas, à dessein), on efface, on
enregistre, on retourne sur la vitrine — et le texte est toujours là.

`lienReseau()` gère pourtant très bien le vide (`reseaux.ts:46` : `if (!brut)
return null`). Ce chemin n'est jamais atteint, parce que la fusion a déjà
substitué l'URL d'usine.
**Correctif :** restreindre le repli aux seules colonnes où un vide serait
véritablement destructeur (les trois `hero_*`), et laisser passer le vide pour
les coordonnées, les réseaux et les champs de campagne.
**Rayon :** pied de page de la vitrine et de `/boutique`, hero de campagne.
**Confiance :** haute

### [B-03] Une campagne en arabe se termine sur une confirmation en français
**Sévérité :** P2
**Emplacement :** `src/i18n/server.ts:42` · `src/app/merci/page.tsx`
**Problème :** l'exception de langue est conditionnée à
`chemin().startsWith("/boutique")`. Or le parcours d'achat d'une campagne se
termine ailleurs : `Commande.tsx:217` fait `router.push("/merci")`. Sur `/merci`,
le chemin ne commence pas par `/boutique`, `locale_boutique` est ignoré, et la
confirmation s'affiche dans la langue du site.

Le cas est celui-là même que `locale_boutique` a été ajouté pour servir :
vitrine en français, campagne en arabe. La cliente lit sa page de campagne en
arabe, remplit son bon en arabe, valide — et atterrit sur une confirmation en
français. C'est le dernier écran du tunnel, celui qui dit que la commande est
bien passée.
**Correctif :** transporter la langue employée jusqu'à `/merci`. La charge passe
déjà par `sessionStorage` (`CLE_MERCI`) : y ajouter la locale est le chemin le
plus court. `[verify]` sur la solution retenue — étendre la condition de
`getLocale()` demanderait de savoir d'où l'on vient, ce que le chemin seul ne
dit pas.
**Rayon :** `/merci`.
**Confiance :** haute (sur le fait)

### [B-04] Aucun sitemap ni robots.txt, et une seule langue indexable par construction
**Sévérité :** P2
**Emplacement :** `src/app/` — ni `sitemap.ts`, ni `robots.ts`
**Problème :** deux choses distinctes.

D'abord l'absence pure et simple : pas de `sitemap.ts`, pas de `robots.ts`. Les
pages privées se protègent bien par leurs `metadata` (`robots: { index: false }`
sur `/admin/*` et `/merci`, plus l'en-tête `X-Robots-Tag` posé par le
middleware) — donc rien de sensible ne fuit, mais rien ne guide non plus
l'indexation des deux pages publiques.

Ensuite, et c'est le point structurel : **`hreflang` est impossible sur ce
site**. La langue est un réglage global unique ; il n'existe pas d'URL par
langue (pas de `/fr`, `/ar`, `/en`, ni de paramètre). Un moteur ne verra donc
jamais que la langue active au moment de son passage, et les deux autres
traductions — un travail réel, 474 clés chacune — resteront invisibles à la
recherche. Le choix est cohérent avec l'intention affichée (« une marque
algérienne qui s'adresse à un marché donné », `i18n/server.ts:9`), mais il a ce
prix, et il vaut d'être posé en toutes lettres plutôt que découvert.
**Correctif :** ajouter `sitemap.ts` et `robots.ts` pour `/` et `/boutique`.
Pour l'indexation multilingue : `[NEEDS DECISION]` — elle demande des URL par
langue, donc une refonte du routage.
**Rayon :** référencement.
**Confiance :** haute

### [B-05] Le message de bridage des commandes est toujours en français
**Sévérité :** P3
**Emplacement :** `src/middleware.ts:153` · `src/i18n/config.ts:7`
**Problème :** `const locale = request.cookies.get("lf_locale")?.value ?? "fr"`.
Le cookie `lf_locale` n'est écrit **nulle part** dans le dépôt : `LOCALE_COOKIE`
n'est référencé que par sa définition et par un import inutilisé de
`Bascules.tsx`. La lecture retombe donc toujours sur `"fr"`, et les deux autres
entrées de `MESSAGES` — l'arabe et l'anglais, écrits lignes 20 et 21 — sont
mortes.

Une cliente arabophone qui heurte la limite de 20 commandes/heure reçoit un
message en français. Le cas est rare (c'est un anti-abus), d'où le P3, mais le
code entretient l'illusion d'un message traduit qui ne le sera jamais.
**Correctif :** le middleware ne peut pas lire la base ; le plus simple est de
rendre les trois messages d'un coup, ou de poser `lf_locale` depuis la mise en
page racine, où la langue est connue.
**Rayon :** réponse 429 sur `/api/orders`.
**Confiance :** haute

### Ce qui a été vérifié et se tient

- **Source unique de vérité.** Une seule, `site_settings.locale`, plus
  `locale_boutique` en exception documentée pour `/boutique`. Ni cookie, ni URL,
  ni état React ne concourent. Le conflit que l'audit cherchait n'existe pas ici.
- **Persistance.** Le réglage tient au rechargement forcé, en rendu serveur et
  sur un autre appareil : il est en base, et `getSettings()` est délibérément
  hors cache (`data.ts:832-849` explique pourquoi — les cinq minutes de cache
  rendaient le basculement de langue incompréhensible).
- **Portée.** C'est bien un réglage global, pas une préférence par visiteur, et
  l'interface ne promet rien d'autre : il n'existe aucun sélecteur de langue
  côté vitrine.
- **Complétude des dictionnaires — parfaite.** Comparaison programmatique des
  chemins de clés : **474 clés dans `fr`, 474 dans `ar`, 474 dans `en`, aucun
  écart dans aucun sens.** Le type `Dictionary` est dérivé de `fr`, donc une clé
  oubliée casse la compilation : le garde-fou est structurel, pas une discipline.
  Les 32 valeurs identiques entre `fr` et `en` sont des mots communs aux deux
  langues (« Contact », « Total », « Wilaya », « Note »), pas des oublis. Aucune
  valeur arabe n'est identique au français.
- **Clé manquante à l'écran :** impossible. Il n'existe aucun accès par chaîne
  (`t("admin.orders.title")`) — tout est accès de propriété typé. Une clé absente
  est une erreur de compilation, jamais un `admin.orders.title` affiché.
- **Chaînes en dur :** recherche sur tous les composants et toutes les pages —
  aucune chaîne visible par l'utilisateur hors dictionnaire. Le back-office est
  traduit **intégralement** (`t.admin.*`, ~200 clés), pas à moitié.
- **RTL.** `dir` est posé sur `<html>` depuis `DIRECTION[locale]`
  (`layout.tsx:108`) et change avec la langue. **Zéro classe Tailwind de
  direction physique dans tout `src/`** — recherche sur `ml-`, `mr-`, `pl-`,
  `pr-`, `text-left`, `text-right`, `left-`, `right-`, `border-l`, `border-r`,
  `rounded-l*` : aucune occurrence. Tout est en propriétés logiques (`ms-`,
  `me-`, `text-start`, `insetInlineEnd`, `paddingInlineEnd`). Le CSS ne contient
  aucune propriété physique directionnelle, et `globals.css:575` / `:581`
  traitent les deux cas qui demandaient un correctif RTL explicite.
- **Fonte arabe.** Tajawal, chargée avec `preload: false` pour ne pas la
  télécharger sur les pages latines (`layout.tsx:48-54`), choisie pour s'accorder
  à Jost. Le raisonnement est écrit dans le fichier.
- **Formatage.** La devise passe partout par `da()` (`format.ts:8`), jamais
  concaténée à la main — vérifié par recherche. Les dates passent par
  `formatDate()` avec la locale et `numberingSystem: "latn"`, choix explicite et
  juste pour des factures algériennes.
- **Contenu multilingue en base.** Colonnes `_ar` / `_en` accolées, le français
  faisant référence ; `champ()` retombe sur le français en vitrine,
  `traduction()` ne retombe pas dans les formulaires. Un coffret sans nom arabe
  affiche son nom français, jamais une carte vide — chemin de rendu vérifié.

---

## 4. Focus C — Campagnes, marketing, boutique

### [C-01] Livraison activée sur une grille vide : plus aucune commande ne passe
**Sévérité :** P2
**Emplacement :** `src/lib/livraison.ts:49-51` ·
`src/app/admin/(panel)/livraison/page.tsx:91`
**Problème :** `livraison_active` et la grille sont deux réglages indépendants
sur le même écran. Si l'interrupteur est allumé avant que la grille soit remplie,
`getTarifs()` rend une liste vide, `fraisLivraison()` ne trouve aucun tarif et
rend `{ok:false, raison:"wilaya"}`. **Toutes** les commandes sont alors refusées
en 422, pour toutes les wilayas.

Le formulaire le dit avant l'envoi (« indisponible » s'affiche sous le choix du
mode), donc ce n'est pas silencieux pour la cliente — d'où P2 et non P1. Mais
rien ne prévient côté back-office : l'écran de livraison ne signale pas
qu'allumer l'interrupteur sur une grille vide ferme la boutique.

À noter aussi, `livraison/page.tsx:91` : `defaultChecked={tarif ? tarif.active :
true}` — une wilaya sans ligne apparaît **cochée** « desservie ». Le premier
enregistrement écrit donc les 58 wilayas comme desservies à 0 DA, ce qui bascule
d'un extrême à l'autre : de « aucune commande ne passe » à « tout est livré
gratuitement ». Un tarif à zéro est une réponse valable et documentée
(`livraison.ts:53-56`), mais 58 zéros posés par défaut n'en sont pas une.
**Correctif :** refuser d'activer l'interrupteur tant qu'aucun tarif n'est
renseigné, ou avertir à l'enregistrement ; et décocher par défaut les wilayas
sans ligne.
**Rayon :** `/api/orders`, `/admin/livraison`, tunnel de commande.
**Confiance :** haute

### [C-02] Arrondis : les lignes affichées peuvent ne pas faire le total affiché
**Sévérité :** P2
**Emplacement :** `src/lib/format.ts:8-13` · `src/lib/panier.ts:104` ·
`src/lib/livraison.ts:58`
**Problème :** `da()` applique `Math.round()` **à chaque montant qu'elle
affiche**, indépendamment. Les calculs, eux, se font sur les valeurs exactes :
`line_total = unit_price × quantity`, puis `total = Σ line_total`, sans arrondi.

Les colonnes sont `numeric(10,2)` : les centimes sont représentables et le
formulaire les accepte. Un coffret à 1 250,50 DA acheté par deux affiche
« 1 251 DA » à l'unité (arrondi au supérieur) et « 2 501 DA » en total de ligne —
deux fois 1 251 ne fait pas 2 501, et le récapitulatif se contredit à l'écran.
Le port, lui, est bien arrondi avant d'être stocké (`Math.max(0,
Math.round(prix))`), ce qui rend l'incohérence asymétrique : une seule des deux
composantes du total est un entier en base.

Aujourd'hui les prix sont vraisemblablement saisis en dinars entiers et rien ne
se voit. Le jour où quelqu'un saisit 1 250,50, la commande, l'email et le CSV du
transporteur diront trois montants légèrement différents.
**Correctif :** décider d'une règle unique et l'appliquer à l'entrée. Arrondir
les prix à l'enregistrement est le plus simple et le plus fidèle à l'usage — le
dinar ne se manipule pas en centimes au comptoir.
**Rayon :** boutique, `/api/orders`, email, export CSV.
**Confiance :** haute (sur le mécanisme) · `[verify]` sur la présence réelle de
centimes en base

### [C-03] Aucune notion de stock
**Sévérité :** P3 (constat, pas défaut)
**Emplacement :** `supabase/schema.sql` — aucune colonne de stock
**Problème :** l'audit demandait quand le stock est décrémenté, s'il peut passer
sous zéro, s'il est restitué à l'annulation. **La réponse est qu'il n'existe
pas.** Ni colonne, ni compteur, ni agrégat susceptible de dériver. Aucun produit
n'est jamais « épuisé » : tout ce qui est `active` est commandable en quantité
quelconque, jusqu'à `MAX_QUANTITE = 10 000` par ligne (`panier.ts:21`).

Ce n'est pas nécessairement un défaut — pour une marque qui fabrique et
réapprovisionne, la rupture se gère au téléphone à la confirmation, et le
back-office est bâti exactement là-dessus (« nouvelle » → appel → « confirmée »).
Mais c'est une décision, et elle n'est écrite nulle part. Elle est signalée ici
pour qu'elle soit tenue pour telle plutôt que découverte.
**Confiance :** haute

### Ce qui a été vérifié et se tient

- **Intégrité des prix — le point le plus important de cet audit, et il est
  bon.** Le client n'envoie que `{kind, id, quantity}` (`Commande.tsx:118`).
  `composer()` relit tout en base, `fraisLivraison()` relit la grille. Le serveur
  ne fait confiance à **aucun** montant venu du navigateur, et la grille
  descendue jusqu'au formulaire porte un commentaire disant explicitement qu'elle
  n'est qu'un affichage. Il n'existe aucun chemin de falsification de prix.
- **Codes promo, campagnes datées, cumuls, limites d'usage : rien de tout cela
  n'existe.** La section 4 du modèle d'audit est en grande partie sans objet ici
  — pas de code promo, pas de fenêtre de validité, pas de minimum de commande,
  pas de portée par catégorie. Le seul argument de remise est `packs.prix_barre`,
  un prix rayé **purement décoratif** : il ne participe à aucun calcul, il est
  seulement affiché (`CartePack.tsx:28`) et le pourcentage en est déduit pour
  l'étiquette. Il est validé à l'enregistrement (`barre > prix`, sinon refus),
  donc il ne peut pas produire de pourcentage négatif. Aucun des pièges
  classiques — expiration à un jour près, remise fixe supérieure au panier,
  remise de catégorie qui déborde sur tout le panier — n'a de prise.
- **Ordre livraison / remise.** Il n'y a pas de remise, donc pas d'ordre à
  vérifier. Le port est ajouté après la marchandise, de la même façon aux deux
  endroits qui composent une commande (`route.ts:115`, `commandes.ts:214`), et il
  est **recopié** sur la commande plutôt que recalculé : une grille modifiée la
  semaine suivante ne réécrit pas ce qu'une cliente a accepté de payer.
- **Panier au rechargement.** Conservé en `localStorage` sous
  `ladyfresh.bon.v2`, mais **seules les quantités** y sont gardées ; prix et
  libellés sont re-dérivés du catalogue rendu par le serveur à chaque
  chargement. Un prix modifié pendant qu'un panier dormait est donc repris à
  jour, et une référence retirée du catalogue disparaît du panier sans le casser.
- **Sections vides.** `RailGammes`, `Boutique`, `Videos` — vérifié : aucune ne
  rend un titre au-dessus du vide. Le bandeau de campagne est conditionné à
  `camp_bandeau_actif` : rien ne s'affiche quand l'interrupteur est éteint.
- **Tarifs gros / demi-gros.** Le mécanisme a été retiré : la vente est au
  détail, `purchase_type` est figé côté serveur (`route.ts:113`) et le navigateur
  ne peut pas en choisir un autre. Il n'y a pas de palier à atteindre par
  manipulation de requête.
- **WhatsApp.** Le tunnel WhatsApp n'existe plus : `channel` est figé à
  `"formulaire"` (`route.ts:111`), et la commande est écrite en base **avant**
  toute redirection. Aucune commande ne vit uniquement dans un message.
- **Double envoi.** Le bouton est désactivé pendant `phase === "envoi"`
  (`Commande.tsx:543`). Il n'y a pas de clé d'idempotence, donc un renvoi manuel
  après une erreur réseau tardive peut créer un doublon — cas résiduel, et le
  back-office montre les deux, ce qui se rattrape à l'appel.

---

## 5. Transversal

### [X-01] `getSettings()` est relu deux à quatre fois par affichage
**Sévérité :** P3
**Emplacement :** `src/lib/data.ts:850` (`export const getSettings = getSettingsBrut`)
**Problème :** la mise en cache a été retirée pour une bonne raison — elle
rendait le changement de langue incompréhensible, et le commentaire de
`data.ts:832-849` l'explique bien. Mais rien n'a remplacé la déduplication **à
l'intérieur d'une même requête** : sur un rendu de `/`, l'appel a lieu dans
`generateMetadata` → `getT()`, dans `RootLayout` → `getT()`, et dans la page
elle-même. Sur `POST /api/orders`, deux fois (la route, puis `fraisLivraison`).
Soit trois à quatre allers-retours Supabase pour une ligne lue par sa clé
primaire, à chaque affichage — et toutes les pages sont dynamiques, donc à
chaque visiteur.
**Correctif :** envelopper dans `cache()` de React (`import { cache } from
"react"`), qui déduplique par requête sans réintroduire la staleness
délibérément supprimée.
**Confiance :** haute

### [X-02] Aucune configuration ESLint
**Sévérité :** P3
**Emplacement :** racine du dépôt · `package.json:8`
**Problème :** `"lint": "next lint"` est déclaré, mais il n'existe ni
`eslint.config.js`, ni `.eslintrc*`, ni dépendance ESLint — et sur Next 15,
`next lint` est déprécié. Aucun contrôle statique ne tourne donc au-delà de
TypeScript, qui ne signale ni import inutilisé ni fonction morte. C'est
précisément ce qui a laissé passer les quatre imports morts de `Bascules.tsx`
(A-11).
**Correctif :** installer ESLint et `eslint-config-next`, ou assumer l'absence.
`[NEEDS DECISION]` — ajouter une dépendance sort du cadre d'une phase 2.
**Confiance :** haute

### Ce qui a été vérifié et se tient

- **Secrets.** Les seules variables `NEXT_PUBLIC_*` sont l'URL Supabase, la clé
  anon, les deux identifiants de pixel et l'URL du site — toutes publiques par
  nature. `SUPABASE_SERVICE_ROLE_KEY` n'est lue que par `src/lib/supabase.ts`,
  dans une fonction jamais importée par un composant client : recherche faite sur
  tous les `.tsx`, seul `supabaseAdminConfigured` (un booléen) franchit la
  frontière, et depuis un composant serveur. Les modules sensibles portent
  `import "server-only"`.
- **Frontière client / serveur.** 27 composants `"use client"`, tous des feuilles
  ou des fournisseurs de contexte. Aucun n'est assez haut dans l'arbre pour tirer
  du code serveur dans le bundle. Les pages et les mises en page sont toutes des
  composants serveur.
- **Requêtes non bornées.** Les lectures du catalogue n'ont pas de `limit`, mais
  elles portent sur des tables qui ne croissent pas (7 gammes, 58 wilayas,
  quelques dizaines de formats). Les tables qui croissent sont toutes bornées :
  `orders` par `range()` avec pagination, `prospects` à 500 (voir A-06),
  statistiques et export à 5 000 avec le plafond écrit en commentaire.
- **`any` :** aucun dans tout `src/`. **Blocs `catch` vides :** aucun — tous
  portent au minimum un commentaire expliquant pourquoi l'erreur est avalée, et
  la plupart journalisent.
- **En-têtes de sécurité.** CSP, `X-Frame-Options`, HSTS, `Referrer-Policy`,
  `Permissions-Policy`, `nosniff`, plus `X-Robots-Tag: noindex` et
  `Cache-Control: no-store` sur `/admin`. Le middleware ne touche qu'aux GET, pour
  une raison documentée et juste : les actions serveur perdent leur portée de
  requête sinon.
- **Téléversements.** Liste blanche fermée de types MIME, extension déduite du
  type validé et non du nom de fichier, SVG explicitement exclu parce que le
  bucket est public. URL signée à usage unique, obtenue seulement par un admin
  connecté, et le fichier ne traverse pas le serveur. Bien fait.
- **Email.** Échappement HTML du contenu venu du formulaire public, retrait des
  retours à la ligne dans le sujet (injection d'en-tête `Bcc:`), et
  `avertirCommande` ne lève jamais — une panne d'email ne peut pas coûter une
  commande.

---

## 6. Récapitulatif

| # | Sévérité | Titre |
|---|---|---|
| A-01 | P1 | Une commande peut s'enregistrer sans ses lignes |
| A-02 | P1 | Un format peut être enregistré à 0 DA et vendu gratuitement |
| A-03 | P1 | La conversion d'une piste ne sait commander que des coffrets |
| A-04 | P1 | Une collision de référence perd la commande, sans reprise |
| A-05 | P2 | Les images téléversées ne sont jamais supprimées du stockage |
| A-06 | P2 | La liste d'appels est plafonnée à 500 sans pagination ni signal |
| A-07 | P2 | Le taux de transformation mélange deux périodes |
| A-08 | P2 | Le marquage « convertie » part sans être attendu |
| A-09 | P2 | Deux gestionnaires sur la même ligne : le dernier écrase |
| A-10 | P3 | `amorcerBase` peut échouer sur un message illisible |
| A-11 | P3 | Code mort |
| A-12 | P3 | `units_per_carton` n'est jamais écrit par le back-office |
| B-01 | P2 | Le garde-fou anti-recopie du français ne tourne que sur 2 formulaires sur 7 |
| B-02 | P2 | Un texte de réglages ne peut pas être vidé : le texte d'usine revient |
| B-03 | P2 | Une campagne en arabe se termine sur une confirmation en français |
| B-04 | P2 | Aucun sitemap ni robots.txt ; une seule langue indexable |
| B-05 | P3 | Le message de bridage des commandes est toujours en français |
| C-01 | P2 | Livraison activée sur une grille vide : plus aucune commande ne passe |
| C-02 | P2 | Arrondis : les lignes affichées peuvent ne pas faire le total affiché |
| C-03 | P3 | Aucune notion de stock (constat) |
| X-01 | P3 | `getSettings()` relu 2 à 4 fois par affichage |
| X-02 | P3 | Aucune configuration ESLint |

**Aucun P0.** Les trois portes par lesquelles on perd de l'argent ou des données
dans une boutique en ligne — falsification de prix, contrôle d'accès manquant,
RLS ouverte — sont toutes fermées, et fermées avec soin. Les quatre P1 sont des
défauts de robustesse et de couverture fonctionnelle, pas des failles.

---

## 7. Questions

Endroits où l'intention n'était pas déductible du code. Aucun n'a été tranché
dans les findings ci-dessus.

**Q1 — `mode_boutique = "produits"` est-il un mode réellement employé, ou un
vestige ?** La réponse change la sévérité de A-03. S'il est employé, la liste
d'appels est cassée en production et A-03 est le défaut le plus coûteux du lot.
S'il ne l'est pas, A-03 devient un P3 de code mort — et il faudrait alors se
demander si le mode doit être retiré plutôt que réparé.

**Q2 — Les prix peuvent-ils comporter des centimes ?** Les colonnes sont
`numeric(10,2)` et le formulaire accepte les décimales, mais l'usage algérien du
dinar les ignore. Si la réponse est non, C-02 se règle par un `Math.round()` à
l'enregistrement. Si la réponse est oui, il faut choisir une règle d'arrondi et
l'appliquer partout — affichage compris.

**Q3 — Que doit-il se passer quand un champ de coordonnées est vidé ?** B-02
suppose que vider `contact_phone` veut dire « ne rien afficher ». C'est
l'interprétation la plus probable, mais l'autre existe : le repli sur le jeu de
secours a peut-être été voulu pour qu'un site fraîchement installé ne s'ouvre
jamais sur des blancs. Si c'est le cas, alors le vrai défaut est que les valeurs
de secours sont des données de démonstration (`+213 00 00 00 00`,
`https://instagram.com/`) plutôt que rien du tout.

**Q4 — Un coffret doit-il pouvoir s'enregistrer sans traduction arabe ?**
Aujourd'hui oui, et le repli vers le français fonctionne. C'est un choix
défendable, probablement le bon — exiger trois traductions rendrait la création
d'un coffret pénible. La question est posée parce que l'audit la demandait, pas
parce que le code semble en tort.

**Q5 — La suppression d'une commande doit-elle être définitive ?**
`supprimerCommande` fait une suppression dure, avec cascade sur `order_items`.
Le dialogue prévient (« Cette action est irréversible »), mais une commande
supprimée par erreur ne se récupère pas, et elle disparaît aussi de l'historique
comptable et des statistiques. Une suppression douce avait-elle été envisagée ?

**Q6 — Quelle est la cadence de commandes attendue ?** Elle décide de A-04
(collisions de référence) et de A-06 (plafond des pistes). Le commentaire de
`data.ts:369` mentionne « mille commandes en trois jours » comme scénario
envisagé ; à ce rythme A-04 devient un incident mensuel et A-06 un plafond
atteint en quelques semaines. Si le régime réel est de quelques dizaines par
jour, les deux redescendent d'un cran.

**Q7 — Faut-il pouvoir saisir une commande à la main dans le back-office ?**
Aujourd'hui le seul chemin est la conversion d'une piste, qui exige qu'une
piste existe — donc qu'une cliente ait rempli le formulaire du site. Une
commande prise au téléphone par quelqu'un qui n'est jamais passé par le site n'a
pas de porte d'entrée. C'est peut-être délibéré ; c'est aussi ce qui rend A-03
plus coûteux qu'il n'en a l'air.
**Q8 — Faut-il une colonne `updated_at` sur les tables du catalogue ?** C'est ce
que demande A-09, resté non corrigé : sans elle, deux onglets ouverts sur le même
coffret se recouvrent en silence. La migration est courte, mais c'est une
migration.

**Q9 — `units_per_carton` : ajouter le champ, ou retirer la colonne ?** A-12.
Elle est recopiée sur chaque ligne de commande et vaut invariablement 12, faute
de formulaire pour la renseigner. Elle n'est affichée nulle part aujourd'hui.

**Q10 — Veut-on que l'arabe et l'anglais soient indexables ?** `robots.txt` et
`sitemap.xml` existent maintenant, mais `hreflang` reste sans objet tant qu'il
n'y a qu'une adresse par page. Rendre les trois langues visibles à la recherche
demande des URL par langue, donc une refonte du routage.

**Q11 — Installe-t-on ESLint ?** Rien ne tourne au-delà de TypeScript
aujourd'hui, ce qui laisse passer imports morts et fonctions inutilisées — c'est
ainsi que quatre imports morts avaient survécu dans `Bascules.tsx`.

**Q12 — La nouvelle formulation de l'accueil convient-elle ?** C-04 a remplacé
deux phrases qui vendaient le gros et le demi-gros. Le remplacement suit le
registre du reste du site, mais c'est une décision de marque : la reformuler ne
demande que d'éditer trois lignes de dictionnaire.

**Q13 — Le texte du hero en base parle encore de demi-gros.** À l'écran,
aujourd'hui, l'accueil affiche « Au détail, en demi-gros dès 5 pièces, ou en gros
par carton » — cette phrase ne vient pas du code mais de `site_settings.hero_lede`,
donc de ce qui a été saisi dans `/admin/contenu`. Elle est modifiable là, en trois
langues, et n'a pas été touchée : c'est du contenu, pas du code.

---

*Phase 1 : lecture seule, aucun fichier du projet modifié.*
*Phase 2 : dix-neuf constats corrigés, un commit par palier, `tsc` et `build`
verts après chacun. Six restent ouverts et attendent un arbitrage — Q8 à Q13.*
