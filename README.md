# Site du département GMP — IUT de Troyes

Site statique construit avec **Hugo** et édité avec **Decap CMS**, publié sur GitHub Pages.

- Pour le secrétariat : [GUIDE-SECRETARIAT.md](GUIDE-SECRETARIAT.md)
- Pour la maintenance : [MAINTENANCE.md](MAINTENANCE.md)

```bash
hugo server     # aperçu local sur http://localhost:1313/
hugo --minify   # construction dans public/
```

## Hébergement

Le site est construit et publié par GitHub Actions (`.github/workflows/deploy.yml`) sur GitHub Pages.
Il fonctionne aussi bien à la racine d'un domaine que dans un sous-dossier : le déploiement lui
donne son adresse réelle et les gabarits passent les chemins internes par `layouts/_partials/lien.html`.

Le dossier `_travail/` (ancienne version Astro, archives, visuels sources) n'est pas versionné
et n'est pas publié.
