# Brancher Supabase

Le site fonctionne sans Supabase en **mode démo local** : les réservations sont
alors enregistrées dans le navigateur (`localStorage`). Dès que Supabase est
configuré, le site bascule automatiquement sur la base de données partagée.

## 1. Créer la table

Le script SQL complet est dans **[`docs/supabase-schema.sql`](./supabase-schema.sql)**.

Pour l'exécuter :

1. Ouvrez votre projet dans [Supabase](https://supabase.com/dashboard) (ou Lovable Cloud).
2. Allez dans **SQL Editor → New query**.
3. Copiez-collez tout le contenu de `docs/supabase-schema.sql`.
4. Cliquez sur **Run**.

Vous pouvez aussi demander à Lovable de créer cette table à partir du même
script. **Ne créez pas de fichier de migration à la main** : le schéma est géré
par Lovable / Supabase.

Aucune policy publique n'est nécessaire : les réservations sont lues et
écrites uniquement par les server functions du site, avec la clé **service
role** côté serveur. La clé n'est donc jamais exposée au navigateur.

## 2. Renseigner les variables d'environnement

Dans Lovable Cloud, ajoutez les secrets suivants (ou copiez `.env.example`
dans un fichier `.env` en local) :

| Variable                    | Où         | Rôle                                           |
| --------------------------- | ---------- | ---------------------------------------------- |
| `VITE_SUPABASE_URL`         | navigateur | Active le mode Supabase côté client            |
| `SUPABASE_URL`              | serveur    | URL du projet pour les server functions        |
| `SUPABASE_SERVICE_ROLE_KEY` | serveur    | Écriture/lecture sécurisée (ne jamais exposer) |
| `CAISSE_CODE`               | serveur    | Code d'accès de l'espace caisse (mode Supabase) |
| `VITE_CAISSE_CODE`          | navigateur | Code d'accès en mode démo local (optionnel)    |

> Sans `VITE_SUPABASE_URL`, le site reste en mode démo local même si les
> variables serveur sont présentes.

## 3. Accéder à la caisse

- URL : `/caisse`
- Code par défaut : `noisette`
- En mode Supabase, le code est défini par `CAISSE_CODE` et vérifié **côté
  serveur** à chaque lecture ou modification.
- En mode démo local (sans Supabase), le code est défini par
  `VITE_CAISSE_CODE` et vérifié dans le navigateur. Si la variable est absente,
  le code reste `noisette`.

## 4. Fonctionnement

| Action                    | Mode Supabase                          | Mode démo      |
| ------------------------- | -------------------------------------- | -------------- |
| Réserver                  | server function → table `reservations` | `localStorage` |
| Lister les commandes      | server function + code caisse          | `localStorage` |
| Marquer payée / récupérée | server function + code caisse          | `localStorage` |
| Export CSV                | navigateur                             | navigateur     |

Le formulaire de réservation est accessible sur `/reserver`. Aucun paiement en
ligne n'est demandé : la caisse sert uniquement à suivre les encaissements sur
place.
