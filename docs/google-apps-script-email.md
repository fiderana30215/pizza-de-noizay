# Utiliser Gmail via Google Apps Script

Cette option envoie les confirmations avec le compte Google qui possède le script. Elle ne demande pas de domaine personnalisé, mais reste soumise aux quotas Gmail / Apps Script et aux protections anti-spam de Google. Elle ne garantit pas la livraison en boîte de réception.

## 1. Créer le script

1. Connectez-vous au compte Gmail qui servira d'expéditeur.
2. Ouvrez [script.google.com](https://script.google.com/) et créez un projet.
3. Remplacez le contenu du fichier `Code.gs` par le contenu de [`google-apps-script-email.gs`](./google-apps-script-email.gs), puis enregistrez.
4. Dans **Project Settings → Script properties**, ajoutez la propriété `EMAIL_SHARED_SECRET`. Mettez une longue valeur aléatoire (au moins 32 caractères). Ne la publiez pas et ne la mettez pas dans le code source.

## 2. Déployer comme Web App

1. Cliquez sur **Deploy → New deployment**.
2. Sélectionnez le type **Web app**.
3. Choisissez **Execute as: Me** afin que l'envoi parte de votre compte.
4. Pour que Vercel puisse appeler le script, réglez **Who has access** sur **Anyone**. L'URL est publique : la propriété secrète est obligatoire pour empêcher les appels non autorisés. Ne journalisez ni ne partagez cette valeur.
5. Cliquez sur **Deploy**, accordez les autorisations Gmail demandées, puis copiez l'URL de Web App se terminant par `/exec`.

Si vous modifiez le code après le déploiement, créez une nouvelle version via **Deploy → Manage deployments → Edit → New version → Deploy**.

## 3. Configurer le site local

Dans le fichier `.env` local, ajoutez ou remplacez ces variables :

```dotenv
GOOGLE_SCRIPT_EMAIL_URL=https://script.google.com/macros/s/ID_DU_DEPLOIEMENT/exec
GOOGLE_SCRIPT_EMAIL_SECRET=la_meme_valeur_aleatoire_que_dans_script_properties
```

Ne mettez pas ces variables sous un nom commençant par `VITE_`. Redémarrez ensuite le serveur local (`npm run dev`). Si `GOOGLE_SCRIPT_EMAIL_URL` est défini, le site choisit Apps Script avant Resend.

## 4. Configurer Vercel

Dans le projet Vercel, ouvrez **Settings → Environment Variables** et ajoutez `GOOGLE_SCRIPT_EMAIL_URL` ainsi que `GOOGLE_SCRIPT_EMAIL_SECRET` pour **Production** (et Preview si nécessaire). Utilisez les mêmes valeurs que ci-dessus. Redéployez après l'enregistrement.

Une fois le test réussi, vous pouvez retirer `RESEND_API_KEY` des variables locales et de Vercel si elle n'est plus utilisée.

## 5. Tester

Effectuez une réservation avec une adresse e-mail que vous contrôlez. Vérifiez la boîte de réception, les indésirables, puis le compte Gmail expéditeur dans **Sent**. Si l'écran indique encore un échec, vérifiez les logs du serveur local ou les Runtime Logs de Vercel et assurez-vous que :

- l'URL est celle du déploiement `/exec`, pas l'URL de l'éditeur `/dev` ;
- le déploiement autorise **Anyone** et s'exécute en tant que propriétaire ;
- la propriété `EMAIL_SHARED_SECRET` est identique à `GOOGLE_SCRIPT_EMAIL_SECRET` ;
- le propriétaire a autorisé Gmail et n'a pas dépassé ses quotas d'envoi.

Réponses diagnostiques du script : `configuration_error` signifie que la
propriété `EMAIL_SHARED_SECRET` manque dans **Project Settings → Script
properties** du projet Apps Script ; `unauthorized` signifie que le secret du
site ne correspond pas à cette propriété. Une réponse `ok` confirme que Gmail
a accepté l'envoi.

Le endpoint renvoie exactement `ok` uniquement lorsque `GmailApp.sendEmail` a accepté l'envoi. Les limites Google et les filtres anti-spam peuvent cependant retarder ou empêcher la livraison finale. Une réservation reste enregistrée si le mail échoue.
