# Produit

## Capacités

Créer un compte avec nom, email et mot de passe ; confirmer l’adresse avec le
lien reçu ; se connecter et consulter son espace ; se déconnecter ; demander
un nouveau lien de vérification ou un changement de mot de passe.

## Règles

- L’adresse doit être vérifiée avant la connexion et l’accès aux routes privées.
- L’inscription et la vérification ne connectent pas automatiquement.
- Le mot de passe contient entre 8 et 128 caractères, sans transformation.
- Le lien de vérification est valable 24 heures ; le reset, une heure.
- Un reset réussi révoque les sessions et exige une nouvelle connexion.
- La session dure 7 jours et peut être renouvelée après un jour.
- Les demandes d’email ne révèlent pas si un compte existe. Une demande reçue
  ne garantit pas que le message a été livré ; le renvoi reste disponible.
- Les tentatives sensibles sont limitées à 5 par minute par adresse réseau
  et endpoint ; le plafond général est de 100 par minute.
- Interface et chemins français, aucune seconde langue activée.

## Limites

Aucun domaine métier supplémentaire, rôles, OAuth, MFA, stockage de fichiers,
file de jobs durable ou fournisseur email imposé.
