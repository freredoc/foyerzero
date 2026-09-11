# RAPPORT — lot JOURNAL-ÉCRAN

**11/09/2026.** Point 4 de la liste d'Ethan : « journal : cela doit être un écran
pas un onglet ». Il s'applique sur `main` = **`3a93b14`** (« lot pendule et
toucher »), vérifié avant de commencer : les 14 fichiers de la livraison
précédente y sont byte-identiques, la suite y est verte.

⚠ **PAS DE BRIEF : la livraison est faite de fichiers du dépôt**, donc écrite et
vérifiée par exécution, pas décrite à faire écrire.

---

## 1. Version et build réellement produits

**0.99.49 · build 151**, le suivant disponible, bumpés ENSEMBLE dans
`package.json`, la ligne de révision de `CLAUDE.md` suit.

`npm run build` → `dist/index.html`, **9 369 216 octets**, 0 référence externe.

---

## 2. Verdict de la suite

| | avant le lot | après le lot |
|---|---|---|
| tests déclarés | 1577 | **1577** |
| mesuré | 1576 pass · 0 fail · 1 skipped | **1576 pass · 0 fail · 1 skipped** |
| `npm run check` | 0 | **0** |

Le compte ne bouge pas : **aucun test neuf**, et c'est un choix — voir §5.

---

## 3. Coût en octets, poste par poste

Contre le livrable rebâti dans un `git worktree` sur l'arbre pristine de `main` =
`3a93b14` (**9 369 329 octets**).

| poste | avant | après | écart |
|---|---|---|---|
| balisage | 5 012 827 | 5 012 727 | **−100** |
| JavaScript (`<script>`) | 410 444 | 410 376 | **−68** |
| feuille (`<style>`) | 3 945 935 | 3 945 990 | **+55** |
| images / audio | — | — | **+0** |
| **total** | **9 369 329** | **9 369 216** | **−113** |

La somme des postes tombe EXACTEMENT sur le total des DEUX côtés, et il y a
**307 URI `data:` de part et d'autre**. Borne T10 **inchangée à 9 600 000**, marge
**230 784 octets, 2,40 %**.

⚠ **LE LOT REND DES OCTETS**, ce qui est le signe qu'il s'agit d'un
DÉPLACEMENT : le panneau global disparaît avec son bouton « Fermer » et sa
fonction de fermeture ; l'écran qui le remplace réutilise le dessin déjà là.

---

## 4. Ce qui a changé

### Le journal est le huitième écran

- `#journal-panneau`, `.panneau-detail` frère de `#ecrans`, devient
  **`#ecran-journal`, enfant de `#ecrans`**, posé juste après le Chantier —
  l'ordre de la barre.
- `#tete-rapport` devient **`onglet-journal`**, et entre dans **les deux tables**
  de `ui/session.js` : `ECRANS` et `ONGLET_DE_L_ECRAN`.
- Le bouton **« Fermer » disparaît**. On sort d'un écran par un autre onglet ;
  aucun des six n'a de croix, et un « Fermer » aurait posé la question « fermer
  vers quoi ? », à laquelle seule la barre répond.
- `fermerLeJournal` disparaît, et le crochet `pendantLeDeroule` ne l'appelle
  plus : il fermait le panneau pour qu'il ne reste pas seul par-dessus un combat
  dont tout le chrome venait d'être masqué. Un déroulé ne peut se produire que
  sur l'écran de raid.
- Le journal **se peint à l'entrée dans l'écran**, dans `montrerEcran` et non
  dans l'écouteur de son onglet — pour que les six onglets restent **six lignes
  identiques**, ce que `TO T2` compte.

⚠⚠ **LE DÉFAUT QU'ETHAN NOMME ÉTAIT EXACTEMENT LÀ.** Depuis le 10/09, le bouton
avait l'air d'un onglet — même barre, même libellé, même graisse — et n'en était
pas un : hors de `ONGLET_DE_L_ECRAN`, il ne prenait jamais `.actif`. On lisait
donc le journal pendant que la barre disait « Base ».

### Le dessin est partagé, la position ne l'est pas

`#ecran-journal` **porte `.panneau-detail`** et défait les **trois** déclarations
qui placent un panneau : `position: static`, `max-height: none`, bordure du haut
à zéro. Les quatorze règles `.panneau-detail .xxx` dessinent le CONTENU que
`peindreVueDuPanneau` produit ; les recopier pour l'écran en aurait fait quatorze
copies destinées à diverger.

### Une règle de la veille s'en va

`#jeu` n'est plus `position: relative`. Elle avait été posée le 10/09 **pour ce
panneau et pour lui seul** ; le panneau parti, une règle sans motif crée un bloc
englobant où le prochain `absolute` s'accrocherait sans que personne l'ait
décidé. Vérifié sélecteur par sélecteur avant de la retirer : tout ce qui est
`absolute` sous `#jeu` vit dans `#ecrans` ou plus bas, et `#barre-bas`, le seul
autre enfant, est dans le flux.

---

## 5. Aucun test neuf — six gardes réécrites

⚠ **C'EST UN CHOIX, PAS UN OUBLI.** Trois gardes portaient **l'arbitrage
inverse** : les réécrire EST le travail de test de ce lot, et un quatrième test
qui redirait la même chose n'aurait rien gardé de plus.

| garde | ce qu'elle disait | ce qu'elle dit |
|---|---|---|
| `EC T2` | le journal est **global**, frère de `#ecrans`, écrit en dernier pour peindre par-dessus une fiche | il est un **écran**, enfant de `#ecrans`, déclaré dans les **deux** tables, sans panneau ni « Fermer », avec **une** règle propre de **trois** déclarations |
| `JRN T8` | un bouton `tete-rapport`, un panneau, aucune règle propre | un onglet `onglet-journal`, un écran, les anciens identifiants **absents**, l'ordre dans la barre inchangé |
| barre d'onglets (`chantier.test.js`) | **deux populations** : cinq onglets et un bouton | **six onglets**, et `horsOnglets` doit être **vide** |
| `SON T15`, `SON-V T2`, `SB T1` | **sept** écrans, six muets | **huit** écrans, sept muets — le journal est muet, un journal se lit |

⚠ `EC T2` est aussi devenu **plus fort** qu'avant : il asserte les deux tables de
`session.js`, la disparition de `fermerLeJournal`, et que la règle propre de
l'écran **défait** au lieu de dessiner (trois déclarations, comptées).

---

## 6. Vérifications au banc, sur le livrable bâti

Chromium headless, servi en HTTP, viewport **360 × 780 à DPR 3**, touchers réels.

- **La barre** : six boutons, tous `onglet-*`, largeurs 57,31 · 57,31 · 57,31 ·
  **74,44** (RECHERCHE) · 57,31 · 56,31 = **360 px pile**. Aucun libellé coupé,
  aucun débordement. La mesure du 10/09 tenait : seul l'identifiant a changé.
- **Le geste** : un toucher sur l'onglet → écran visible `ecran-journal`, onglet
  allumé `onglet-journal`, `position: static`, `max-height: none`, et l'écran
  **remplit exactement `#ecrans`** (624 px pour 624). Titre « Journal des raids »,
  corps « Aucun raid mené ni subi pour l'instant. », **pas de bouton Fermer**.
  Le chrome commun reste : bandeau des ressources, bascule de bases, barre du bas.
- **L'aller-retour** Base → Journal → Base → Journal : l'écran et l'onglet
  suivent à chaque fois.
- **Le dessin partagé**, mesuré et non déduit : `h3` à 8 px gris, `.ligne` à
  11 px, `.ligne.mineure` à 9 px, `.paires` en grille, `b` en os — les mêmes
  valeurs que dans un panneau.
- **Le défilement** : 1 959 px de contenu dans un cadre de 624, et la tête
  **reste à 110 px après 1 200 px de défilement**.

⚠ **CE QUI N'A PAS ÉTÉ VÉRIFIÉ AU BANC** : un journal PLEIN de vrais rapports. Il
faut mener un raid, et le banc ne sait pas atteindre une cible depuis une partie
neuve (constaté au lot précédent). Le contenu injecté ci-dessus a les vraies
classes mais un faux texte. **À regarder sur appareil, avec l'historique réel.**

---

## 7. SHA-256 des fichiers livrés (16 premiers caractères)

| fichier | SHA-256 |
|---|---|
| `CLAUDE.md` | `12c39bda5fc5a0ef` |
| `package.json` | `a33e21550c3684b8` |
| `src/index.src.html` | `b008ab99daf5bab7` |
| `src/ui/session.js` | `a5ddbd194620f411` |
| `test/chantier.test.js` | `a46f9bf9c0ab8131` |
| `test/journal-raids.test.js` | `d3a722c604eb63e0` |
| `test/monde.test.js` | `d5113065b50afd8c` |
| `test/son.test.js` | `4097f9268826057d` |
| `dist/index.html` (non livré, `.gitignore`) | `62d924b0060bf085` |

---

## 8. Ce qui n'est PAS dans ce lot

- **Aucun changement de contenu du journal** : `vueDuJournal` n'a pas bougé d'un
  caractère, et `JRN T9` — « rien n'est recalculé » — le mesure toujours.
- **Aucun réglage d'équilibrage** : `src/data/` et `src/sim/` n'ont pas une ligne
  de diff.
- **Les deux contrôles appareil hérités du lot précédent** restent dus : la
  flèche en jeu, et le retour de raid sur la ruine.
- Les six points d'Ethan du 11/09 sont désormais tous traités.
