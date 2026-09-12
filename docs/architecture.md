# Architecture

## Dépendances

```text
apps/web ───────────────→ packages/contracts, packages/ui
apps/web ───────────────→ openapi-fetch + contrat généré
apps/api ───────────────→ packages/contracts, packages/database
packages/database ──────→ Drizzle ORM, PostgreSQL
packages/core ──────────→ aucune technologie applicative
```

NestJS compose l'API. Express reçoit les requêtes HTTP ; le handler officiel
Better Auth est monté sous `/api/auth` avant le parseur JSON Nest. Un guard
global protège les controllers Nest, sauf ceux marqués publics. Les routes de
santé `/health/live` et `/health/ready` sont publiques.

`GET /api/me` utilise `@CurrentUser()` pour lire l'identité attachée par le
guard. Il expose seulement `id`, `name`, `email` et `emailVerified`. Le pipe
Zod global valide les DTO d'entrée et l'intercepteur Zod vérifie les réponses.
Le filtre HTTP transforme les erreurs applicatives dans une enveloppe stable
avec un identifiant de requête, sans exposer les données invalides. Le handler
Express Better Auth conserve ses propres réponses.

L'OpenAPI est produit depuis les controllers de l'application avec un handler
auth et un lecteur de session inertes. Cette composition n'importe pas le
client de base de données et ne contacte aucun service. `openapi-typescript`
génère ensuite les types consommés par `openapi-fetch` dans le web. Le contrôle
de dérive compare les fichiers générés à des fichiers temporaires, sans lire
l'index Git.

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

Les constantes restent auprès de leur propriétaire : contraintes de formulaire
dans la feature web, réglages PostgreSQL dans `packages/database`, configuration
OpenAPI dans l'API. `packages/config` ne partage à l'exécution que l'identité
publique du produit ; `packages/contracts` décrit les données échangées, pas les
réglages d'infrastructure. Le nom du cookie documenté appartient à l'intégration
Better Auth et ne constitue pas un réglage public du projet.

Les imports serveur utilisent NodeNext et des extensions `.js` explicites dans
le TypeScript. Le web utilise le mode de résolution Bundler.
L'identité publique est un fichier JSON importé avec l'attribut `type: json`.
TypeScript infère sa structure via `resolveJsonModule` ; aucune déclaration de
type manuelle ne duplique ces données. Les configurations techniques restent
dans leurs modules TypeScript et les valeurs de déploiement à la frontière env.

Le web lit l'URL publique uniquement depuis `apps/web/src/lib/api/config.ts`.
Le client OpenAPI envoie les cookies avec chaque requête. L'accueil désactive
son chargement SSR et redirige vers la connexion lorsque `/api/me` répond 401
ou 403. L'entrée sur cette route force une nouvelle vérification de `/api/me`,
même si l'identité en cache est encore fraîche. Toute transition d'identité
vide le cache TanStack Query afin qu'aucune donnée privée d'un utilisateur
précédent ne reste visible.

## Santé

La liveness indique que le processus répond. La readiness est présente mais ne
sonde pas encore PostgreSQL ; cette vérification bornée sera ajoutée avec le
lot d'observabilité.

Les constantes appartiennent au module qui possède leur sens : contraintes de
formulaire dans la feature auth web, options PostgreSQL dans database. Seule
l’identité publique du projet est commune via `@workspace/config/project`, un
module JavaScript accompagné de sa déclaration TypeScript.
