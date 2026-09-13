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
pnpm docs:check
pnpm project:check
pnpm test:integration
pnpm test:e2e
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

Les tests rapides n'ont besoin ni d'une base ni d'un secret réel. La migration
initiale est une baseline auth seule ; elle n'est pas compatible avec une base
créée par un ancien historique.

`pnpm docs:check` vérifie la présence des huit documents et leurs liens locaux.
`pnpm project:check` protège les frontières web/serveur, les métadonnées privées,
le retrait des anciennes technologies et les versions des images/actions.

## Migrations et fixtures

`pnpm setup` exige un `.env` local, démarre les services Compose puis applique
les migrations. Avant de charger le client DB, le CLI exige `APP_ENV=development`,
un hôte loopback et la base exacte `webapp_skull`. En test, il exige la base
`skull_auth_test` et l'identifiant d’ownership créé par le harness. Staging et
production sont toujours refusés par ces outils locaux.

Le seed n'est jamais implicite :

```bash
pnpm db:seed -- --scenario auth
```

`DATABASE_FIXTURE_MODE=auth` doit être présent. La commande crée, si absents,
`verified@example.test` et `unverified@example.test` avec le mot de passe local
public `Local-Only-Auth-2026!`. Elle conserve mot de passe et état de tout compte
déjà présent, ne crée aucune session durable et peut être relancée.

Le nettoyage est volontaire, utilise la même garde et supprime uniquement ces
deux adresses avec leurs dépendances auth et jetons de réinitialisation, dans
une transaction :

```bash
pnpm db:seed -- --scenario auth --clean
```

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
pnpm test:e2e
```

Le harness crée un projet Compose UUID distinct, PostgreSQL en tmpfs et Mailpit
sans relais, avec ports loopback dynamiques. Il ne lit pas `.env`, n’utilise pas
les volumes dev et n’accepte pas une URL de base arbitraire. Les migrations sont
appliquées seulement à cette base possédée. L’arrêt retire uniquement ce projet.
Chaque commande crée son propre projet Compose UUID, applique la migration gardée
et relance le seed deux fois. `test:integration` couvre DB, sessions, email et
sécurité API ; `test:e2e` exerce le parcours mobile avec captures locales sous
`output/playwright`. Le serveur Vite utilise `envDir: false` et des ports réservés
au test. Docker doit fonctionner et pouvoir télécharger les images versionnées.

## Logs et santé

En développement, les logs Pino sont lisibles ; staging et production émettent
du JSON. Chaque réponse porte `x-request-id`. Les lignes HTTP contiennent méthode,
chemin sans query, statut et durée, sans headers, body, cookie, adresse email, IP,
token, URL d’action ou message SMTP. `/health/live` ne contacte aucun service ;
`/health/ready` sonde PostgreSQL et répond 503 après deux secondes au plus.

## CI

`.github/workflows/ci.yml` utilise Node 24.21.0 et pnpm 12.4.1. Les actions sont
épinglées à des commits et les images à des versions. Quatre jobs sans compte
externe exécutent respectivement la détection de secrets, `pnpm check`,
l'intégration et l'E2E ; ces deux derniers créent leurs propres services
éphémères, jamais le Compose dev.

Le job Gitleaks télécharge le binaire MIT 8.30.1 depuis sa release officielle,
vérifie son archive Linux x64 par SHA-256 et analyse tout l'historique Git. La
même analyse est reproductible localement sur Linux x64 :

```bash
gitleaks_dir="$(mktemp -d)"
trap 'rm -rf "$gitleaks_dir"' EXIT
curl --fail --silent --show-error --location \
  --output "$gitleaks_dir/gitleaks.tar.gz" \
  https://github.com/gitleaks/gitleaks/releases/download/v8.30.1/gitleaks_8.30.1_linux_x64.tar.gz
echo "551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb  $gitleaks_dir/gitleaks.tar.gz" | sha256sum --check --strict
tar --extract --gzip --file "$gitleaks_dir/gitleaks.tar.gz" --directory "$gitleaks_dir" gitleaks
"$gitleaks_dir/gitleaks" git --redact --verbose .
```

## Traductions

Éditer `packages/i18n/messages/fr.json`, puis exécuter
`pnpm --filter @workspace/i18n build`. Build/typecheck génèrent les fonctions
Paraglide typées ; les sorties ne sont pas versionnées. En mode dev, le watcher
recompile les messages. Conserver les règles de pluriel dans le catalogue.
