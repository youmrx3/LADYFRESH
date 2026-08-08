# Lady Fresh — Site Web B2B / B2C (Landing Page + Boutique + Admin)

## 0. Contexte & Objectif

Créer le site web complet de **Lady Fresh**, marque algérienne de cosmétiques (brumes, gel intime, déodorant intime, déodorant femme).

Le site doit servir **deux types de clients** :
- **B2C / Détail** : navigation type landing page élégante, découverte de la marque.
- **B2B / Vente en gros** : achat par **Gros** (cartons) ou **Demi-Gros** (à partir de 5 pièces), avec commande finalisée via **WhatsApp** (+ solution alternative pour les clients sans WhatsApp).

Le site doit être **parfaitement responsive** (PC et mobile), rapide, léger, et fidèle à l'identité visuelle de la marque.

**Design** : utiliser obligatoirement le skill `frontend-design` pour toutes les décisions UI/UX (typographie, palette, spacing, composants).

---

## 1. Stack Technique

- **Frontend** : Next.js (App Router)
- **Base de données** : Supabase (Postgres)
- **Responsive** : mobile-first, breakpoints desktop/tablette/mobile
- **Performance** : chargement rapide, images optimisées (Next/Image), lazy loading des sections lourdes (vidéos, slideshow)
- **Admin Panel** : interface back-office dédiée, protégée par authentification

---

## 2. Structure de la Page d'Accueil (Landing Page)

### 2.1 Navbar
- Logo Lady Fresh
- Liens de navigation (Accueil, Nos Gammes, Boutique, Comment Commander, Contact)
- CTA visible (ex: "Commander" ou "Boutique")
- Version mobile : menu burger

### 2.2 Hero Section
- Texte à **gauche et à droite** (mise en page symétrique ou alternée)
- **Slideshow dynamique** d'images produits au centre/à droite
- Message d'accroche fort (identité de marque : élégance, fraîcheur, confiance)
- CTA principal vers la boutique

### 2.3 Section "Comment Commander"
- Section courte et simple expliquant le processus de commande via WhatsApp
- Format visuel type étapes (1 → 2 → 3)
- Ton simple et rassurant

### 2.4 Section "Nos Gammes" (Nos 7 Gammes)
- **Un seul bloc horizontal** (carrousel ou scroll horizontal) affichant les **7 gammes** de la marque
- Chaque gamme affiche :
  - Nom de la gamme
  - Petite image représentative
  - Liste/aperçu des produits qu'elle contient
- Alignement parfait, équilibre visuel, espacement homogène
- **Gérable entièrement depuis l'admin panel** (ajout/suppression/modification de gammes et produits associés)

### 2.5 Sélecteur de Type d'Achat (Gros / Demi-Gros)
- Boutons de sélection clairs : **Gros** ou **Demi-Gros**
- **Gros** : quantité minimale en **cartons**, seuil défini dans l'admin panel
- **Demi-Gros** : quantité minimale à partir de **5 pièces**, seuil défini dans l'admin panel
- Ce choix conditionne l'affichage des prix et des quantités dans la boutique

### 2.6 Section Boutique (Shop)
Design optimisé pour l'e-commerce en gros, avec grille de produits compacte et efficace.

**Filtres** :
- Par **type de produit** (ex: Gel Intime, Déodorant Intime, Déodorant Femme, Brume) — **pas par gamme**
- Par **couleur** (couleur rouge affichée par défaut en premier)

**Fiche produit** :
- Image du produit
- Nom, taille (150ml / 250ml / autre selon le produit — géré en admin)
- Prix selon le type d'achat sélectionné (Gros / Demi-Gros)
- Sélecteur de quantité (nombre de pièces ou cartons)
- Ajout au récapitulatif de commande

**Parcours client** :
1. Client choisit Gros ou Demi-Gros
2. Parcourt la boutique, filtre par type de produit / couleur
3. Sélectionne les produits + quantités
4. Arrive au bouton **"Commander"**

### 2.7 Finalisation de Commande (Checkout)
- Bouton **"Commander via WhatsApp"** :
  - Numéro WhatsApp défini dans l'admin panel
  - Génère un message pré-rempli avec le récapitulatif de la commande (produits, quantités, type Gros/Demi-Gros, total)
- **Solution alternative** (pour clients sans WhatsApp) :
  - Formulaire de commande classique (nom, téléphone, adresse, récapitulatif produits)
  - Envoi de la commande directement dans le système
- **Toutes les commandes** (via WhatsApp ou formulaire) doivent apparaître dans la section **"Commandes"** de l'admin panel

### 2.8 Section Vidéos "Pourquoi nous choisir"
- 4 vidéos (upload géré depuis l'admin panel)
- Mise en page en grille ou carrousel, lecture au clic ou autoplay muet

### 2.9 CTA Dynamique
- Bloc Call-to-Action animé/dynamique, incitant à commander ou contacter la marque

### 2.10 Footer
- Informations de contact
- Liens réseaux sociaux
- Liens rapides (Gammes, Boutique, Comment commander)
- Mentions légales / copyright

---

## 3. Grille Tarifaire (Prix Fixes)

| Produit | Taille | Prix Demi-Gros | Prix Gros |
|---|---|---|---|
| Brume | 250ml | 540 DA | 520 DA |
| Brume | 150ml | 440 DA | 425 DA |
| Gel Intime | — | 410 DA | 395 DA |
| Déodorant Intime | — | 330 DA | 315 DA |
| Déodorant Femme | — | 205 DA | 195 DA |

> Ces prix sont fixes et doivent être **modifiables uniquement depuis l'admin panel**, sans toucher au code.

---

## 4. Structure des Données (Modèle Conceptuel)

- **Gamme** : nom, image, description, liste de produits associés
- **Produit** :
  - Nom, type (Gel Intime / Déodorant Intime / Déodorant Femme / Brume)
  - Gamme associée
  - Taille(s) disponible(s) (150ml, 250ml, etc. — variable selon produit)
  - Couleur
  - Image(s)
  - Prix Demi-Gros / Prix Gros (selon taille)
  - Quantité par carton (définie en admin)
  - Seuil minimum Gros (en cartons) et Demi-Gros (en pièces, à partir de 5)
- **Commande** :
  - Client (nom, téléphone, adresse si formulaire)
  - Liste des produits + quantités + type d'achat (Gros/Demi-Gros)
  - Canal (WhatsApp ou formulaire)
  - Statut (nouvelle, en cours, traitée, livrée)
  - Date

---

## 5. Admin Panel — Fonctionnalités

- **Gestion des Gammes** : créer/modifier/supprimer les 7 gammes, y associer des produits, image de couverture
- **Gestion des Produits** :
  - Infos produit (nom, type, taille, couleur, images)
  - Prix Gros / Demi-Gros par taille
  - Nombre de pièces par carton
  - Seuils Gros (à partir de X cartons) et Demi-Gros (à partir de 5 pièces, modifiable)
- **Gestion des Commandes** :
  - Liste de toutes les commandes (WhatsApp + formulaire)
  - Détails (produits, quantités, client, statut)
  - Changement de statut
- **Gestion du Contenu** :
  - Numéro WhatsApp de commande
  - Vidéos de la section "Pourquoi nous choisir" (upload/remplacement)
  - Images du slideshow Hero
  - Textes des sections (si besoin)

---

## 6. Priorités Techniques

- Design fidèle à l'identité Lady Fresh (via skill `frontend-design`)
- Performance et légèreté (Next.js, images optimisées, chargement progressif)
- Responsive parfait PC + Mobile (tester les deux systématiquement)
- Alignement et équilibre visuel irréprochables, en particulier sur la section "Nos Gammes"
- Base de données Supabase : structure durable, facile à maintenir, sauvegarde/récupération fiable
- Ne pas exécuter le projet s'il ne fonctionne pas correctement — signaler le problème plutôt que de forcer un run

---

## 7. Assets à Fournir (à uploader séparément)

- Logo Lady Fresh (formats vectoriel + PNG)
- Photos produits (les 7 gammes)
- Vidéos "Pourquoi nous choisir" (4 vidéos)
- Palette de couleurs de la marque (si définie)
- Contenu textuel définitif (accroche hero, description gammes, etc.)
