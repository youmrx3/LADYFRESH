# Lady Fresh — site B2B / B2C

Landing page, boutique gros / demi-gros et back-office, en Next.js 15 (App
Router) + Supabase.

## Démarrer

```bash
npm install
cp .env.example .env.local   # renseignez au moins ADMIN_PASSWORD
npm run dev
```

Le site tourne sur <http://localhost:3000>, l'espace gestion sur
<http://localhost:3000/admin>.

**Le site fonctionne sans Supabase.** Tant que les variables ne sont pas
renseignées, il affiche le catalogue de référence (`src/lib/catalog.ts`) et
enregistre les commandes dans `.data/orders.json`. Utile pour tester ; à
remplacer par Supabase avant la mise en ligne.

## Brancher Supabase

1. Créez un projet Supabase.
2. Collez `supabase/schema.sql` dans le **SQL Editor** et exécutez-le. Le
   script crée les tables, les policies RLS et le bucket `media`.
3. Renseignez dans `.env.local` :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (serveur uniquement, jamais côté navigateur)
4. Relancez le serveur, ouvrez `/admin/gammes` et cliquez **Amorcer la base** :
   les 7 gammes, 22 produits et 27 formats sont copiés dans Postgres.

À partir de là, tout se pilote depuis l'admin — le code n'a plus à être touché
pour changer un prix, une gamme ou le numéro WhatsApp.

## Le modèle de données

| Table              | Rôle |
|--------------------|------|
| `gammes`           | Les 7 gammes : nom, couleur (qui sert aussi de filtre boutique), visuel |
| `product_types`    | Les types (brume, gel intime…) — des données, pas une énumération figée |
| `products`         | Un produit = un type dans une gamme (ex. brume Sensuel) |
| `product_variants` | Un format = une taille, son prix gros / demi-gros, son carton, sa photo |
| `orders`           | Une commande, quel que soit le canal |
| `order_items`      | Les lignes, avec les prix figés au moment de la commande |
| `site_settings`    | Numéro WhatsApp, seuils, textes du hero, contacts, réseaux |
| `hero_slides`      | Le slideshow d'accueil |
| `videos`           | La section « Pourquoi nous choisir » |

Le prix et la photo vivent sur le **format**, pas sur le produit : une brume
150 ml et une 250 ml n'ont ni le même tarif ni le même flacon.

### Sécurité

Les policies RLS ouvrent le catalogue en lecture publique et autorisent
l'insertion de commandes sans compte. **Aucune policy ne permet de lire les
commandes** : seul le serveur, avec la service-role key, y accède. Les prix
sont recalculés côté serveur dans `/api/orders` — le navigateur n'envoie que
des identifiants et des quantités.

## Le parcours de commande

1. Le client choisit **Gros** (au carton) ou **Demi-gros** (à la pièce).
2. Il filtre par type de produit et par couleur, puis pose ses quantités.
3. Le bordereau se remplit et vérifie le minimum : en gros, chaque référence
   doit atteindre le seuil ; en demi-gros, le total de la commande suffit,
   ce qui permet de mélanger les gammes.
4. Deux sorties, **toutes deux enregistrées** :
   - **WhatsApp** — la commande est écrite en base, puis WhatsApp s'ouvre avec
     le récapitulatif prérempli.
   - **Formulaire** — pour les clients sans WhatsApp ; nom et téléphone requis.

Les deux arrivent dans `/admin`, avec leur canal et leur statut.

## Espace gestion

`/admin`, protégé par `ADMIN_PASSWORD` et un cookie de session signé (HMAC,
httpOnly, 12 h). Pour passer à Supabase Auth plus tard, il suffit de remplacer
`isAdmin()` dans `src/lib/auth.ts`.

L'action de création est en haut de chaque page, pas en bas. Les lignes sont
repliées : un résumé lisible, l'édition sur demande. La page produits fait
2 500 px au lieu de 14 000 — on retrouve une référence sans faire défiler
vingt formulaires ouverts.

- **Commandes** — liste, détail, changement de statut, filtre par statut
- **Types de produits** — ajout, renommage, ordre. Un type encore porté par des
  produits refuse d'être supprimé, et le dit.
- **Gammes** — création, ordre, couleur, visuel
- **Produits** — type, gamme, couleur, photo
- **Formats & prix** — page à part : on choisit le produit, puis on lui donne
  un format avec son prix et sa photo
- **Contenu du site** — numéro WhatsApp, seuils, textes du hero, contacts,
  réseaux, slideshow, vidéos

Sur téléphone, la navigation passe en barre d'onglets basse — à portée de
pouce — et la barre haute se réduit au logo et aux réglages.

Les images se téléversent depuis l'ordinateur ou le téléphone, avec aperçu
immédiat. Sans Supabase, les fichiers vont dans `public/uploads/` ; avec
Supabase, dans le bucket `media`. On peut aussi coller une adresse.

Chaque page se modifie **une langue à la fois** : un sélecteur en haut choisit
la langue éditée, et seuls les champs de cette langue s'affichent. Le slug, la
couleur, l'image et l'ordre ne dépendent pas de la langue et ne s'éditent donc
que depuis le français, qui porte aussi le texte de repli.

## Pages

| Adresse | Rôle |
|---|---|
| `/` | La vitrine complète : hero, gammes, boutique, commande, vidéos |
| `/boutique` | La boutique seule, pour les campagnes publicitaires |
| `/admin` | Le back-office, accessible par l'URL uniquement |

### La page de campagne

`/boutique` ouvre le catalogue sans le hero ni les gammes : le format, les
produits, la commande. C'est l'adresse à mettre dans une publicité.

Elle réutilise exactement les mêmes composants que l'accueil, donc les mêmes
prix, le même panier — partagé par `localStorage`, un client peut commencer
là et finir sur la vitrine — et le même `/api/orders`. Une commande passée ici
est une commande comme une autre.

Ajoutez `?c=` pour savoir d'où elle vient :

```
https://ladyfresh.dz/boutique?c=insta-aout
https://ladyfresh.dz/boutique?c=facebook-ramadan
```

L'étiquette tient toute la visite (`sessionStorage`), se retrouve dans
`orders.source` et s'affiche en pastille dorée à côté de la commande dans le
suivi. Sans `?c=`, la colonne reste vide : c'est une commande directe.

## Langues

Français, arabe et anglais. **La langue est un réglage du site, choisi dans
« Contenu du site » de l'admin** — la vitrine et le back-office la suivent
tous les deux. Les visiteurs n'en changent pas : c'est une marque qui
s'adresse à un marché donné, pas un site multirégional.

L'arabe passe la page en RTL, `<html lang dir>` suit.

Les textes d'interface vivent dans `src/i18n/dictionaries/`. Le français est le
dictionnaire de référence : une clé oubliée en arabe ou en anglais casse la
compilation, elle ne peut pas passer en production.

Les textes du catalogue (accroches de gammes, hero, vidéos) ont une colonne par
langue en base — `description`, `description_ar`, `description_en`. Vide =
le français est repris. Les noms de gammes ne sont jamais traduits : ce sont
des noms de marque.

En arabe, l'interlettrage et les capitales sont désactivés : l'écriture arabe
est liée, un `letter-spacing` sépare physiquement les lettres. Les chiffres
restent latins et alignés à gauche, comme sur les factures algériennes.

## Thèmes

Clair par défaut, sombre au choix, bouton dans la barre de navigation. Le thème
est appliqué avant le premier pixel par un script inline, donc pas de
clignotement au chargement.

Les couleurs passent toutes par des jetons sémantiques (`--vitrine-bg`,
`--comptoir-surface`, `--or-trait`…) redéfinis sous `[data-theme]`. Les
composants n'écrivent jamais une valeur en dur. Tous les contrastes
texte/fond mesurés dépassent 4,5:1 dans les deux thèmes.

## Design

Deux étages. La **vitrine** porte la marque (hero, gammes, vidéos), le
**comptoir** porte le commerce (sélecteur, boutique, commande). La bascule
tombe exactement sur le choix Gros / Demi-gros. En thème clair les deux étages
sont porcelaine et blanc — le monde carrelé des visuels de campagne ; en thème
sombre la vitrine passe à l'encre et à l'or de la plaque du logo.

L'accent n'est jamais fixe : il prend la couleur de la gamme regardée. Le bloc
signature est la bande des 7 gammes — une seule rangée pleine largeur, la
colonne survolée s'ouvre, les autres se réduisent à leur couleur. L'alignement
est acquis par construction : la bande occupe toujours la largeur exacte.

Typographies : **Jost** (déplacé du logo) pour les titres, **Instrument Sans**
pour le texte, **IBM Plex Mono** pour tous les chiffres — prix, quantités,
références — parce qu'en gros, les nombres doivent s'aligner en colonne.

## Assets

Les fichiers d'origine restent dans `Data/`. Ce qui sert au site est copié et
renommé dans `public/` : `public/products` (27 flacons détourés),
`public/gammes` (7 visuels de campagne), `public/brand`, `public/videos`.

## Points à compléter

- **Vidéos** : une seule est fournie. La section s'adapte au nombre ; ajoutez
  les trois autres depuis « Contenu du site ».
- **Pièces par carton** : non précisé dans le cahier des charges. Valeurs
  posées par défaut (brume 150 ml : 24, 250 ml : 12, gel : 12, déo intime :
  24, déo femme : 12) — à corriger dans l'admin.
- **Coordonnées** : numéro WhatsApp, téléphone, e-mail, adresse et liens
  réseaux sont des valeurs d'attente, à remplir dans « Contenu du site ».
