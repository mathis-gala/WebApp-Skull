# Développement

## Environnement

Utiliser Node.js 24 et pnpm 12. Copier `.env.example` vers `.env` pour le
développement local ; ne jamais versionner ou partager le fichier réel.

```bash
pnpm install --frozen-lockfile
pnpm dev:infra
pnpm db:migrate
pnpm dev
```

L'API écoute sur `3001`, le web sur `3000` et PostgreSQL sur `5433` par défaut.
`pnpm dev:down` arrête les conteneurs sans supprimer le volume.

## Validation

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm check
```

Les tests rapides n'ont besoin ni d'une base ni d'un secret réel. Ne lancer
`pnpm db:migrate` que sur une base locale neuve et explicitement configurée.
La migration initiale de ce dépôt est une baseline auth seule ; elle n'est pas
compatible avec une base créée par un ancien historique.

## État des outils

Les seeders, Mailpit, les emails, les logs structurés, la vérification SQL de
readiness et les suites d'intégration/E2E seront ajoutés dans les lots prévus.
