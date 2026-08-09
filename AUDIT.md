# Audit — sécurité, performance, mise en production

État au 9 août 2026. Ce document liste ce qui a été trouvé, ce qui a été
corrigé, et ce qui reste ouvert. Les points ouverts sont volontairement écrits
sans euphémisme : mieux vaut une limite connue qu'une fausse assurance.

---

## 1. Ce qui était cassé — corrigé

### 1.1 Perte silencieuse de commandes en production · **critique**

`createOrder()` écrivait le repli local sans vérifier le résultat. Sur Vercel,
le disque est en lecture seule : l'écriture échouait, la fonction rendait
quand même une référence, et le client voyait « commande enregistrée » pour
une commande qui n'existait nulle part.

Corrigé : l'échec d'écriture lève, l'API répond une erreur, et le repli refuse
de démarrer si `VERCEL` ou `AWS_LAMBDA_FUNCTION_NAME` est présent.

### 1.2 Insertion publique des commandes · **critique**

La policy RLS `public insert orders … with check (true)` autorisait n'importe
qui à écrire directement dans `orders` avec la clé anon — clé publique par
construction, lisible dans le bundle. Un total à 0 DA, un statut « livrée »,
un volume arbitraire : tout passait, en contournant le recalcul des prix fait
côté serveur.

Corrigé : les policies d'insertion sont supprimées. RLS active sans policy =
tout refusé à la clé anon. Les commandes passent uniquement par `/api/orders`,
qui recalcule les prix puis écrit avec la service-role key.

**À faire côté Supabase :** relancer `supabase/schema.sql`, qui contient les
`drop policy` correspondants.

### 1.3 Comparaison du mot de passe en temps variable

`saisi !== attendu` s'arrête au premier caractère différent : le temps de
réponse trahit le préfixe correct. Remplacé par une comparaison à temps
constant, sur des empreintes HMAC pour ne pas révéler non plus la longueur.

### 1.4 Jeton de session prévisible

Le jeton était `expiration.signature(expiration)` : deux sessions ouvertes à
la même milliseconde partageaient le même jeton. Un aléa de 72 bits est
désormais inclus dans la charge signée.

### 1.5 Entrées non bornées sur `/api/orders`

Aucune limite sur le nombre de lignes, les quantités, la taille du corps ni la
longueur des champs texte. Une requête forgée pouvait insérer des lignes
absurdes ou pousser des mégaoctets dans les colonnes.

Corrigé : corps ≤ 64 Ko, ≤ 100 lignes, quantité ≤ 100 000, et troncature des
champs client (nom 120, téléphone 40, wilaya 80, adresse 300, note 500).
Vérifié : une note de 2 000 caractères ressort à 500.

### 1.6 Téléversement sans liste blanche · **important**

Le bucket `media` est public. Un SVG ou un HTML téléversé y aurait été servi
depuis une origine de confiance et aurait exécuté son script.

Corrigé : seuls JPEG, PNG, WebP, AVIF, MP4 et WebM sont acceptés, et
l'extension du fichier écrit est déduite du type MIME validé, jamais du nom
fourni.

### 1.7 En-têtes de sécurité absents

Ajoutés sur la vitrine : CSP, `X-Frame-Options: DENY`, `nosniff`,
`Referrer-Policy`, `Permissions-Policy`, HSTS. `x-powered-by` retiré.

---

### 1.8 La CSP tuait tout le JavaScript en développement · **critique**

`script-src 'self' 'unsafe-inline'` interdit `eval()`. Le bundler de Next s'en
sert pour évaluer ses modules en développement : aucun script ne s'exécutait,
React n'hydratait pas, et **toute la vitrine devenait morte** — diaporama figé,
bande des gammes inerte, filtres et panier sans effet, barre de navigation qui
ne réagissait plus au défilement. Rien n'apparaissait cassé à l'œil : le HTML
rendu par le serveur était bien là, seul le comportement manquait.

Corrigé : `unsafe-eval` et le websocket local sont ajoutés **en développement
seulement**. La CSP de production reste stricte, et l'hydratation y a été
vérifiée sur un vrai `next build && next start`, pas déduite.

Leçon retenue : une CSP se vérifie dans les deux modes. Elle ne casse pas la
page, elle casse le comportement — et le rendu serveur masque le symptôme.

## 2. Un piège Next.js rencontré en chemin

Poser les en-têtes via `headers()` dans `next.config.ts` avec
`source: "/:path*"` **casse toutes les actions serveur** : `cookies()` lève
« called outside a request scope » et la connexion à l'admin rend une 500.
Même effet si un middleware intercepte la route sur laquelle une action poste.

Trouvé par bissection, pas par lecture. Conséquence sur l'architecture :

- les en-têtes sont posés par `src/middleware.ts`, sur les réponses GET/HEAD ;
- le matcher **exclut `/admin`**, parce que tout le back-office fonctionne par
  actions serveur ;
- `/admin` porte donc son `noindex` par métadonnée et non par en-tête.

**Limite assumée :** les pages d'administration n'ont pas de CSP. Elles sont
derrière mot de passe et non indexées ; la surface exposée au public, elle,
est couverte.

---

## 3. Bridage du débit

| Cible | Limite | Où |
|---|---|---|
| `/api/orders` | 20 par IP et par heure | middleware |
| Connexion admin | 30 échecs / 15 min, global | action |

Le compteur de connexion est **global et non par IP** : `headers()` est
inutilisable dans une action passée à `useActionState`, et le middleware ne
peut pas intercepter ces requêtes sans les casser (§2). Un attaquant peut donc
saturer le compteur et gêner le propriétaire un quart d'heure — mais il ne
peut plus parcourir un dictionnaire. Les tentatives réussies ne comptent pas :
le bon mot de passe passe même pendant une salve.

**La mémoire est propre à chaque instance.** Sur Vercel, une attaque répartie
obtient plus d'essais que la limite affichée, et le compteur repart à zéro
après un démarrage à froid. Pour un vrai plafond, remplacer la `Map` de
`src/lib/limite.ts` par Vercel KV ou Upstash : la signature ne change pas.

---

## 4. Performance

### 4.1 Images — 16,6 Mo → 1,2 Mo

Les visuels de campagne étaient des PNG de 1,7 à 2,2 Mo. Convertis en WebP,
bornés à 1 400 px de large :

| | avant | après |
|---|---|---|
| `public/gammes` | 12 Mo | 692 Ko |
| `public/products` | 5,2 Mo | 612 Ko |
| `public/brand` | 148 Ko | 76 Ko |

`deviceSizes` et `imageSizes` sont réduits aux tailles réellement utilisées :
moins de variantes à générer et à facturer côté Vercel.

### 4.2 Catalogue — 6 requêtes par affichage → 0 en régime établi

Chaque rendu de la page d'accueil relisait gammes, types, produits, réglages,
visuels et vidéos. Les six lectures passent par `unstable_cache`, étiquetées
`catalogue`, invalidées par `revalidateTag` à chaque écriture admin : les
changements restent immédiats.

Détail d'implémentation qui compte : le wrapper est construit à la première
lecture, pas au chargement du module. Créé au niveau module, il s'installait
dès l'import de `data.ts` — y compris depuis `actions.ts` — et sortait les
actions de leur portée de requête.

### 4.3 Fonte arabe — plus téléchargée à tort

Noto Kufi Arabic était préchargée pour tous. `preload: false` : le navigateur
ne la cherche que s'il a de l'arabe à rendre.

### 4.4 Déploiement — 75 Mo en moins

`.vercelignore` écarte `Data/` (sources d'origine), `.data/` et
`public/uploads/`.

---

## 5. Ce qui reste ouvert

1. **La vidéo pèse 7 Mo** dans `public/videos`. Elle sort du CDN Vercel donc
   c'est tenable, mais sa place est dans Supabase Storage — surtout quand les
   trois autres arriveront. Comptez ~28 Mo sinon.
2. **Le bridage n'est pas partagé entre instances** (§3).
3. **`ADMIN_SESSION_SECRET` retombe sur `ADMIN_PASSWORD`** s'il n'est pas
   défini : changer le mot de passe déconnecte alors tout le monde. Définir
   les deux séparément.
4. **Pas de CSP sur `/admin`** (§2).
5. **Session admin unique**, sans rôles ni révocation individuelle. Suffisant
   pour un propriétaire ; à remplacer par Supabase Auth si l'équipe grandit.
6. **`unsafe-inline` dans la CSP scripts**, imposé par l'hydratation Next et le
   script de thème. Une CSP à nonce forcerait un rendu dynamique de chaque
   page.

---

## 6. Avant la mise en ligne

```bash
# Variables sur Vercel
ADMIN_PASSWORD=…              # long et unique
ADMIN_SESSION_SECRET=…        # distinct du mot de passe
NEXT_PUBLIC_SUPABASE_URL=…
NEXT_PUBLIC_SUPABASE_ANON_KEY=…
SUPABASE_SERVICE_ROLE_KEY=…   # jamais préfixé NEXT_PUBLIC_
```

Puis, dans l'ordre : exécuter `supabase/schema.sql`, déployer, ouvrir
`/admin/gammes` et lancer **Amorcer la base**.

Vérifier après déploiement : une commande de test arrive bien dans
`/admin`, et `curl -I` sur la page d'accueil renvoie la CSP.
