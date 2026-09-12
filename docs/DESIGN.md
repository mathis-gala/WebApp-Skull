# Design

L'interface utilise les tokens Tailwind définis dans
`packages/ui/src/styles/globals.css` et les primitives de `packages/ui`.

- Conserver les labels associés aux champs et les erreurs accessibles.
- Montrer explicitement les états de chargement des actions asynchrones.
- Maintenir le parcours au clavier et le lien d'évitement vers le contenu.
- Garder les pages utilisables sur écran étroit avant d'ajouter des variantes.
- Ne pas exposer de vocabulaire d'infrastructure dans les écrans produit.

Les nouveaux motifs réellement partagés rejoignent `packages/ui`. Un composant
propre à une fonctionnalité reste près de cette fonctionnalité.
