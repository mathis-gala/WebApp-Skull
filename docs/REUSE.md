# Réutilisation

## Configuration et contrats transverses

- `packages/config/src/project.json` : identité publique du produit (nom et
  description), commune au web et à l'API. Les réglages techniques restent dans
  le module qui les possède.
- `packages/contracts/src/common.ts` : schéma de l'enveloppe d'erreur échangée
  entre le web et l'API.

## Interface

Les primitives réutilisables se trouvent dans
`packages/ui/src/components`. Réutiliser notamment `Button`, `Card`, `Field`,
`Input`, `Spinner`, `Tabs` et `Sonner` avant de créer une variante locale.
Les styles et tokens communs sont dans `packages/ui/src/styles/globals.css`.

## Web

- `apps/web/src/lib/auth/auth-client.ts` : client Better Auth partagé.
- `apps/web/src/lib/auth/current-user.ts` : requête d'identité, vérification
  fraîche avant une route protégée et purge de tout cache privé lors d'une
  connexion ou déconnexion.
- `apps/web/src/lib/api/client.ts` : client OpenAPI typé, configuré avec les
  cookies de session.
- `apps/web/src/lib/query/query-client.ts` : configuration TanStack Query.
- `apps/web/src/lib/api/config.ts` : URL publique de l'API.
- `apps/web/src/lib/api/http-status.ts` : statuts nommés utilisés par le client.
- `apps/web/src/features/auth/schemas/auth-form.constraints.ts` : contrainte du nom
  propre aux formulaires d’authentification. Les schémas utilisent directement
  les bornes de mot de passe du contrat auth partagé.

- `packages/contracts/src/auth.constraints.ts` : bornes du mot de passe partagées
  entre validation web et configuration serveur Better Auth.

## Serveur

- `apps/api/src/infrastructure/auth/guard.ts` : protection globale Nest et
  décorateurs `Public` et `CurrentUser`.
- `packages/contracts/src/identity.ts` : forme publique de l'identité courante.
- `apps/api/src/infrastructure/http/http-error.filter.ts` : enveloppe d'erreur
  des controllers Nest ; ne pas l'appliquer aux routes Better Auth.
- `packages/database/src/client.ts` : création et fermeture du client Drizzle.
- `packages/database/src/config.ts` : réglages du pool PostgreSQL.
- `apps/api/src/openapi/config.ts` : chemin de documentation et version de l'API.

Ajouter ici seulement une capacité destinée à plusieurs consommateurs, avec sa
source et sa règle d'usage.

## Auth et messages

- `packages/core/src/email.ts` : port email indépendant des technologies.
- `packages/email/src/auth-email.tsx` : rendu HTML et texte des emails auth,
  avec locale explicitement fournie par le consommateur.
- `packages/email/src/config.ts` : modes d’envoi validés, capture locale,
  production SMTP et allowlist exacte en staging.
- `apps/api/src/infrastructure/email/auth-email-dispatcher.ts` : envois suivis,
  événements nettoyés et drainage à l’arrêt.
- `packages/i18n/messages/fr.json` : catalogue commun ; importer uniquement les
  fonctions requises depuis `@workspace/i18n/messages`.
- `apps/web/src/features/auth/components/auth-input.tsx` : champ auth avec label,
  erreurs associées et saisie contrôlée ; réutiliser dans les formulaires auth.
- `apps/web/src/features/auth/components/auth-panel.tsx` : cadre commun aux
  étapes d’authentification.
- `apps/web/src/features/auth/hooks` : inscription, connexion, demandes email,
  reset et déconnexion ; ne pas importer une route depuis un hook.
- `apps/web/src/lib/auth/redirect.ts` : validation restrictive d’un retour interne.
- `apps/web/src/lib/seo/private-head.ts` : métadonnées auth/privé sans indexation.
