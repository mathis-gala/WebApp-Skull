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
pas dupliqués dans un faux domaine. `packages/core` possède le port pur `EmailSender`.

## Placement du code

- Controller, guard et composition HTTP : `apps/api/src`.
- Code propre à une fonctionnalité web : `apps/web/src/features/<feature>`.
- Client et configuration transversaux : `apps/web/src/lib`.
- Schémas échangés aux frontières : `packages/contracts`.
- Persistance Drizzle : `packages/database`.
- Primitive visuelle partagée : `packages/ui`.

Les fichiers de règles de validation portent le suffixe `.constraints.ts` ;
les réglages techniques gardent `.config.ts` ou leur module `config.ts`. Les
bornes du mot de passe sont possédées par le contrat auth partagé et appliquées
explicitement par Better Auth et le formulaire.

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

## Authentification et emails

`createAuth` est une factory sans singleton : le bootstrap injecte la base,
la configuration et le dispatcher email. Le handler reçoit une IP issue du
socket, écrasant l’en-tête interne `x-auth-client-ip` fourni par le client.
Aucun proxy n’est implicitement approuvé ; configurer une chaîne de confiance
précise avant de mettre l’API derrière un reverse proxy. Les clients derrière
un proxy partagent actuellement son quota réseau.

Better Auth gère les tokens, mots de passe, sessions et rate limits persistés.
La migration incrémentale `0001` ajoute `rate_limit` à la baseline publiée.
Les callbacks confient les emails au dispatcher sans attendre SMTP. Chaque
promesse est suivie, son erreur traitée sans contenu fournisseur, et l’arrêt
attend les envois au plus 15 secondes. Le transport est borné à 10 secondes.
Un crash peut perdre un envoi, sans retry automatique.

`packages/core` possède `EmailSender` et `EmailMessage` ; `packages/email`
implémente le rendu React Email et SMTP ; l’API compose les adaptateurs selon
`APP_ENV`. Le web n’importe aucun de ces modules serveur.

## Frontend et localisation

Les routes déclarent navigation, métadonnées et composition. Les formulaires
sont dans `features/auth/components`, leur orchestration TanStack Form dans
`features/auth/hooks`, et leurs schémas dans `features/auth/schemas`.
Le header et l’accueil sont des composants indépendants des routes.

`packages/i18n/messages/fr.json` est le catalogue Paraglide des écrans et emails.
Le compiler génère fonctions et déclarations ; la stratégie `baseLocale` garde
SSR et navigateur en français. Ajouter une langue demandera une stratégie de
sélection et un mapping des chemins explicites. L’identité publique reste JSON
dans `packages/config`, les contraintes sont dans leurs modules TypeScript.

Les routes `/connexion`, `/inscription`, `/verification-email`,
`/adresse-confirmee`, `/mot-de-passe-oublie` et `/nouveau-mot-de-passe` sont privées
vis-à-vis de l’indexation. `/sign-in` redirige vers `/connexion` après validation
du retour interne. Les chemins absolus, encodés ambigus et antislashs ne peuvent
pas servir de retour. Aucun sitemap ou canonical artificiel n’est généré.

Le store rate limit utilise `customStorage.consume` de Better Auth sur la même
base PostgreSQL. L’upsert applique le plafond et l’incrément sous le même verrou
SQL : l’adaptateur Drizzle 1.7.4 utilise un sous-select d’identifiants dont le
prédicat de compteur n’est pas réévalué après attente du verrou. Le test de
requêtes parallèles protège ce correctif. Better Auth conserve les règles, la
normalisation IP et la réponse 429 ; les entrées expirées sont purgées.
