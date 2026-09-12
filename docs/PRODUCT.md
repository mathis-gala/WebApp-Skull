# Produit

## Capacités livrées

Une personne peut créer un compte avec un nom, une adresse email et un mot de
passe, se connecter, consulter l'accueil avec une session active et se
déconnecter. Les sessions utilisent des cookies gérés par Better Auth.

## Règles actuelles

- le mot de passe contient au moins huit caractères ;
- l'API reste l'autorité pour toute route protégée ;
- une route protégée exige une session associée à une adresse vérifiée ;
- l'interface ne stocke aucun jeton d'authentification dans le navigateur.

## Limites actuelles

L'envoi de l'email de vérification n'est pas encore livré : un nouveau compte
ne peut donc pas terminer seul ce parcours dans l'état actuel. Le mot de passe
oublié, les rôles, OAuth et MFA ne sont pas livrés. Aucun domaine métier
supplémentaire n'est défini.
