# Architecture

## Dépendances

```text
apps/web ───────────────→ packages/contracts, packages/ui
apps/api ───────────────→ packages/database
packages/database ──────→ Drizzle ORM, PostgreSQL
packages/core ──────────→ aucune technologie applicative
```

NestJS compose l'API. Express reçoit les requêtes HTTP ; le handler officiel
Better Auth est monté sous `/api/auth` avant le parseur JSON Nest. Un guard
global protège les controllers Nest, sauf ceux marqués publics. Les routes de
santé `/health/live` et `/health/ready` sont publiques.

Better Auth possède les utilisateurs, comptes et sessions. Ces objets ne sont
pas dupliqués dans un faux domaine. `packages/core` reste vide tant qu'une règle
métier ou un port concret ne le justifie pas.

## Placement du code

- Controller, guard et composition HTTP : `apps/api/src`.
- Code propre à une fonctionnalité web : `apps/web/src/features/<feature>`.
- Client et configuration transversaux : `apps/web/src/lib`.
- Schémas échangés aux frontières : `packages/contracts`.
- Persistance Drizzle : `packages/database`.
- Primitive visuelle partagée : `packages/ui`.

Les imports serveur utilisent NodeNext et des extensions `.js` explicites dans
le TypeScript. Le web utilise le mode de résolution Bundler.

## Santé

La liveness indique que le processus répond. La readiness est présente mais ne
sonde pas encore PostgreSQL ; cette vérification bornée sera ajoutée avec le
lot d'observabilité.

Les constantes appartiennent au module qui possède leur sens : contraintes de
formulaire dans la feature auth web, options PostgreSQL dans database. Seule
l’identité publique du projet est commune via `@workspace/config/project`, un
module JavaScript accompagné de sa déclaration TypeScript.
