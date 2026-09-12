# Réutilisation

## Interface

Les primitives réutilisables se trouvent dans
`packages/ui/src/components`. Réutiliser notamment `Button`, `Card`, `Field`,
`Input`, `Spinner`, `Tabs` et `Sonner` avant de créer une variante locale.
Les styles et tokens communs sont dans `packages/ui/src/styles/globals.css`.

## Web

- `apps/web/src/lib/auth/auth-client.ts` : client Better Auth partagé.
- `apps/web/src/lib/query/query-client.ts` : configuration TanStack Query.
- `apps/web/src/lib/api/config.ts` : URL publique de l'API.

## Serveur

- `apps/api/src/infrastructure/auth/guard.ts` : protection globale Nest et
  marqueur `Public`.
- `packages/database/src/client.ts` : création et fermeture du client Drizzle.

Ajouter ici seulement une capacité destinée à plusieurs consommateurs, avec sa
source et sa règle d'usage.
