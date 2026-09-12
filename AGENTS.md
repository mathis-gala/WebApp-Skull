# Instructions pour les agents

## Avant de modifier le projet

1. Lire `docs/CONTEXT.md`, puis les documents liés au changement.
2. Inspecter `git status --short` et préserver les changements existants.
3. Rechercher les symboles, contrats et consommateurs avant de créer une
   nouvelle abstraction.
4. Vérifier les règles dans `docs/architecture.md` et les éléments existants
   dans `docs/REUSE.md`.

## Frontières

- `apps/api` compose NestJS, Better Auth et les adaptateurs serveur.
- `apps/web` ne doit importer aucun module serveur.
- `packages/contracts` contient les schémas partagés sans dépendance framework.
- `packages/core` reste indépendant de NestJS, React, Drizzle et Better Auth.
- `packages/database` possède les schémas et migrations Drizzle.
- `packages/ui` contient seulement des primitives UI réutilisables.

Ne pas ajouter de couche, repository ou port sans besoin concret. Valider les
entrées externes à leur frontière. Ne jamais lire, modifier ou versionner un
fichier `.env` réel. Ne jamais migrer, réinitialiser ou alimenter une base
distante ou non vérifiée.

## Terminer un changement

Exécuter les contrôles proportionnés, puis inspecter le diff final. Mettre à
jour dans le même changement tous les documents dont les faits ont évolué :

- `CONTEXT.md` pour l'état ou les décisions ouvertes ;
- `PRODUCT.md` pour une capacité ou règle utilisateur ;
- `architecture.md` pour une frontière ou un flux ;
- `DESIGN.md` pour une convention d'interface ;
- `REUSE.md` pour un élément partagé ;
- `DEVELOPMENT.md` pour une commande ou procédure.

Retirer les informations obsolètes au lieu d'accumuler un journal. Signaler les
commandes exécutées, leurs résultats, les documents mis à jour et les limites
de validation.
