# RAPPORT — lot CÂBLAGE-PICTOGRAMMES

**Version 0.99.19 · build 120.** Branche `claude/lot-pictogrammes`, poussée dans
la PR **#106** qu'Ethan a ouverte. Non mergée.

Ethan, 07/09, deux phrases : **« 128. »** puis **« fais tout d'un seul coup, les
quatre lots d'un coup. »** Le rapport du lot PICTOGRAMMES proposait quatre lots
de câblage — bandeau, arsenal, modules, chiffres ; ils sont faits ensemble.

⚠⚠ **LES QUARANTE-SIX PICTOGRAMMES SONT À L'ÉCRAN.** Aucun n'est produit sans
être employé, aucun n'est employé sans être dans l'atlas — `CÂB T3` mesure les
deux sens.

---

## 1. Ce qu'Ethan a tranché, et ce que ça a coûté

**La grille : 128.** C'est la réponse qui ne demande rien. `GRILLE_ATLAS` de
`tools/build.js` valait déjà 128, `COTE_SPRITE` de `src/data/atlas.js` aussi, et
**la constante reste UNIQUE** au lieu de devenir une valeur par famille — c'est
le vrai gain de cet arbitrage, plus encore que les pixels. La grille 64 continue
d'être produite comme pour les neuf autres familles : elle ne coûte rien au
livrable, et la retirer serait une exception de plus dans `tools/planches.py`
pour zéro octet gagné.

---

## 2. Le poids — une seule ressource entre, et c'est tout le coût

| poste | après PICTOGRAMMES | après CÂBLAGE | delta |
|---|---:|---:|---:|
| **total** | **8 016 124** | **8 254 664** | **+238 540** |
| images | 6 306 280 | 6 540 220 | **+233 940** |
| JavaScript | 362 641 | 365 542 | +2 901 |
| feuille | 119 742 | 121 441 | +1 699 |
| balisage | 39 901 | 39 901 | +0 |
| audio | 1 187 560 | 1 187 560 | +0 |
| lignes `data:` | 296 | 297 | **+1** |
| URI `data:` | 291 | 292 | **+1** |

La somme des cinq postes tombe **exactement** sur le total, dans les deux
mesures. Marge sur la borne T10 : **1 045 336 octets, 11,24 %**. La borne ne
bouge pas.

⚠⚠ **UNE SEULE RESSOURCE ENTRE, ET LES QUARANTE-SIX POSES NE COÛTENT RIEN DE
PLUS.** Le câblage tient en deux lignes :

- `src/index.src.html` déclare `--atlas-interface: url('%ATLAS_INTERFACE%')` ;
- `tools/build.js` ajoute `atlas('interface')` à `FICHIERS_INLINE`.

Ensuite `.picto` pointe la variable **une fois pour toutes**, et chaque
pictogramme ne porte que son **cadrage** — deux propriétés. Recopier l'adresse
`data:` sur chaque élément l'aurait fait entrer autant de fois qu'il y a de
pictogrammes à l'écran ; c'est très exactement le calcul qui a mis les quatre
atlas d'unité dans une variable plutôt que dans une balise, au lot du 30/08.

⚠ **`ATLAS_DE_LA_PAGE` N'A PAS BOUGÉ.** La table de `ui/session.js` recopie
l'adresse d'un atlas dans le `src` d'une balise `img`, pour les canevas qui
veulent un `HTMLImageElement`. **Aucun canevas ne dessine de pictogramme** — ils
sont tous en fond CSS —, donc une entrée de plus y aurait été une ligne morte.

---

## 3. Où va chacun des quarante-six

⚠⚠ **AUCUN ÉCRAN N'ÉCRIT UN NOM DE SPRITE EN DUR.** `src/ui/pictogramme.js`
traduit une clé de **donnée** en nom de sprite, et `CÂB T4` balaye les douze
autres fichiers de `src/ui/` pour le vérifier.

| pictogrammes | n | où, et depuis quelle donnée |
|---|---:|---|
| `ui_quartz` `ui_scorie` `ui_electricite` | 3 | les trois tuiles du bandeau `#ressources`, **et** les lignes de production et de stockage de la fiche d'un bâtiment — depuis la clé de `RESSOURCES` |
| `ui_points_attaque` | 1 | la tuile « Attaque » du bandeau |
| `ui_emplacement` | 1 | le compteur contextuel sur la bande Bâtiments, **et** la ligne « Bâtiments posables » |
| `ui_armee_defensive` | 1 | le compteur contextuel sur la bande Défense |
| `ui_armee_offensive` | 1 | le compteur contextuel sur l'écran Offense |
| `ui_recherche` | 1 | le compteur de points de l'écran Recherche |
| `ui_cible_*` | 3 | les trois lignes de dégâts d'une fiche — depuis `COLONNES_DEGATS` |
| `ui_chassis_*` | 3 | les vignettes de la palette d'Offense (depuis `UNITES[id].chassis`) **et** les lignes de réparation induite du rapport de raid |
| `ui_categorie_*` | 4 | les vignettes de la palette sur la bande Défense — depuis `DEFENSES[id].type` |
| `ui_module_*` | 14 | les cadres de l'écran Recherche, à la place de la pastille `◈` — **dérivés** des clés de `MODULES` |
| `ui_pv` | 1 | la ligne « Points de vie » d'une fiche |
| `ui_degats` | 1 | la ligne « État », qui dit le pourcentage de dégâts subis |
| `ui_butin` | 1 | la ligne « Butin » du rapport de raid |
| `ui_reparation` | 1 | le bouton « Réparer » du bandeau d'action |
| `ui_temps` | 1 | les lignes d'effet de forme `duree`, **et** « Durée du combat » |
| `ui_niveau` | 1 | le **titre** des deux fiches, qui porte toujours « · niv. N » |
| `ui_verrou` | 1 | toute vignette verrouillée, dans les **deux** palettes |
| `ui_vague` | 1 | les titres des quatre vagues d'assaut |
| `ui_budget` | 1 | la ligne « Points engagés » d'une fiche, et le coût d'une vignette d'Offense |
| `ui_fleche_gauche` `ui_fleche_droite` | 2 | la bascule entre bases, à la place des glyphes `◀` et `▶` |
| `ui_fleche_verte` | 1 | le bouton d'amélioration du panneau, **et seulement s'il est possible** |
| `ui_plus` `ui_moins` | 2 | le bilan du panneau de transfert |
| **total** | **46** | |

⚠⚠ **LES QUATORZE MODULES SONT DÉRIVÉS, PAS TABULÉS.** Quatorze lignes écrites à
la main seraient quatorze occasions de se tromper de module — et c'est le risque
réel de cette famille : les planches s'annoncent « modules 1-8 » et « 9-14 » sans
que cette numérotation soit celle de `MODULES`. La conversion camel → serpent est
la même que celle qui a servi à **nommer** les sprites au lot précédent, donc les
deux ne peuvent pas diverger.

⚠ **`ui_plus` ET `ui_moins` NE VONT NULLE PART AILLEURS.** Ce sont les deux
seules lignes du jeu où un signe dit une **opération** : la taxe retire en
chemin, le reçu ajoute à l'arrivée. Il n'existe **aucun bouton de pas** dans la
page — le zoom se fait au doigt, arbitré le 30/08 : « pas de zoom fixe avec + − ».
Les poser sur un réglage inventé aurait été remplir une case.

⚠ **`ui_fleche_verte` NE PARAÎT QUE SI L'AMÉLIORATION EXISTE.** Au plafond, le
bouton dit « Niveau maximum » : une flèche montante à côté de cette phrase
promettrait le geste qu'elle annonce impossible.

---

## 4. Ce que le câblage a corrigé en passant

⚠⚠ **LA GARDE `CÂB T4` S'EST DÉCLENCHÉE SUR LA PHRASE QUI LA DÉCRIVAIT.** Elle
cherche un nom de sprite d'interface entre guillemets dans `src/ui/` ; le
commentaire d'import de `chantier.js` en citait un **en exemple**. C'est le cas
que le dépôt raconte déjà pour `viewport-fit=cover` et pour `MENTION_SATURE`, vu
par l'autre bout : une garde qui lit ce qu'on écrit à son sujet. Le commentaire
ne le cite plus.

⚠⚠ **ET ELLE NE RETIENT QUE CE QUI EST DANS L'ATLAS.** Les sons du pack portent
le **même préfixe** — `ui_click`, `ui_error`, `ui_toggle_on` — et `ui/session.js`
les nomme en clair, comme il doit : ce ne sont pas des sprites. Une garde qui
accuserait sur le préfixe seul serait rouge pour une raison qui ne la regarde
pas, et on l'assouplirait pour de mauvaises raisons.

⚠⚠ **DEUX HARNAIS DE TEST ONT DÛ APPRENDRE QUELQUE CHOSE, ET AUCUN NE S'EST
ASSOUPLI.**

1. Le faux document de `recherche.test.js` ne savait pas recevoir
   `setAttribute`, que `creerPictogramme` emploie pour `aria-hidden` et
   `aria-label`. Il l'apprend, et les attributs sont **relus** par `CÂB T6` —
   sans quoi ce serait une méthode qui avale ce qu'on lui donne.
2. `casesDesVagues` d'`offense.test.js` descendait **à plat** dans les enfants
   d'une vague, donc dans son TITRE. Celui-ci ne portait que du texte ; il porte
   maintenant un pictogramme et un nœud de texte, d'où une « lecture de `vague`
   sur `undefined` » à des lieues de sa cause. Il ne descend plus que dans la
   rangée d'emplacements, qui est **nommée**.

⚠ **`CH-F T7` ET `ERGO T7 bis` ONT CHANGÉ DE FORME ATTENDUE, PAS DE SÉVÉRITÉ.**
Le premier exige toujours l'**égalité** des clés d'une ligne d'effet, pas leur
inclusion : une ligne qui gagnerait un champ de plus le ferait encore rougir. Le
second exige que les deux fiches aient exactement les mêmes clés — et c'est lui
qui a attrapé le `picto` ajouté d'un seul côté.

---

## 5. Les tests

| code | ce qu'il prouve |
|---|---|
| **CÂB T1** | la famille entre dans le livrable, et par le seul chemin qui existe : la variable dans la feuille, la ligne dans le build, le marqueur **remplacé** dans `dist/` |
| **CÂB T2** | chaque table de pictogrammes couvre **exactement** sa table de données — ressources, colonnes de dégâts, châssis, catégories, et les quatorze modules dérivés |
| **CÂB T3** | les quarante-six sont **tous** employés, et rien d'autre ne l'est — dans les deux sens |
| **CÂB T4** | aucun écran n'écrit un nom de sprite d'interface en dur |
| **CÂB T5** | un pictogramme se pose avec le bon cadrage, deux cellules différentes en ont deux différents, et un nom inconnu **lève** |
| **CÂB T6** | décoratif ou parlant, jamais les deux, jamais ni l'un ni l'autre |
| **CÂB T7** | les deux fiches portent les pictogrammes de la **donnée**, ligne par ligne, et le titre porte le niveau |
| **CÂB T8** | les cinq tuiles du bandeau portent leur pictogramme **dans l'ordre du DOM**, le compteur **suit la bande**, et il ne crée pas un nœud par image |

**`npm run check` : 1323 pass / 0 fail.** +8 tests, **aucune assertion retirée**.

⚠ **LE MONTAGE DE `CÂB T8` EST FALSIFIABLE DANS LES TROIS SENS** : il compare la
liste ordonnée des cinq pictogrammes, il change de bande et vérifie que le
cinquième change **puis revient**, et il recompte les nœuds après cinq bascules —
`rafraichir` repasse dix fois par seconde, et un pictogramme construit là aurait
fait six cents `<span>` par minute sans qu'aucune longueur ne soit fausse.

---

## 6. Écarts et points en suspens

1. ⚠⚠ **LE RENDU N'A PAS ÉTÉ VU, NI SUR APPAREIL NI DANS UN NAVIGATEUR, ET SE
   DÉCLARE NON EXÉCUTÉ.** Ce lot est entièrement visuel ; ce qui est mesuré ici
   est le **DOM** et les **octets**, pas l'aspect. Aucun des quarante-six n'a été
   vu à sa taille d'affichage réelle. La taille CSS retenue est `1.15em` avec
   `vertical-align: -0.2em` : elle suit le texte plutôt qu'un nombre de pixels,
   pour rester accordée au libellé quand la ligne change de corps. **C'est le
   premier réglage à revoir à l'œil.**
2. ⚠ **`python3 tools/verifier.py` N'A PAS ÉTÉ RELANCÉ, ET C'ÉTAIT CONFORME** :
   le câblage ne touche ni `art/`, ni un outil de la chaîne graphique — pas un
   octet d'`art/sprites/` ne change. Le verdict du lot précédent tient : 681
   identiques, 269 différents (264 sons sans `opusenc`, 3 WebP, 2 JSON en CRLF),
   0 nouveau, 0 manquant.
3. ⚠ **LA PALETTE DE LA BANDE DÉFENSE PORTE DEUX PICTOGRAMMES SUR CERTAINES
   VIGNETTES** — la catégorie et, si elle est verrouillée, le cadenas. Les huit
   unités de garnison, elles, n'ont **pas** de catégorie : `UNITES` ne porte pas
   de `type`, et une escouade n'est ni un mur, ni une barrière, ni une tourelle,
   ni une artillerie. Leur en inventer une aurait été mentir ; leur poser leur
   **châssis** serait défendable, et c'est une décision d'interface qu'Ethan peut
   prendre en voyant l'écran.
4. ⚠ **CE QU'ETHAN TRANCHE** : la taille d'affichage (point 1) et la question du
   point 3.
