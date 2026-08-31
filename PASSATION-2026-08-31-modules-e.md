# Passation — 31/08/2026, après le lot MODULES-E

**Livré : `0.55.0` · build `56`.** 714 pass / 0 fail · `dist/index.html`
1 263 578 octets (**+708**) · marge 36 422 o, 2,80 % · `SAVE_VERSION` **14**,
inchangé · audit maquette **toujours rouge à 7 écarts**, sortie identique à la
ligne. Branche `claude/lot-modules-e`, PR ouverte, **non mergée**.

Le rapport complet est dans `RAPPORT-lotMODULES-E.md`. Ceci en est le condensé
pour la session suivante.

---

## Ce que le lot a fait

Aucun module nouveau. `modulesDebloques` prend la forme

```js
{ joueur: { offense: [...], defense: [...] }, ouvrage: { offense: [...], defense: [...] } }
```

**la même pour les deux propriétaires**, et un module acheté dans une branche ne
sert plus que dans celle-là. `modulesDebloquesDuJoueur` rend l'objet, plus
l'union. `creerCombat` **lève** sur une liste plate, en nommant le propriétaire.
`pointsRecherche` lit la branche `defense` du `montage.proprietaireDefense`.

## Les quatre choses à savoir avant de toucher à ça

1. **⚠⚠ `camp` et `branche` ne portent pas les mêmes mots.** Le camp vaut
   `attaque` ou `defense`, la branche `offense` ou `defense` : **le second terme
   coïncide, le premier non**. Une indexation par `e.camp` rend `undefined`,
   `undefined?.includes` ne lève pas — tous les modules **offensifs**
   s'éteindraient en silence, et la moitié défensive continuerait de passer. La
   table nommée `BRANCHE_DU_CAMP` existe pour ça. **Un test qui n'observe qu'un
   porteur défensif est AVEUGLE à ce piège** : T4 et T8 ont dû être renforcés
   pour observer les deux camps dans le même montage.
2. **Le sens de la fuite n'était pas celui qu'on croyait, et mon propre rapport
   MODULES-D le disait à l'envers.** Le brief et ce rapport annonçaient
   « acheter le module **défense** des Perceurs (200 M) débloque `tirDeBarrage`
   en offense ». **Cet achat lève** : `cable.tirDeBarrage.defense` vaut `false`
   depuis MODULES-A. Les quatre noms en collision sont câblés **en offense
   seulement** — la fuite allait de l'offense vers la garnison.
3. **La fuite n'avait aucun effet observable en combat.** `flashbang` et `emp` ne
   sont lus que par `declencherNeutralisations`, gardée au camp `attaque` ;
   `tirDeBarrage` est lu en défense mais son éclaboussure ne vise que les genres
   `defense` et `batiment`. **Le lot est structurel et préventif** — le vendre
   comme un correctif d'équilibrage serait se vanter d'un effet nul.
4. **L'absence de la clé reste permise** (21 montages ne la portent pas : onze de
   `combat.test.js`, cinq d'`assaut`, cinq de `site-entame`). Seule une valeur
   **présente et plate** lève. Uniformiser serait un autre lot.

## La question posée au rapport, et non tranchée

**`ouvrage.offense` et `ouvrage.defense` existent et sont vides.** Les armer
activerait d'un coup **tous** les modules câblés du côté de l'Ouvrage : le
premier camp venu porterait le Tir de barrage, le Flashbang et l'EMP, et ses
garnisons gagneraient PV +20 %. Ce que ça demanderait, si Ethan le veut :

- un **barème par niveau de site**, pas une liste globale ;
- **le relevé des 24 mesures refait** — `pointsRecherche` majore de 20 % par
  module de défenseur débloqué ; le raid de référence passe de 2 059 722 à
  2 471 666 pour trois noms seulement ;
- **une lecture côté joueur** : rien à l'écran ne dit qu'une base ennemie porte
  des modules ;
- et c'est un **lot d'équilibrage**, pas de plomberie.

## Reste ouvert, inchangé

- **`autoReparation` est câblée et inatteignable** : rien, dans tout `src/`,
  n'écrit `degatsMilli` sur `etat.garnison`. Constat de MODULES-D.
- **`garnison` n'est câblé sur aucune branche** (Ethan veut un glisser-déposer à
  la préparation de raid — un lot d'interface). `MODULES-E T2` gèle le fait : le
  câbler fera tomber le test et forcera à relire le rapport.
- **`munitionSpeciale` et `volDeVie`** sont les deux derniers modules sans lot.
- **L'audit maquette est rouge à 7 écarts** et l'était déjà. Pas ce lot.

## Méthode — deux rappels payés cher

- **Ne jamais restaurer une source sabotée par `git checkout`** tant que le
  travail du lot n'est pas commité : ça revient à `origin/main` et efface tout.
  Copier dans `/tmp` d'abord, restaurer depuis `/tmp` — et **le fichier saboté
  doit être dans la copie**. Le script `sabote.sh` de ce lot suit cette règle et
  vérifie les md5 à la fin.
- **Une assertion de source (`assert.match` sur un fichier) est une garde
  faible.** T6 en portait deux ; le motif `montage.proprietaireDefense ??
  'ouvrage'` apparaît **deux fois** dans `combat.js`, et le sabotage passait à
  travers. Remplacées par un relevé de points, qui tombe.
