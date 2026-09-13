# Contexte

## État actuel

L’application propose inscription, vérification d’adresse, connexion explicite,
récupération de mot de passe et déconnexion. Better Auth possède les endpoints
`/api/auth/*` ; NestJS protège `GET /api/me`. PostgreSQL stocke l’authentification
et les compteurs de limitation des tentatives.

Les écrans et les emails utilisent le catalogue français Paraglide. Les routes
visibles sont françaises, sans préfixe de langue. Les emails sont capturés par
Mailpit en développement ; aucun fournisseur réel n’est présupposé.

Le domaine produit au-delà de l’authentification reste à définir. Ne pas ajouter
une fonctionnalité de démonstration pour combler ce vide.

## Carte documentaire

- [PRODUCT.md](PRODUCT.md) : capacités et règles utilisateur.
- [ARCHITECTURE.md](ARCHITECTURE.md) : frontières et flux techniques.
- [DESIGN.md](DESIGN.md) : conventions d’interface.
- [REUSE.md](REUSE.md) : catalogue des éléments partagés.
- [DEVELOPMENT.md](DEVELOPMENT.md) : environnement et commandes.

## Travail prévu

Les seeders généraux, les logs HTTP structurés avec redaction, la readiness SQL
et la CI restent à livrer. Le suivi des envois email est local au processus,
sans file durable ni garantie de livraison après un crash.
