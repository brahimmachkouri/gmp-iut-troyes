# Maintenance du site GMP

Une page pour la personne qui reprend le site sans l'avoir construit.

## Comment ça marche

```
Secrétariat ──► /admin/ (Decap CMS) ──► dépôt GitHub (branche main)
                    │                          │
                    └─ connexion via le Worker  └─► GitHub Actions : hugo --minify ──► GitHub Pages
                       Cloudflare oauth-worker/
```

- **Hugo** (un seul programme, aucune dépendance) construit le site à partir de `content/`, `data/`,
  `layouts/`, `assets/` et `static/`. Pas de Node, pas de npm.
- **Decap CMS** (`static/admin/`) est l'interface d'édition. Chaque « Publier » crée un commit sur `main`.
- **GitHub Actions** (`.github/workflows/deploy.yml`) reconstruit et publie à chaque commit.
- **oauth-worker/** : petit Worker Cloudflare qui gère la connexion GitHub de Decap.

## Travailler en local

```bash
brew install hugo        # une fois
hugo server              # puis ouvrir http://localhost:1313/
hugo --minify            # construction de production (dossier public/)
```

**Essayer l'interface d'administration sans GitHub** : dans un second terminal, lancer
`npx decap-server` (Node requis, uniquement sur l'ordinateur de test) depuis le dossier du
projet, puis ouvrir http://localhost:1313/admin/. « Publier » écrit alors directement dans
les fichiers du projet (`local_backend: true` dans `static/admin/config.yml`, ignoré en ligne).
Après une modification de `config.yml`, recharger l'administration avec Cmd+Maj+R, car le
navigateur garde l'ancienne configuration en cache.

**Marqueur `fiche:`** : les actualités portent `fiche: actualite` et les pages de ressources
`fiche: ressource`. Decap n'affiche que les fichiers qui portent ce marqueur, ce qui masque
les fichiers techniques `_index.md` des sections : si on les modifiait depuis l'interface, ils
écraseraient la page de la section. Un fichier ajouté à la main dans
`content/actualites/` ou `content/ressources/` doit donc porter ce marqueur pour apparaître
dans l'interface.

## Où sont les choses

| Quoi | Où |
|---|---|
| Emplois du temps (une fiche par semaine) | `data/edt/*.yml`, PDF dans `static/fichiers/edt/` |
| Texte de la page Emploi du temps | `content/emploi-du-temps/_index.md` |
| Rubriques de documents | `data/rubriques.yaml` **et** `static/admin/config.yml` |
| Documents publiés (fiches) | `data/documents/*.yml` |
| Fichiers PDF déposés | `static/fichiers/` |
| Actualités | `content/actualites/` |
| Pages de ressources | `content/ressources/` |
| Coordonnées, liens | `data/contact.yaml`, `data/liens.yaml` |
| Menu principal | `hugo.toml` |
| Tutoriel vidéo du secrétariat | dépôt GitHub `brahimmachkouri/videos`, `gmp/formation-admin.mp4` |
| Gabarits, style, script | `layouts/`, `assets/css/style.css`, `assets/js/app.js` |

**Mécanisme des documents** : `content/documents/_content.gotmpl` crée une page `/documents/<id>/`
pour chaque rubrique marquée `page: true`. Cette page affiche le document le plus récent de la
rubrique (date « Mis à jour le », puis heure de création à date égale). L'adresse ne dépend jamais
du nom du fichier.

**Emplois du temps** : `layouts/_partials/edt-semaines.html` lit `data/edt/`, ramène chaque date au
lundi et garde, pour une même semaine, la fiche créée en dernier. La page `/emploi-du-temps/`
(même adresse que l'ancien site) calcule « Cette semaine » et « Semaine prochaine » **au moment de
la construction**. C'est pourquoi le workflow reconstruit le site **chaque nuit** (`schedule`).
Attention : GitHub suspend les tâches planifiées d'un dépôt sans aucun commit depuis 60 jours.
Pendant l'année, les publications hebdomadaires suffisent à l'éviter ; à la rentrée, vérifier dans
l'onglet Actions que « Publier le site » tourne bien chaque nuit (le réactiver sinon).

Pour tester une date précise en local : `hugo server --clock 2026-11-25T10:00:00+01:00`.

**Liens sortants** : `layouts/_markup/render-link.html` fait ouvrir dans un nouvel onglet tout lien
écrit dans un texte qui mène vers un autre site ou vers un fichier (PDF, Word…), avec une flèche ↗ et
la mention cachée « (nouvel onglet) » pour les lecteurs d'écran (RGAA). Rien à faire côté secrétariat.
Dans les gabarits, les liens sortants portent `target="_blank" rel="noopener"` et la même mention.

**Tutoriel vidéo** : la vidéo est dans un dépôt à part (`brahimmachkouri/videos`, GitHub Pages), pour
ne pas alourdir l'historique de celui-ci. Adresse : https://brahimmachkouri.github.io/videos/gmp/formation-admin.mp4
Pour la mettre à jour, remplacer le fichier dans ce dépôt **en gardant le même nom et le même dossier**
(cache : 10 minutes). Si l'adresse change, la modifier dans `static/admin/index.html` et
`GUIDE-SECRETARIAT.md`. Le bouton est masqué sur téléphone et tablette, ainsi que dans les formulaires
quand la fenêtre fait 1200 px ou moins (il recouvrirait les champs) ; cette dernière règle repose
sur la classe `EditorControlBar` de Decap, à revérifier lors d'un changement de version.

## Ajouter une rubrique

Aujourd'hui, il n'existe qu'une rubrique, `autre` (documents ponctuels, sans page dédiée) : la charte,
le règlement et les consignes sont des liens vers les sources officielles (page « Documents et
consignes »). Le mécanisme « page à adresse fixe = document le plus récent » reste disponible :

1. Ajouter un bloc dans `data/rubriques.yaml` (`id` sans accent ni espace, `titre`, `description`, `page: true`).
2. Dans `static/admin/config.yml`, collection `documents`, remplacer le champ caché `rubrique` par une
   liste de choix (`widget: select`, `options` : `autre` + la nouvelle rubrique).
3. Pour afficher l'encadré « dernier document » dans une page de ressources, ajouter `documents: [<id>]`
   dans son en-tête (et, si besoin, le champ correspondant dans la collection `ressources`).
4. Commit sur `main`. La page `/documents/<id>/` existe dès la publication.

Ne jamais renommer l'`id` d'une rubrique existante : son adresse publique changerait.

## Donner ou retirer l'accès à une personne

- **Donner** : GitHub → dépôt → Settings → Collaborators → Add people, rôle **Write**.
  La personne crée un compte GitHub (double authentification obligatoire), accepte l'invitation,
  puis se connecte sur `/admin/`. Lui remettre `GUIDE-SECRETARIAT.md`.
- **Retirer** : même écran → Remove. L'accès à `/admin/` est coupé immédiatement.

## Quand une publication échoue

1. GitHub → dépôt → onglet **Actions** : le dernier passage en rouge indique l'erreur.
2. Cause la plus fréquente : un fichier modifié à la main avec une erreur de syntaxe YAML.
   Corriger le fichier, ou annuler le commit fautif (`git revert`).
3. Vérifier en local avec `hugo --minify` : il doit se terminer sans `ERROR` ni `WARN`.

## Si la connexion à /admin/ échoue

- Le Worker répond-il ? `https://<worker>/auth` doit rediriger vers GitHub.
- Secrets du Worker : `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` (`wrangler secret put …`).
- `SITE_ORIGIN` dans `oauth-worker/wrangler.toml` = adresse exacte du site.
- Dépôt **privé** : `GITHUB_SCOPE` doit valoir `repo` (et non `public_repo`).
- L'adresse de rappel de l'application OAuth GitHub doit être `https://<worker>/callback`.

## Mises à jour (rarement nécessaires)

- **Hugo** : version figée dans `.github/workflows/deploy.yml` (`HUGO_VERSION`). Pour monter de
  version : installer la même en local, lancer `hugo --minify`, corriger les éventuels `WARN`,
  puis changer la valeur.
- **Decap CMS** : version figée dans `static/admin/index.html`. Même principe : tester `/admin/`
  avant de changer.
