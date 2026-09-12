# WebApp Skull

Application web TypeScript avec authentification par email et mot de passe.

## Technologies

| Technologie                           | Rôle                                          |
| ------------------------------------- | --------------------------------------------- |
| Node.js 24 et pnpm                    | Runtime et gestion des dépendances            |
| Turborepo                             | Orchestration du monorepo                     |
| NestJS 11 et Express                  | API HTTP et composition serveur               |
| TanStack Start, Router, Query et Form | Application React                             |
| Tailwind CSS et shadcn/ui             | Styles et primitives d'interface              |
| Better Auth                           | Inscription, connexion et sessions par cookie |
| Zod                                   | Validation des données aux frontières         |
| Drizzle ORM et PostgreSQL 17          | Persistance et migrations                     |
| Vitest                                | Tests unitaires et HTTP                       |
| Docker Compose                        | Services locaux                               |

## Démarrage

Prérequis : Node.js 24, pnpm 12 et Docker.

```bash
pnpm install --frozen-lockfile
cp .env.example .env
pnpm setup
pnpm dev
```

| Service    | Adresse                           |
| ---------- | --------------------------------- |
| Web        | http://localhost:3000             |
| API        | http://localhost:3001             |
| Santé API  | http://localhost:3001/health/live |
| PostgreSQL | localhost:5433                    |

## Commandes

```bash
pnpm dev             # démarre l'API et le web
pnpm check           # format, lint, types, tests et builds
pnpm test            # tests rapides Vitest
pnpm db:generate     # génère une migration depuis le schéma
pnpm db:migrate      # applique les migrations à la cible configurée
pnpm db:studio       # ouvre Drizzle Studio
pnpm dev:infra       # démarre PostgreSQL
pnpm dev:down        # arrête les services sans supprimer leurs données
```

`pnpm setup` démarre PostgreSQL et applique les migrations. Il ne crée aucune
donnée applicative. Le développement des emails, des seeders et de la CI est
planifié mais n'est pas encore livré.

## Structure

```text
apps/api             API NestJS et intégrations serveur
apps/web             application TanStack Start
packages/contracts   schémas et contrats partagés
packages/core        règles métier et ports lorsqu'un domaine les exige
packages/database    schémas, migrations et client Drizzle
packages/ui          primitives et styles partagés
docs                 contexte durable du projet
```

Better Auth expose ses routes sous `/api/auth`. Le client utilise des cookies
de session avec `credentials: "include"`. La base initiale contient seulement
les tables nécessaires à l'authentification.

Lire [docs/CONTEXT.md](docs/CONTEXT.md) pour l'état actuel et
[docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) pour les conventions locales.
