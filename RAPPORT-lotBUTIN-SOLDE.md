# RAPPORT — lot BUTIN-SOLDÉ — 29/08/2026

Écrit et vérifié par exécution sur un clone neuf de `freredoc/chantier`.

| Grandeur | Avant | Après |
|---|---|---|
| Version | 0.35.0 · build 36 | **0.36.0 · build 37** |
| `npm run check` | 520 pass / 0 fail | **521 pass / 0 fail** |
| `dist/index.html` | 528 601 octets | **528 838 octets** (+237) |
| `SAVE_VERSION` | 11 | **11, inchangé** |

⚠ **AUCUNE MIGRATION, ET C'EST LE POINT LE PLUS UTILE DU LOT.** La règle change,
la table des sites entamés ne change pas : ce qu'un bâtiment a déjà payé se
**déduit** de ses PV restants, qui étaient déjà rangés. Une sauvegarde v11
écrite ce matin joue la nouvelle règle sans rien convertir.

---

## 1. Ce qu'Ethan a tranché

« Livre tout » devient **« livre ce qui reste à livrer »**. Deux conséquences,
et la seconde ne se voyait pas dans le rapport d'hier :

1. **Un rasage solde ce qui était encore debout en arrivant**, pas le plein
   nominal du site.
2. **Une passe ne paie que les dégâts qu'ELLE a faits.** La fuite n'était pas
   seulement sur le rasage : `butin` lisait `pvPerdusMilli`, c'est-à-dire tout ce
   que la pièce avait perdu **depuis son plein**. Une seconde passe repayait donc
   les dégâts de la première même sans faire tomber la Souche. Mesuré et corrigé
   en même temps.

## 2. Comment, sans rien stocker de plus

L'entité de combat retient désormais ses **PV de départ de ce combat-ci**
(`pvInitialMilli`), distincts de `pvMaxMilli`. Sur un site intact les deux sont
égaux ; sur un site entamé, l'écart EST ce qui a déjà été payé.

```
passe :   gagne = plein × (pvInitial − pvFinal) / pvMax
rasage :  gagne = plein × pvInitial / pvMax
```

Rien n'est rangé en plus : les PV restants d'un site entamé, que le lot
précédent sauvegardait déjà, portent toute l'information.

⚠ **LE CAS INTACT EST TRAITÉ À PART, ET CE N'EST PAS UNE OPTIMISATION.**
`plein × pvInitial / pvMax` vaut mathématiquement `plein` quand les deux sont
égaux — mais pas en flottant, où le produit intermédiaire déplace le dernier
chiffre. Six tests mesurent ce butin **au champ près** sur des sites intacts ;
c'est cette ligne qui les laisse exacts, et ils sont restés verts sans être
touchés.

## 3. Mesuré

Avant-poste niveau 6, graine 2026, rasé en deux passes :

| | Quartz | Scorie |
|---|---|---|
| Valeur du site | 18 504 | 6 168 |
| Encaissé, règle d'avant | 21 397 | 7 132 |
| **Encaissé, règle d'Ethan** | **18 504** | **6 167** |

L'unité de scorie manquante est un arrondi au plancher, une fois par passe et
par ressource. Un test l'encadre des deux côtés : jamais au-dessus de la valeur
du site, jamais huit unités en dessous.

Et la mesure exacte, sans combat, sur les onze bâtiments du même site : chaque
passe rend **la moitié** de la valeur à une unité près, et les deux ensemble ne
dépassent jamais le total.

## 4. Ce que le mini-onglet dit maintenant

`butinSiToutTombe` ne répond plus « ce que ce site vaut neuf » mais **« ce qu'il
te reste à prendre »** : le nombre baisse à mesure que le joueur use le site.
C'est la seule réponse cohérente avec la nouvelle règle — l'ancienne aurait
promis un butin que le raid ne verse plus.

⚠ Conséquence technique : la fonction **monte un combat** pour répondre, parce
que la réponse dépend des PV du montage et que seul `creerCombat` sait les mettre
à l'échelle du niveau. C'est le seul coût du lot.

## 5. Une faute de montage, attrapée par la mesure

Le premier jet lisait `pvPerdusIciMilli` sur la ligne de résultat. Ce champ est
**figé à la construction du résultat** : un test qui abîme une ligne après coup
le laissait à zéro, et le butin tombait à zéro **sans rien dire**. Le test l'a
attrapé parce qu'il assertait une valeur attendue — la moitié de la valeur du
site — et non « quelque chose de plus que zéro ».

`butin` recalcule donc la perte depuis `pvInitialMilli` et `pvMilli` plutôt que
de la lire figée. Deux soustractions valent mieux qu'un champ qui ment.

## 6. Ce qui reste ouvert

1. ⚠ **Les points de recherche ont le même défaut, et il n'est PAS corrigé.**
   `pointsRecherche` lit `pvPerdusMilli`, c'est-à-dire la perte **depuis le
   plein** : une défense entamée à la première passe et achevée à la seconde
   marque une fois et demie. La règle n'a pas été touchée parce que l'arbitrage
   d'Ethan portait sur le butin.

   ⚠⚠ **CORRECTION DU 29/08 AU SOIR, ET ELLE PORTE SUR CE RAPPORT-CI.** Ce
   paragraphe disait d'abord « un barème à plat, par défense endommagée », donc
   un DOUBLE comptage. C'était faux : le barème est proportionnel à la fraction
   de PV détruits depuis le lot RECHERCHE, et la faute est un excès d'une
   demi-part, pas d'une part entière. L'erreur vient d'une lecture du
   COMMENTAIRE — « barème par défense détruite » — au lieu du calcul, qui
   multiplie bien par `pvPerdusMilli / pvMaxMilli` trois lignes plus bas.
   Corrigé par le lot RECHERCHE-AU-PRORATA.
2. **Une base de l'Ouvrage se refarme**, elle. Tout revient en une heure, donc le
   butin aussi : casser 50 %, encaisser 50 %, attendre une heure, recommencer.
   C'est cohérent avec « une base se prend d'un coup ou pas du tout » et avec le
   modèle d'origine — mais c'est un revenu régulier, et il vaut d'être vu avant
   d'équilibrer l'économie.
3. Les blocages d'1 h et 24 h, le rayon du territoire, les 4 645 ticks d'un raid.
