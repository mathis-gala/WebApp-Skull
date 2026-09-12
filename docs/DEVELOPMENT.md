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
pnpm api:generate
pnpm api:check
```

`pnpm api:generate` reconstruit `apps/api/openapi.json` depuis les controllers
Nest puis `apps/web/src/lib/api/schema.d.ts`. Exécuter cette commande après un
changement de controller ou DTO et versionner les deux artefacts.
`pnpm api:check` régénère dans un répertoire temporaire et échoue en cas de
dérive. La génération utilise des providers inertes et ne demande ni base, ni
secret, ni SMTP. Avec l'API locale démarrée, Swagger est disponible sur
`http://localhost:3001/docs`. Cette interface n'est pas montée lorsque
`NODE_ENV=production`.

Les tests rapides n'ont besoin ni d'une base ni d'un secret réel. Ne lancer
`pnpm db:migrate` que sur une base locale neuve et explicitement configurée.
La migration initiale de ce dépôt est une baseline auth seule ; elle n'est pas
compatible avec une base créée par un ancien historique.

## État des outils

Les seeders, les logs HTTP structurés, la vérification SQL de readiness et la CI
restent à livrer.

## Emails locaux

Mailpit écoute par défaut en SMTP sur `1025` et son interface sur
`http://localhost:8025`. Les ports peuvent être ajustés avec
`MAILPIT_SMTP_PORT`/`MAILPIT_HTTP_PORT` ; ajuster aussi `SMTP_PORT` côté API.
Le Compose de développement n’active aucun relais SMTP externe.

`APP_ENV` est distinct de `NODE_ENV`. Développement/staging utilisent la capture
locale par défaut ; test utilise la mémoire. La production exige SMTP, hôte,
expéditeur et identifiants explicites, avec TLS obligatoire. Le SMTP réel staging
est opt-in et nécessite `EMAIL_ALLOWED_RECIPIENTS`, adresses exactes séparées par
virgules ; une adresse absente est refusée, jamais réécrite.

## Intégration isolée

```bash
pnpm --filter @workspace/api exec playwright install chromium
pnpm test:integration
```

Le harness crée un projet Compose UUID distinct, PostgreSQL en tmpfs et Mailpit
sans relais, avec ports loopback dynamiques. Il ne lit pas `.env`, n’utilise pas
les volumes dev et n’accepte pas une URL de base arbitraire. Les migrations sont
appliquées seulement à cette base possédée. L’arrêt retire uniquement ce projet.
Docker doit fonctionner et pouvoir télécharger les images versionnées. Chromium
exerce le parcours mobile, avec captures locales sous `output/playwright`.
Le serveur Vite de test utilise `envDir: false` et des ports réservés au test.

## Traductions

Éditer `packages/i18n/messages/fr.json`, puis exécuter
`pnpm --filter @workspace/i18n build`. Build/typecheck génèrent les fonctions
Paraglide typées ; les sorties ne sont pas versionnées. En mode dev, le watcher
recompile les messages. Conserver les règles de pluriel dans le catalogue.
