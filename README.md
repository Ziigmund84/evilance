# Evilance — site one page + espace admin

Site vitrine de l’agence de gestion locative Evilance (Orléans), statique et hébergé sur GitHub Pages, avec un espace d’administration branché sur Supabase.

## Structure

```
index.html                 La page d’accueil (one page)
blog.html, article.html    Le blog : liste filtrable et page de lecture d’un article
404.html                   Redirige les anciennes adresses d’articles vers la nouvelle page
assets/css/site.css        Styles (palette du logo : marine, azur, miel, ambre)
assets/js/site.js          Rendu du contenu + animations de défilement (GSAP, ScrollTrigger, Lenis)
assets/js/content-default.js  Contenu par défaut, affiché si rien n’a été modifié dans l’admin
assets/js/config.js        URL et clé publique Supabase
assets/img/                Logo vectoriel, favicon
assets/fonts/              Polices auto-hébergées (Bricolage Grotesque, Instrument Sans)
vendor/                    Bibliothèques JS (aucun CDN externe)
admin/                     Espace d’administration (connexion, édition, médias, messages)
supabase/schema.sql        Tables, règles de sécurité (RLS) et stockage des images
```

## Mise en ligne avec GitHub Pages

1. Dans le dépôt : **Settings → Pages**.
2. **Source** : *Deploy from a branch*, branche **main**, dossier **/ (root)**, puis **Save**.
3. Le site est publié à l’adresse `https://ziigmund84.github.io/evilance/` (l’admin : `…/evilance/admin/`).

Pour utiliser le nom de domaine `evilance.fr`, renseignez-le dans **Settings → Pages → Custom domain** et pointez le DNS chez OVH vers GitHub Pages. Pensez alors à ajouter la nouvelle adresse dans Supabase (**Authentication → URL Configuration**).

## Espace admin

- Connexion par e-mail et mot de passe ; « Mot de passe oublié » envoie un lien de réinitialisation.
- Chaque section du site est éditable ; **Enregistrer et publier** met le site à jour immédiatement.
- **Revenir au contenu d’origine** efface la version modifiée d’une section.
- **Articles du blog** : création, modification, brouillons et mise en ligne (éditeur de texte avec intertitres, listes, liens…).
- **Médias** : envoi et choix des images (stockées dans Supabase Storage).
- **Messages** : demandes envoyées depuis le formulaire de contact.

Seuls les comptes listés dans la table `evilance_admins` ont les droits d’écriture.

## Développement local

Aucune compilation : servez le dossier avec n’importe quel serveur statique, par exemple `python3 -m http.server`, puis ouvrez `http://localhost:8000`.
