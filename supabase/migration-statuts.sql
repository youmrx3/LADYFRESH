-- ============================================================================
-- Bascule des anciens états de commande — à passer UNE FOIS, après schema.sql
-- ============================================================================
--
-- Pourquoi un fichier à part.
--
-- Postgres refuse d'employer une valeur d'énuméré dans la transaction même où
-- elle vient d'être ajoutée. `schema.sql` ajoute « confirmee » et « retour » à
-- `order_status` ; cette mise à jour doit donc attendre la transaction
-- suivante. L'éditeur SQL de Supabase exécutant tout un fichier d'un bloc, la
-- séparation est la seule façon d'avoir une bascule qui réussit vraiment
-- plutôt qu'une bascule qui échoue en silence.
--
-- Ordre : d'abord `schema.sql`, puis ce fichier.
--
-- Le suivi d'expédition se fait chez le transporteur, pas ici : « en cours »,
-- « traitée » et « livrée » décrivaient toutes une commande déjà confirmée au
-- téléphone. Elles deviennent donc « confirmée ».

update orders
   set status = 'confirmee'
 where status::text in ('en_cours', 'traitee', 'livree');

-- Vérification : doit renvoyer trois lignes au plus — nouvelle, confirmee,
-- retour. Si « en_cours » ou « traitee » y figure encore, la requête ci-dessus
-- n'est pas passée.
select status, count(*) from orders group by status order by status;
