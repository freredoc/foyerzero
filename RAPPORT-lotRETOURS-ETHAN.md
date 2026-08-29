# RAPPORT — lot RETOURS-ETHAN

**Six retours d'Ethan du 29/08/2026, traités un par un.** Cinq sont sans
ambiguïté et sont faits ; le sixième est une observation dont j'ai traité la
cause visible sans toucher aux données arbitrées — c'est dit au §6.

Tout est **mesuré**, jamais estimé.

---

## 1. Ce qui a été produit

| Grandeur | Avant | Après |
|---|---|---|
| `package.json` | version 0.30.0, `config.build` `"31"` | version **0.31.0**, `config.build` **`"32"`** |
| `npm test` | 458 pass / 0 fail | **467 pass / 0 fail** |
| `npm run build` → `dist/index.html` | 503 724 octets | **512 912 octets** (+9 188) |
| `SAVE_VERSION` | 8 | **8, inchangé — aucune migration** |

⚠ Les deux champs de `package.json` ont été édités **textuellement** : ce sont
des **chaînes**, et `android/app/build.gradle.kts` les lit `as String`. Vérifié
après coup, guillemets compris.

⚠ **AUCUNE SAUVEGARDE N'A CHANGÉ DE FORME**, et c'est un choix, pas une chance :
les deux règles neuves — le plafond du Chantier, le bâtiment de production — sont
des règles de GESTE, jamais de `verifierEtat`. Voir §3 et §5.

---

## 2. Les flèches de voisinage — un trait épais de centre à centre

> « Les flèches de la base (collecteur raffinerie) sont bien trop petites. Elle
> doit partir du centre d'une case à l'autre. Trait épais. »

Ce qui existait était un **glyphe de 11 px** (`↑↓←→↖↗↙↘`) posé en bas à droite de
la case voisine. Lisible sur une capture d'écran de bureau ; invisible au doigt.

**Un trait relie DEUX cases, il ne peut donc pas vivre dans une case.** D'où un
calque SVG posé sur `#chantier-grille`, dont le `viewBox` prend la **case pour
unité** — `0 0 9 18`. L'épaisseur est une fraction de case (**0,16**) et suit
donc la taille de l'appareil, là où un nombre de pixels serait gros sur un petit
écran et maigre sur un grand.

La géométrie est une **fonction pure** — `traitDeVoisinage(depart, arrivee)` —
qui ne connaît ni pixels, ni canevas, ni SVG. C'est ce qui la rend testable dans
un dépôt sans navigateur. Mesuré sur un voisin à droite :

```
fût    (2,5 ; 3,5) → (3,16 ; 3,5)      épaisseur 0,16 case
pointe (3,5 ; 3,5) (3,16 ; 3,33) (3,16 ; 3,67)
```

Le fût part **exactement du centre** de la case du voisin et s'arrête à la base
de la pointe ; la pointe a son sommet **exactement au centre** de la case du
bâtiment. Le bout rond du fût déborde d'une demi-épaisseur (0,08), moins que la
longueur de la pointe (0,34), donc il reste caché dessous.

⚠ **`pointer-events: none`, sans exception.** Un trait posé par-dessus une case
qui avalerait le toucher serait la même faute que le `transform: scale()` que le
dépôt interdit sur la grille : le doigt se décrocherait de la case qu'il vise.

⚠ **Le glyphe survit dans l'infobulle du SVG**, et un test l'ACCORDE au trait :
le glyphe est le *libellé* de la flèche, le couple départ/arrivée est son
*dessin*. Deux représentations d'un fait, donc une garde qui les compare — pas
une duplication laissée seule.

⚠ **Une URL entre dans le livrable, et il a fallu l'admettre explicitement.**
`http://www.w3.org/2000/svg` est l'argument obligatoire de `createElementNS` : un
IDENTIFIANT, jamais une adresse — rien n'est téléchargé depuis là. La garde
offline de `tools/build.js` et T10 le retirent **à l'identique** et refusent tout
le reste, `w3.org` compris. Le contourner en assemblant l'URL à l'exécution
aurait marché aussi, et c'est exactement ce que le dépôt interdit pour les hex à
trois chiffres : passer sous un garde-fou en silence coûte plus cher que la
contrainte qu'il pose.

---

## 3. Le Chantier plafonne la base, et définit les temps de réparation

> « Le chantier de construction définit le niveau max des bâtiments. Donc aucun
> bâtiment ne peut avoir un niveau supérieur à celui du chantier. Il définit
> aussi les temps de réparation. »

**Le plafond** vit dans `problemesDeLAmelioration`, code `plafond-chantier`.
Mesuré de bout en bout : un Collecteur de niveau 1 sous un Chantier de niveau 1
est refusé avec « le Chantier de construction est au niveau 1 : montez-le
d'abord » ; le Chantier monté au niveau 2, la montée passe ; elle se rebloque au
niveau 2.

⚠ **Le Chantier ne se plafonne pas lui-même.** Il EST la référence ; lui
appliquer la règle le figerait à son niveau de départ et plus rien ne monterait
jamais. Son seul plafond reste celui du jeu (50), et c'est ce plafond-là qui
parle en premier au niveau 50 — sinon le message enverrait monter un bâtiment
déjà au bout.

⚠ **Ce n'est pas une règle de `verifierEtat`.** C'est une règle d'AMÉLIORATION :
aucune sauvegarde ne devient illisible, aucune migration n'est due.

**Les temps de réparation** : `REPARATION_BASE_JOUEUR.indexeeSur` NOMME le
bâtiment, comme `POINTS_ARMEE` nomme déjà celui de chaque budget.

⚠⚠ **Mais la courbe n'est pas donnée, donc elle n'est pas écrite.** Ethan a dit
QUI décide, pas de combien. `courbe: null`, et un test l'asserte de face.
Inventer un barème le figerait sous l'apparence d'une donnée relevée — c'est la
faute que `CLAUDE.md` §6 raconte déjà pour la pente de `data/niveaux.js`, restée
quatre jours à citer une source qu'on s'interdit de lire. **Point ouvert.**

---

## 4. La table d'emplacements du Chantier

> « Chantier de construction niv 1 : 3 emplacements. 2 : 6, 3 : 8, 4 : 10,
> 5 : 12, 6 : 14, 7 : 16, 8 : 18, 9 : 19, 10 : 20. »

Transcrite telle quelle dans `EMPLACEMENTS.parNiveau`. **Ce n'est pas une
formule** : les écarts font +3, +3, puis +2 six fois, puis +1 deux fois, et
aucune expression close ne rend ces dix valeurs. En chercher une aurait donné une
courbe « presque » juste — c'est-à-dire fausse sur deux ou trois niveaux,
silencieusement. Les dix sont écrits, et un test les asserte tous les dix.

⚠ **Au-delà de dix, rien n'a changé.** La table rejoint l'ancienne courbe
exactement au niveau 10 — 20 des deux côtés — donc les niveaux 11 à 50 rendent
les mêmes nombres qu'avant. Vérifié : 11 → 21, 20 → 30, 29 → 39, 30 → 40 (le
plafond mord toujours au niveau 30), 50 → 40.

**Ce qui change pour le joueur, c'est le début de partie** :

| | avant | après |
|---|---|---|
| emplacements libres au niveau 1 | 1 | **2** |
| niveau nécessaire aux 7 bâtiments obligatoires | 4 | **3** |

La chaîne d'ouverture de `CLAUDE.md` §6 a été **remesurée**, pas recopiée :

| Geste | Stocks | Capacités | Emplac. |
|---|---|---|---|
| base neuve | 30 / 30 / 20 | 50 / 50 / 40 | 1 / **3** |
| Chantier → niv. 2 (8 quartz) | 22 / 30 / 20 | 63 / 63 / 50 | 1 / **6** |
| + Collecteur sur un champ | 22 / 30 / 20 | 63 / 63 / 50 | 2 / 6 |
| + Raffinerie voisine | 22 / 30 / 20 | 83 / 83 / 50 | 3 / 6 |
| après 1 h | 83 (saturé) / 30 / 20 | 83 / 83 / 50 | 3 / 6 |

Stocks et capacités n'ont pas bougé d'une unité : c'est la MÊME chaîne, avec deux
bâtiments de marge en plus.

⚠⚠ **Et le premier geste n'est plus seulement le meilleur, il est le SEUL.** Le
plafond du §3 rend la montée du Chantier la seule montée payable d'une partie
neuve. Le test de l'amorce le vérifie maintenant au lieu de le supposer.

---

## 5. Le bâtiment de production

> « Infanterie inconstructible sans caserne. Même règle pour véhicule et avion. »

`BATIMENT_DE_CHASSIS` de `data/base.js` porte **trois lignes**, pas quatorze :
`UNITES[x].chassis` classe déjà les unités en escouade / blindé / aéronef, et les
trois bâtiments existent depuis le lot BASE-0. Une unité qui arriverait demain
hérite de la règle sans qu'on y pense. Un test croise les deux tables dans les
deux sens.

La question se pose à `batimentDeProductionManquant` de `sim/state.js`, qui rend
la clé du bâtiment manquant ou `null`.

⚠ **Elle vaut pour les DEUX forces, et c'est une lecture.** Ethan a énoncé une
règle sur les UNITÉS, sans dire « à l'assaut » ni « en garnison » : la
restreindre à un écran aurait été le choix arbitraire, pas l'appliquer partout.
Les six ouvrages fixes et les trois artilleries ne sont pas dans `UNITES`, n'ont
pas de châssis, et ne sont pas concernés — un mur n'a jamais eu besoin d'une
caserne. **Si Ethan voulait la limiter à l'assaut, c'est une ligne à retirer.**

⚠⚠ **Et elle n'est PAS dans `verifierEtat`, exactement comme le budget.** Elle
peut devenir fausse SOUS une composition déjà posée — la Caserne démolie, ou
tombée au raid — et refuser le chargement rendrait la partie injouable pour une
faute que le joueur n'a pas commise. On SIGNALE au geste, le joueur purge. C'est
aussi ce qui évite une migration : **mesuré** — une armée posée, la Caserne
démolie, la partie se sérialise et se recharge sans un mot.

---

## 6. « Guardian et Paladin indisponibles » — ce qui a été fait, et ce qui ne l'a pas été

C'est le seul point que la phrase ne tranche pas seule. **Ce qui est mesuré** :

| Unité (nom TA) | clé | châssis | apparition |
|---|---|---|---|
| Guardian | `ratisseur` (Éclaireur) | blindé | **18** |
| Paladin | `busard` (Épervier) | aéronef | **14** |

Ce sont les deux seuils les plus hauts parmi les unités de milieu de roster, et
l'ancienne palette de l'Offense **RETIRAIT** tout ce qui était au-dessus du
niveau du Centre de commandement. Les deux disparaissaient donc sans un mot.

**Ce qui a été fait** : la palette montre désormais **le roster entier**, éteint
ce qui ne se construit pas, et **DIT pourquoi** au toucher — « apparaît au niveau
18 », « sans Aérodrome, pas d'avion », « aucun Centre de commandement posé ».
Vérifié dans un navigateur, avec un Centre de commandement de niveau 20, une
Caserne et un Dépôt de véhicules posés :

```
vives   : Fusiliers, Grenadiers, Cuirassiers, Éclaireur, Chasseur, Pionnier
grisées : Voltigeurs (apparaît au niveau 22) | Sapeurs (niveau 24) |
          Percheron (niveau 28) | Obusier (niveau 32) | Albatros (niveau 36) |
          Milan, Épervier, Foudre (sans Aérodrome, pas d'avion)
```

**Éclaireur — Guardian — est vif** dès que le Dépôt de véhicules est posé, et
**Épervier — Paladin — dit ce qui lui manque** au lieu de s'évanouir.

⚠ **Ce qui n'a PAS été fait : toucher aux seuils.** `UNITES` fait autorité sur
`apparition` (§6 de `CLAUDE.md`, arbitré le 24/08 depuis
`RELEVE-TA-ARSENAL.md`). Si « normalement ils le sont » veut dire que **18 et 14
sont faux**, c'est un arbitrage de données qui reste à rendre, et une ligne à
changer. Je ne l'ai pas pris seul.

Trois gains, aucun cosmétique : le joueur voit ce qui existe et ce qui lui
manque ; la règle du §5 s'apprend au lieu de se deviner ; et la palette garde une
**longueur fixe**, si bien que les vignettes ne se déplacent plus sous le doigt
entre deux gestes — c'est l'argument qui avait fait griser les uniques du
Chantier le 28/08. Les deux palettes se comportent enfin pareil.

---

## 7. La barre contextuelle de l'Offense

> « On ne peut pas supprimer une unité en cliquant dessus. D'ailleurs les boutons
> réparer, améliorer etc. n'apparaissent pas dans le menu offense. »

L'écran retirait bien une unité — mais en **deux touchers implicites** qu'aucun
bouton n'annonçait : toucher une unité la prenait « en main », la retoucher la
retirait. Rien ne le disait.

`#offense-contexte` est la barre du Chantier, aux mêmes quatre boutons et au même
modèle « armer puis toucher », avec les mêmes quatre règles : retoucher l'action
armée la désarme, armer une action désarme l'autre, armer défait la palette, et
toucher une case vide désarme sans rien dire.

Mesuré dans un navigateur, sur une partie chargée depuis une vraie sauvegarde :
toucher une unité la sélectionne et la barre la nomme (« Fusiliers · vague 1 ·
niveau 1 · 5 pts ») ; armer **Retirer** puis toucher la supprime en un geste.

⚠ **« Retirer », pas « Démolir ».** On ne démolit pas des Fusiliers.

⚠ **Réparer et Améliorer n'ont toujours pas de moteur, et le disent.** `null`
dans `ACTIONS_ARMEE`, pas un bouton inerte — « un indice n'est pas une
interdiction ».

⚠ **Le chrome de l'Offense fait exactement 288 px, comme celui du Chantier** :
40 + 44 + 26 + 46 + 86 + 46. La garde de `chantier.test.js` somme désormais les
**deux** écrans, là où elle n'en mesurait qu'un.

### Trois défauts trouvés à l'essai, pas à la relecture

1. **La table des messages de mode ne couvrait pas « Retirer ».** Une première
   écriture reprenait `MESSAGES_MODE` du Chantier avec un repli en `??` : le
   bouton annonçait « Mode DÉPLACER : touchez le **bâtiment** à déplacer ».
   L'Offense a maintenant sa propre table, et un test exige que ses clés soient
   **exactement** celles de `ACTIONS_ARMEE`.
2. **Les messages de refus parlaient de la défense et de bâtiments.**
   `actionSansMoteur` disait « pour la défense » en dur, `PAS_DE_REPARATION`
   « aucun bâtiment » : juste tant que la barre n'existait qu'au Chantier, faux
   dès qu'elle est apparue à l'Offense — et déjà faux sur la bande de garnison.
   Le terrain donne maintenant le **constat entier**. Deux essais ont été
   nécessaires : « aucun unité » d'abord, « aucune unité n'est endommagé »
   ensuite. **Une phrase française ne se recompose pas morceau par morceau.**
3. **La palette de l'Offense débordait.** Elle gardait ses colonnes de 82 px et
   son `overflow-x: auto` — tolérable tant qu'elle filtrait et n'en montrait que
   trois ou quatre, insupportable depuis qu'elle en montre quatorze. Colonnes
   calculées (`Math.ceil(n / 2)`), `overflow: hidden`, et
   `overflow-wrap: anywhere` sur le libellé : à sept colonnes sur 360 px la
   vignette fait 47 px, et sans point de coupure « Cuirassiers » se lisait
   « UIRASSIER ». Mesuré après correction : `scrollWidth === clientWidth`, zéro
   libellé rogné.

---

## 8. Les tests

**467 pass / 0 fail**, `npm run check` complet en 8,1 s. **Neuf tests neufs**,
aucun fichier neuf — les six retours touchent du code qui existait déjà.

| Fichier | Test neuf |
|---|---|
| `base.test.js` | chaque châssis a son bâtiment de production, et il existe |
| `base.test.js` | la réparation est indexée sur le Chantier, et sa courbe n'est pas inventée |
| `state.test.js` | le Chantier plafonne toute la base, sauf le sien |
| `state.test.js` | une unité demande son bâtiment, et la règle n'est pas au chargement |
| `chantier.test.js` | un TRAIT ÉPAIS de centre à centre, pas un glyphe dans un coin |
| `chantier.test.js` | le trait et le glyphe disent la MÊME direction |
| `chantier.test.js` | le calque SVG est dans la page, stylé, et ne prend aucun geste |
| `offense.test.js` | la barre contextuelle existe, et ses quatre boutons répondent |
| `offense.test.js` | la palette ne défile pas : ses colonnes se calculent |

### Onze tests existants ont changé de cible — aucun ne s'est assoupli

Chaque changement suit un **arbitrage** d'Ethan, et plusieurs assertions sont
maintenant **plus fortes** qu'avant :

- les tests d'emplacements assertent désormais **les dix valeurs** de la table,
  là où ils en échantillonnaient quatre ;
- les montages de saturation **remplissent jusqu'à ce que la fonction dise
  plein** au lieu de compter les poses à la main : la prochaine table ne les fera
  pas retomber ;
- le test de l'amorce vérifie maintenant **l'ordre imposé** de l'ouverture
  (Chantier d'abord) au lieu de le supposer ;
- le test de la palette de l'Offense asserte la **longueur constante**, propriété
  qu'il ne pouvait pas asserter quand elle filtrait ;
- le test de la palette de Défense distingue les **deux verrous** — niveau et
  bâtiment — là où il n'en connaissait qu'un.

Le montage partagé `baseAvecCollecteur` monte désormais son Chantier : on écrit
la règle **dans le montage**, on ne la désarme pas.

---

## 9. La falsification

Chaque défaut injecté dans une **copie fraîche**, la suite relancée, puis le
défaut retiré. Résultats **mesurés**.

| # | Défaut injecté | Où | Résultat |
|---|---|---|---|
| G1 | le trait repart du bord de la case au lieu du centre | `ui/chantier.js` | **ROUGE** — 2 tests |
| G2 | le trait maigrit au niveau de l'ancien glyphe (0,05) | `ui/chantier.js` | **ROUGE** — géométrie |
| G3 | `pointer-events: none` retiré du calque | `index.src.html` | **ROUGE** — 2 tests |
| G4 | le Chantier se plafonne lui-même | `sim/state.js` | **ROUGE** — 2 tests |
| G5 | le plafond du Chantier neutralisé | `sim/state.js` | **ROUGE** — 2 tests |
| G6 | la table d'emplacements retombe sur l'ancienne courbe | `data/base.js` | **ROUGE** — 7 tests |
| G7 | un châssis perd son bâtiment de production | `data/base.js` | **ROUGE** — croisement |
| G8 | la règle du bâtiment ne s'applique plus | `sim/state.js` | **ROUGE** — 4 tests |
| G9 | la palette de l'Offense se remet à filtrer | `ui/offense.js` | **ROUGE** — palette |
| G10 | la table des messages de mode perd « Retirer » | `ui/offense.js` | **ROUGE** — parité des clés |
| G11 | la palette de l'Offense redéfile | `index.src.html` | **ROUGE** — mise en page |

⚠ **Une garde a dû être resserrée avant d'être crue.** Le test du calque SVG
cherchait d'abord `className = 'fleche'` dans TOUT `ui/chantier.js` — et
accusait le « → » du panneau de détail, qui porte la même classe pour une raison
sans rapport et garde sa propre règle CSS. **Un garde-fou qui accuse un innocent
finit par être désarmé** : il est maintenant borné au corps de `peindreApercu`.

---

## 10. La vérification en navigateur — mais pas sur l'appareil

Le `dist/index.html` livré a été chargé dans Chromium (360 × 740 CSS, DPR 3,
mode tactile), y compris **depuis une vraie sauvegarde injectée dans
`localStorage`** pour atteindre un état de jeu avancé.

| Ce qui a été essayé | Résultat |
|---|---|
| compteur d'emplacements d'une base neuve | **1 / 3** — la table dictée est à l'écran |
| améliorer un Collecteur sous un Chantier de niveau 1 | « le Chantier de construction est au niveau 1 : montez-le d'abord » |
| poser Collecteur + Raffinerie voisins, ouvrir le panneau | **un trait épais ambre de centre à centre**, pointe sur le Collecteur |
| palette de l'Offense, roster complet | 14 vignettes, 8 grisées, chacune avec sa raison |
| toucher une vignette grisée | « Épervier — sans Aérodrome, pas d'avion. » |
| toucher une unité posée | sélectionnée, nommée dans la barre |
| armer **Retirer** puis toucher | **l'unité disparaît** |
| armer Réparer / Améliorer puis toucher | « aucune unité n'est endommagée… » / « … pour l'armée » |
| débordement de la palette | `scrollWidth === clientWidth`, aucun libellé rogné |
| erreurs de page | **aucune**, sur tous les parcours |

⚠ **Ce n'est pas une vérification appareil.** C'est un navigateur de bureau : le
comportement sous WebView Android, les marges système et les temps de rendu réels
restent **non mesurés**.

---

## 11. Ce qui reste ouvert

- **La courbe de réparation** — le bâtiment qui décide est nommé, le barème non
  (§3). C'est le premier trou à combler côté données.
- **Les seuils d'apparition de Guardian (18) et Paladin (14)** — si c'est eux
  qu'Ethan visait, c'est un arbitrage de données que je n'ai pas pris (§6).
- **La règle du bâtiment de production en GARNISON** — appliquée par lecture, pas
  par arbitrage explicite (§5). Une ligne à retirer si elle doit être limitée à
  l'assaut.
- **Améliorer et Réparer une unité** — les boutons existent et disent ce qui
  manque ; le moteur, lui, n'existe toujours pas. Le coût d'une amélioration est
  arbitré depuis le 28/08, sa mécanique non.
- **Le trait recouvre le sigle du bâtiment qu'il vise** — c'est la conséquence
  directe de « du centre d'une case à l'autre », et les traits ne s'affichent que
  transitoirement. À revoir si ça gêne.
- **La barre de l'Offense tronque le détail de la sélection** sur un écran de
  360 px (« vague 2 · niv… ») — même comportement que celle du Chantier, par
  `text-overflow: ellipsis`.

---

## 12. Livraison

Suite **verte, mesurée** : 467 pass / 0 fail. Build **vert** : 512 912 octets,
0 référence externe hors l'espace de noms SVG (§2).

Le lot **ne se découpe pas** : les tests d'emplacements et le plafond du Chantier
sont deux faces du même changement de règles, et `main` serait rouge entre les
deux. Commité d'un bloc.

PR ouverte, **non fusionnée** : le merge sur `main` appartient à Ethan seul.
