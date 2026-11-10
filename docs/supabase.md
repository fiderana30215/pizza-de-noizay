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
| `CAISSE_CODE`               | serveur    | Mot de passe de l'espace admin (mode Supabase) |
| `VITE_CAISSE_CODE`          | navigateur | Mot de passe en mode démo local (optionnel)    |
| `RESEND_API_KEY`            | serveur    | Clé Resend pour les e-mails de réservation     |
| `RESERVATION_EMAIL_FROM`    | serveur    | Expéditeur vérifié (ex. `Soirée Pizza <...>`)  |
| `RESERVATION_EMAIL_REPLY_TO`| serveur    | Adresse de réponse optionnelle                 |

> Sans `VITE_SUPABASE_URL`, le site reste en mode démo local même si les
> variables serveur sont présentes.

## 3. Accéder à l'espace admin

- URL : `/caisse`
- Mot de passe par défaut : `noizay`
- En mode Supabase, le mot de passe est défini par `CAISSE_CODE` et vérifié
  **côté serveur** à chaque lecture ou modification.
- En mode démo local (sans Supabase), le mot de passe est défini par
  `VITE_CAISSE_CODE` et vérifié dans le navigateur. Si la variable est absente,
  le mot de passe reste `noizay`. Il est rappelé sur la page de connexion.

## 4. Envoyer les e-mails de réservation

Les e-mails partent via [Resend](https://resend.com) :

1. Créez un compte Resend et une clé API.
2. Ajoutez le secret `RESEND_API_KEY`.
3. Vérifiez votre domaine dans Resend, puis renseignez `RESERVATION_EMAIL_FROM`
   avec un expéditeur de ce domaine (en test, `onboarding@resend.dev` fonctionne
   uniquement vers l'adresse du compte Resend).

Trois e-mails sont envoyés au client :

| Moment                                | Contenu de l'e-mail                        |
| ------------------------------------- | ------------------------------------------ |
| Réservation enregistrée               | Confirmation + récapitulatif + n° de réservation |
| Statut passé à **payé** dans l'admin  | Confirmation du paiement                   |
| Statut passé à **récupéré**           | Message de remerciement                    |

Ces e-mails ne partent qu'une fois par changement de statut : réenregistrer le
même statut ne renvoie rien.

Sans `RESEND_API_KEY`, la réservation est quand même enregistrée : l'écran de
confirmation indique simplement que l'e-mail n'a pas pu être envoyé.

## 5. Fonctionnement

| Action                    | Mode Supabase                          | Mode démo      |
| ------------------------- | -------------------------------------- | -------------- |
| Réserver                  | server function → table `reservations` | `localStorage` |
| Lister les commandes      | server function + mot de passe admin   | `localStorage` |
| Marquer payée / récupérée | server function + mot de passe admin   | `localStorage` |
| Export CSV                | navigateur                             | navigateur     |

Le formulaire de réservation est accessible sur `/reserver`. Aucun paiement en
ligne n'est demandé : le paiement se fait sur place, en espèces ou par carte
bancaire, au moment du retrait. L'espace admin sert uniquement à suivre les
encaissements.
