# Contexte

## État actuel

Le produit fournit une application web avec inscription, connexion,
déconnexion et session par cookie. L'API utilise NestJS sur Express ; Better
Auth possède les endpoints `/api/auth/*`. PostgreSQL stocke uniquement les
données d'authentification.

Le domaine produit au-delà de l'authentification n'est pas encore défini.
Aucune fonctionnalité de démonstration ne doit être ajoutée pour combler ce
vide.

## Carte documentaire

- [PRODUCT.md](PRODUCT.md) : capacités et limites utilisateur.
- [architecture.md](architecture.md) : frontières et flux techniques.
- [DESIGN.md](DESIGN.md) : conventions d'interface.
- [REUSE.md](REUSE.md) : catalogue des éléments partagés.
- [DEVELOPMENT.md](DEVELOPMENT.md) : environnement et commandes.

## Travail prévu

Le client HTTP OpenAPI, la vérification d'adresse, la récupération de mot de
passe, les emails, les seeders, les logs structurés et la CI ne sont pas encore
livrés.
