# Pizza Night Noizay

Je suis Pascal, je suis passant de vente pour une soirée organisée par l'école de la Caisse de Noizay. On fait toutes les consignes, on a expliqué un peu, c'était une soirée pizza où l'argent est redistribué après pour l'école. Il faut que je lui ai fait une page qui soit jolie, que ça fasse un peu triolat, s'il vous plaît, et qu'il puisse y avoir un lien de réservation pour les commandes et pas de paiement. En fait, là, c'est un truc gratuit qu'on fait et l'idée, c'est que la commune, normalement, devrait vouloir représenter Internet et qu'ils voient qu'on puisse, qu'on peut le faire et qu'on est sympa avec eux et que du coup, après, ils nous demandent de refaire leur site web pour normalement, ça doit être fait. Merci beaucoup et vous hésitez pas si vous avez des questions. Et pareil, là, je pense que Nellie ne nous donnera pas le gars du base tout de suite, donc ça, ce qu'on ne peut pas faire aujourd'hui, c'est très top. Merci.

## Fonctionnalités

- **Accueil** (`/`) : présentation de la soirée, menu des pizzas, infos pratiques et FAQ.
- **Réservation** (`/reserver`) : commande de pizzas avec paiement en espèces au retrait ou en ligne
  via HelloAsso. Le paiement en ligne est vérifié côté serveur avant de confirmer la réservation.
  Un e-mail est envoyé à la réservation, puis au paiement confirmé ou au retrait.
- **Admin** (`/caisse`) : espace bénévoles protégé par un mot de passe, suivi des commandes,
  statuts payée/récupérée (avec e-mail au client), total encaissé et export CSV.
- **Supabase** : les réservations sont partagées entre appareils dès que Supabase est configuré.
  Sans configuration, le site fonctionne en mode démo local (`localStorage`).

Voir [docs/supabase.md](docs/supabase.md) pour la configuration, et
[docs/supabase-schema.sql](docs/supabase-schema.sql) pour le script SQL à exécuter dans Supabase.

## Configuration du paiement HelloAsso

Configurer ces variables dans l'environnement **serveur** de déploiement (ne pas exposer le secret
dans une variable `VITE_`) :

- `HELLOASSO_CLIENT_ID` et `HELLOASSO_CLIENT_SECRET` : identifiants API de l'association.
- `PUBLIC_SITE_URL` : URL publique HTTPS du site.
- `VITE_HELLOASSO_ENABLED=true` : active l'option de paiement après configuration des identifiants.

L'intégration utilise le slug `association-des-parents-d-eleves-de-noizay`. L'enregistrement des
réservations dans Supabase est nécessaire pour le paiement en ligne.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/ea625867-ed89-46e1-a01b-1db746a0ac67).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
