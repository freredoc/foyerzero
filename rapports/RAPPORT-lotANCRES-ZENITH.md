# RAPPORT — lot ANCRES-ZÉNITH

**19/09/2026 — branche `claude/ancres-zenith-disque-inscrit`, depuis `main` = `2a19761`.**
**Version et build réellement produits : `0.99.67` · build `179`.** `dist/index.html`
passe de 9 409 330 à 9 409 289 octets (−41 : les deux tables de `src/data/`) ;
le bump est dû, le livrable change.

`npm run check` : **vert avant** (1 641 tests, 1 640 pass · 0 fail · 1 skipped) et
**vert après** (1 643 tests, 1 642 pass · 0 fail · 1 skipped), Node 22.23.2.

---

## 0. Pré-checks, et le cinquième qui a échoué

| # | Pré-check | Relevé |
|---|---|---|
| 1 | `git pull`, `tools/` (45), `art/sources/` (655 entrées), `art/sprites/` (14 familles + 4 JSON) | fait, arbre propre |
| 2 | `CLAUDE.md` | lu — 0.99.66 · build 178 ; §0 des lots SPRITES-V2-JOUEUR et OUVRAGE-CÂBLAGE relus en entier |
| 3 | `npm run check` avant toute modification | vert, 1 640 pass · 0 fail · 1 skipped |
| 4 | les douze `socle_def_*` | relevées, tableau §2 ci-dessous |
| 5 | sources zénithales dans `art/sources/`, déclarées | **NON** — `art/sources/` portait les V2 à 75° du 07–08/09 ; les 45 sources conditionnées étaient hors dépôt, dans `claudax/sprite/conditionne/` |

Le brief disait de s'arrêter ; je me suis arrêté et j'ai demandé. **Arbitrage
d'Ethan** : les sources viennent de `sprite/conditionne/`, je les entre moi-même ;
T1 se joue « 75° complet, au bit ». Avant d'entrer quoi que ce soit, j'ai vérifié
en lecture seule que ces fichiers étaient bien ceux que le brief a mesurés :
`ancre` de `HEAD` rend 55,1 % / −0,2 sur `def_o_batterie_socle`, 82,7 % / +7,3 sur
le créneau, rejette les trois marcheurs à 0,22 comme à 0,40, rend 26,8 % / −1,2
sur les trois socles joueur ; `pivot` rend D = 858 sur le harpon, 452 sur la
faucheuse. Tout coïncide avec les §1.1 et §1.2 du brief.

**Entrée des sources** : 22 fichiers, sous les noms que les outils lisent déjà
(`def_o_batterie_socle.png` → `socle_def_o_batterie.png`,
`def_o_batterie_tourelle_nord.png` → `def_o_batterie.png`, etc.). Les 22 versions
à 75° sont RENOMMÉES `*_75_ECARTE.png` — l'idiome du dépôt, `art/sources/` ne
s'ampute jamais — et passent dormantes. `entrees.py --declarer` (chaîne complète
rejouée, 4 min 22, `opusenc` sur le PATH) : **501 consommées · 175 dormantes ·
676 fichiers**, diff de la déclaration = exactement +22 lignes. Les 23 autres
fichiers livrés (8 ruines de défense, herse/merlon/ronce × 2 camps, 5 coques +
5 tourelles de blindé joueur) **n'entrent pas** : hors périmètre — les ruines
sont le lot RUINES-DÉFENSE.

---

## 1. Instrumentation de `ancre` AVANT correction (§3.1 du brief)

Pour chaque socle : les candidats RETENUS par les trois contraintes du 75°
(rondeur > 0,55, décalage < `decal_max`, 0,12 < w/W < 0,62), puis les trois plus
gros rejetés avec la contrainte qui les rejette. La colonne `h/w` est la
quatrième contrainte introduite par le lot ; la dernière colonne dit ce qu'elle
change. `ancre` de `HEAD` retient le plus gros candidat retenu.

| socle | decal_max | passe | taille (px) | w/W | rondeur | décal | h/w | x % | y % | contraintes 75° (3) | + h/w ≤ 1,2 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `socle_def_o_batterie` | 0.4 | sombre q10 | 145 755 | 0.54 | 0.71 | 0.00 | 1.030 | +0.0 | -0.2 | retenu | retenu |
|  |  | sombre q30 | 391 171 | 0.99 | 0.60 | 0.00 | 0.976 | -0.0 | +0.1 | rejeté : largeur | — |
|  |  | sombre q22 | 352 525 | 0.85 | 0.57 | 0.02 | 1.128 | -2.4 | -1.5 | rejeté : largeur | — |
|  |  | sombre q15 | 171 523 | 0.59 | 0.42 | 0.02 | 1.319 | -0.4 | -1.5 | rejeté : rondeur | — |
| | | **→ `ancre` réparé** | | | | | | **+0.0** | **-0.2** | diam **55.1 %** | |
| `socle_def_o_casemate` | 0.4 | sombre q30 | 194 638 | 0.54 | 0.96 | 0.00 | 1.020 | -0.0 | -0.4 | retenu | retenu |
|  |  | sombre q22 | 172 040 | 0.54 | 0.86 | 0.03 | 1.020 | +0.1 | -2.5 | retenu | retenu |
|  |  | sombre q15 | 152 436 | 0.54 | 0.76 | 0.01 | 1.020 | +0.2 | -0.7 | retenu | retenu |
|  |  | sombre q10 | 147 411 | 0.54 | 0.73 | 0.00 | 1.020 | -0.1 | -0.5 | retenu | retenu |
|  |  | sombre q6 | 145 380 | 0.53 | 0.72 | 0.00 | 1.028 | +0.0 | -0.4 | retenu | retenu |
|  |  | sombre q30 | 6 743 | 0.29 | 0.12 | 0.32 | 0.981 | +31.5 | -27.9 | rejeté : rondeur | — |
| | | **→ `ancre` réparé** | | | | | | **-0.0** | **-0.4** | diam **55.0 %** | |
| `socle_def_o_creneau` | 0.4 | **sombre q22** | **264 755** | **0.60** | **0.58** | **0.07** | **1.374** | **-0.1** | **+7.3** | **retenu — le faux positif** | **rejeté : h/w** |
|  |  | sombre q10 | 145 760 | 0.54 | 0.72 | 0.00 | 1.026 | -0.0 | -0.3 | retenu | retenu |
|  |  | sombre q30 | 353 047 | 0.85 | 0.58 | 0.03 | 1.115 | -2.5 | -1.5 | rejeté : largeur | — |
|  |  | sombre q15 | 202 170 | 0.56 | 0.45 | 0.00 | 1.478 | -0.3 | +0.4 | rejeté : rondeur | — |
| | | **→ `ancre` réparé** | | | | | | **-0.0** | **-0.3** | diam **55.0 %** | |
| `socle_def_o_faucheuse` | 0.4 | *tache q40 (nouvelle passe)* | 40 462 | 0.23 | 0.99 | 0.01 | 1.036 | -0.0 | -0.6 | retenu | retenu |
|  |  | sombre q30 | 447 571 | 0.97 | 0.68 | 0.05 | 0.952 | +0.8 | -5.0 | rejeté : largeur | — |
|  |  | trou du clair q70 | 373 793 | 0.99 | 0.55 | 0.01 | 0.939 | +0.0 | -1.2 | rejeté : rondeur, largeur | — |
|  |  | trou du clair q60 | 308 921 | 0.99 | 0.45 | 0.02 | 0.937 | +0.3 | -2.5 | rejeté : rondeur, largeur | — |
| | | **→ `ancre` réparé** | | | | | | **-0.0** | **-0.6** | diam **24.2 %** | |
| `socle_def_o_harpon` | 0.4 | *tache q40 (nouvelle passe)* | 39 056 | 0.21 | 1.01 | 0.01 | 1.042 | -0.0 | -0.7 | retenu | retenu |
|  |  | sombre q30 | 556 690 | 1.00 | 0.70 | 0.00 | 0.956 | -0.0 | -0.4 | rejeté : largeur | — |
|  |  | sombre q22 | 136 461 | 0.59 | 0.19 | 0.30 | 1.630 | -29.7 | -1.3 | rejeté : rondeur | — |
|  |  | sombre q22 | 134 528 | 0.66 | 0.19 | 0.29 | 1.455 | +29.0 | -3.2 | rejeté : rondeur, largeur | — |
| | | **→ `ancre` réparé** | | | | | | **-0.0** | **-0.7** | diam **22.1 %** | |
| `socle_def_o_mortier` | 0.4 | *tache q40 (nouvelle passe)* | 33 103 | 0.20 | 1.01 | 0.01 | 1.036 | -0.0 | -0.8 | retenu | retenu |
|  |  | sombre q30 | 623 410 | 0.99 | 0.80 | 0.00 | 0.916 | -0.0 | -0.3 | rejeté : largeur | — |
|  |  | sombre q22 | 621 606 | 0.99 | 0.80 | 0.00 | 0.918 | -0.0 | -0.3 | rejeté : largeur | — |
|  |  | sombre q15 | 9 858 | 0.61 | 0.03 | 0.34 | 0.502 | +0.1 | +34.5 | rejeté : rondeur | — |
| | | **→ `ancre` réparé** | | | | | | **-0.0** | **-0.8** | diam **20.4 %** | |
| `socle_def_j_casemate` | 0.22 | sombre q22 | 45 666 | 0.27 | 0.84 | 0.01 | 0.962 | -0.1 | -1.2 | retenu | retenu |
|  |  | sombre q30 | 461 424 | 0.88 | 0.78 | 0.00 | 0.978 | -0.1 | +0.0 | rejeté : largeur | — |
|  |  | sombre q22 | 236 994 | 0.88 | 0.40 | 0.10 | 0.773 | -0.2 | +10.2 | rejeté : rondeur, largeur | — |
| | | **→ `ancre` réparé** | | | | | | **-0.1** | **-1.2** | diam **26.8 %** | |
| `socle_def_j_creneau` | 0.22 | sombre q22 | 45 555 | 0.27 | 0.84 | 0.01 | 0.962 | -0.1 | -1.2 | retenu | retenu |
|  |  | sombre q30 | 618 445 | 1.00 | 0.82 | 0.07 | 0.917 | +0.0 | -7.3 | rejeté : largeur | — |
| | | **→ `ancre` réparé** | | | | | | **-0.1** | **-1.2** | diam **26.8 %** | |
| `socle_def_j_batterie` | 0.22 | sombre q22 | 45 666 | 0.27 | 0.84 | 0.01 | 0.962 | -0.1 | -1.2 | retenu | retenu |
|  |  | sombre q30 | 470 176 | 0.88 | 0.80 | 0.00 | 0.978 | -0.1 | +0.4 | rejeté : largeur | — |
| | | **→ `ancre` réparé** | | | | | | **-0.1** | **-1.2** | diam **26.8 %** | |

Sur les trois marcheurs, **aucun candidat n'est retenu par le code de `HEAD`**,
et la contrainte qui rejette est la **largeur**, pas le décalage (le brief avait
raison de dire de ne pas le supposer ; il avait aussi raison de le soupçonner) :
à q30 la tache remplie fait 97 à 100 % de la largeur. Le pourquoi est dans le
pixel : l'intérieur de leur disque vaut 176 à 186 en somme RVB et son liseré 157 à
167, tandis que les pattes et leurs ombres tirent les percentiles vers le noir —
q22 tombe à 118, 144, 124 ; q30 à 175, 174, 172. Le disque n'est donc jamais sous
la coupe avant que le réseau de contours ne se referme sur tout le corps. Sur les
socles carrés c'est le liseré du disque, à 102–113 (sous q10 = 108–117), que
`fill_holes` remplit ; les marcheurs n'ont pas ce liseré-là.

Sur le créneau, le faux positif est **le logement PLUS le module inférieur du
socle**, enfermés par le contour de la bride sud : boîte 555 × 763, centroïde à
+7,3 %. Il n'inclut pas l'anneau rouge (vérifié pixel par pixel) ; il passe les
trois contraintes de justesse (0,58 > 0,55 ; 0,60 < 0,62) et gagne par la taille
sur le vrai logement trouvé à q10.

---

## 2. Les douze `socle_def_*`, avant / après

| clé | avant : côté · dx · dy · diam · x · y | après : côté · dx · dy · diam · x · y | logement |
|---|---|---|---|
| socle_def_j_batterie | 93.82 · −0.09 · −15.74 · 44.9 · −0.1 · −17.6 | 130.20 · −0.0 · **−1.06** · 26.9 · −0.0 · −1.2 | zénithal |
| socle_def_j_casemate | 93.36 · −0.09 · −15.74 · 44.9 · −0.1 · −17.6 | 107.19 · −0.0 · **−1.06** · 26.9 · −0.0 · −1.2 | zénithal |
| socle_def_j_creneau | 93.62 · −0.09 · −15.74 · 44.9 · −0.1 · −17.6 | 95.84 · −0.0 · **−1.06** · 26.9 · −0.0 · −1.2 | zénithal |
| socle_def_j_faucheuse | 111.95 · −0.0 · −9.37 · 35.4 · −0.0 · −11.1 | **146.89** · −0.0 · −9.37 · 35.4 · −0.0 · −11.1 | **75°, non re-mesuré** |
| socle_def_j_harpon | 96.53 · −0.07 · −9.96 · 35.3 · −0.1 · −11.8 | **180.01** · −0.07 · −9.96 · 35.3 · −0.1 · −11.8 | **75°, non re-mesuré** |
| socle_def_j_mortier | 104.96 · −0.0 · −9.2 · 31.2 · −0.0 · −10.9 | **159.17** · −0.0 · −9.2 · 31.2 · −0.0 · −10.9 | **75°, non re-mesuré** |
| socle_def_o_batterie | 93.83 · 0.09 · −23.56 · 32.9 · 0.1 · −26.0 | 130.18 · 0.0 · **−0.18** · 55.1 · 0.0 · −0.2 | zénithal |
| socle_def_o_casemate | 93.35 · 0.08 · −23.56 · 31.4 · 0.1 · −26.0 | 107.19 · −0.0 · **−0.36** · 55.0 · −0.0 · −0.4 | zénithal |
| socle_def_o_creneau | 93.61 · 0.09 · −22.75 · 32.8 · 0.1 · −25.1 | 95.82 · −0.0 · **−0.27** · 55.0 · −0.0 · −0.3 | zénithal |
| socle_def_o_faucheuse | 111.95 · 0.17 · −27.97 · 20.5 · 0.2 · −35.3 | 146.88 · −0.0 · **−0.47** · 24.2 · −0.0 · −0.6 | zénithal |
| socle_def_o_harpon | 96.52 · 0.17 · −27.89 · 20.4 · 0.2 · −35.2 | 179.99 · −0.0 · **−0.56** · 22.1 · −0.0 · −0.7 | zénithal |
| socle_def_o_mortier | 104.94 · 0.17 · −27.52 · 20.5 · 0.2 · −34.7 | 159.18 · −0.0 · **−0.62** · 20.4 · −0.0 · −0.8 | zénithal |

Sur les trois socles 75° survivants, **les cinq champs de logement sont
identiques au bit** ; seul `cote_case_pct` bouge, parce qu'il dérive de la
TOURELLE (`cote_pct_embase` de `def_j_faucheuse` 209,2 → 274,5, `mortier` 200,0 →
303,3, `harpon` 163,5 → 304,9), qui est redessinée. Ce n'est pas un défaut du
détecteur : c'est la formule, `côté = lc × diam × cote_pct_embase × echelle`.

Tourelles (douze, toutes redessinées) — `cote_pct_embase` avant → après, et
`echelle` :

| tourelle | embase D (px) | carré (px) | cote_pct_embase avant → après | echelle avant → après |
|---|---|---|---|---|
| def_j_casemate | 441 | 1 212 | 143.4 → 274.8 | 1.6 |
| def_j_creneau | 582 | 1 430 | 143.8 → 245.7 | 1.6 |
| def_j_batterie | 411 | 1 372 | 144.1 → 333.8 | 1.6 |
| def_j_faucheuse | 545 | 1 496 | 209.2 → 274.5 | 2.4 |
| def_j_mortier | 540 | 1 638 | 200.0 → 303.3 | 2.4 |
| def_j_harpon | 452 | 1 378 | 163.5 → 304.9 | 2.4 |
| def_o_casemate | 606 | 894 | 153.9 → 147.5 | 2.37 → 1.458 |
| def_o_creneau | 594 | 1 150 | 200.4 → 193.6 | 1.604 → 0.992 |
| def_o_batterie | 572 | 1 176 | 171.6 → 205.6 | 1.874 → 1.267 |
| def_o_faucheuse | 427 | 1 390 | 220.6 → 325.5 | 2.934 → 2.210 |
| def_o_mortier | 449 | 1 270 | 200.7 → 282.9 | 3.023 → 3.268 |
| def_o_harpon | 390 | 1 054 | 199.2 → 270.3 | 2.815 → 3.571 |

Blindés : une seule coque bouge, `off_j_pilon_chassis` (la coque de l'Obusier,
remplacée) — 22,5 % / −0,2 / −12,4 → **23,2 % / −0,1 / −9,8**, côté 48,01 → 50,81 —
et, par l'échelle calée, `off_o_pilon_chassis.cote_case_pct` 48,0 → 50,83 et
`off_o_pilon_tourelle.echelle` 1,407 → 1,49. **Les dix-sept autres coques sortent
identiques au bit du détecteur réparé.** ⚠ Le brief ne nommait que trois JSON à
régénérer ; `ancres-blindes-ouvrage.json` bouge aussi, par `echelle_calee`, et il
a été régénéré et transcrit.

---

## 3. T1 et T2

### T1 — le 75° survivant ne bouge pas d'un bit

**Montage.** `git worktree` détaché à `2a19761` — donc les 30 pièces 75° du
dépôt, 12 socles et 18 coques, sur leurs sources d'origine —, dans lequel on copie
les deux outils réparés (`tools/chassis.py`, `tools/ancres-defense.py`). On y
rejoue `ancres-defense.py`, `ancres-blindes.py` et `ancres-ouvrage.py` avec
`FZ_SPRITES` dérouté sur un dossier temporaire, et l'on compare les quatre JSON
produits, octet par octet (CRLF de Windows retirés), aux quatre JSON commités à
`2a19761`. Le script du montage, tel qu'il a tourné (`/c/Python312/python
t1_montage.py <worktree> tambour|disque`) :

```python
"""T1 — les outils RÉPARÉS rejoués sur les sources 75° (worktree à HEAD), sortie
déroutée par FZ_SPRITES, comparés à l'octet aux JSON commités à HEAD.

Deux passes : (a) règle du tambour pour l'embase (BL.pivot, inchangée, celle des
blindés) ; (b) règle du disque inscrit (la nouvelle DEF.pivot), pour montrer ce
qui bouge et ce qui ne bouge pas.
"""
import importlib.util as u, io, json, os, sys, tempfile
WT = sys.argv[1]; MODE = sys.argv[2]
os.chdir(WT); sys.path.insert(0, os.path.join(WT, 'tools'))
out = tempfile.mkdtemp(prefix='fz-t1-'); os.environ['FZ_SPRITES'] = out
def module(nom):
    spec = u.spec_from_file_location(nom.replace('-', '_'), os.path.join(WT, 'tools', nom + '.py'))
    m = u.module_from_spec(spec); spec.loader.exec_module(m); return m
AD = module('ancres-defense'); AB = module('ancres-blindes'); AO = module('ancres-ouvrage')
if MODE == 'tambour':
    AD.pivot = AB.pivot; AO.DEF.pivot = AB.pivot
import contextlib
with contextlib.redirect_stdout(io.StringIO()):
    AD.main(); AB.main(); AO.main()
verdict = 0
for f in ('ancres-defense.json', 'ancres-blindes.json', 'ancres-defense-ouvrage.json', 'ancres-blindes-ouvrage.json'):
    a = io.open(os.path.join(WT, 'art', 'sprites', f), encoding='utf-8', newline='').read()
    b = io.open(os.path.join(out, f), encoding='utf-8', newline='').read().replace('\r\n', '\n')
    if a == b:
        print(f'{f:32s} IDENTIQUE à l\'octet ({len(a)} octets)')
    else:
        verdict = 1
        ja, jb = json.loads(a), json.loads(b); champs = []
        for sec in ja:
            for cle in ja[sec]:
                for ch in ja[sec][cle]:
                    if ja[sec][cle][ch] != jb[sec][cle].get(ch):
                        champs.append(f'{cle}.{ch} {ja[sec][cle][ch]} → {jb[sec][cle].get(ch)}')
        print(f'{f:32s} DIFFÈRE — {len(champs)} champ(s) :'); [print('    ' + c) for c in champs]
print('VERDICT', 'PASS' if verdict == 0 else 'ÉCART', f'(mode {MODE}, sortie {out})')
```

**(a) Règle du tambour pour l'embase** (`DEF.pivot = BL.pivot`, la règle 75°
inchangée, celle que les blindés emploient encore) :

```
ancres-defense.json              IDENTIQUE à l'octet (1832 octets)
ancres-blindes.json              IDENTIQUE à l'octet (2441 octets)
ancres-defense-ouvrage.json      IDENTIQUE à l'octet (1837 octets)
ancres-blindes-ouvrage.json      IDENTIQUE à l'octet (2456 octets)
VERDICT PASS (mode tambour)
```

**Verdict : PASS.** Les deux réparations de `ancre` — quatrième contrainte, passe
« tache » — et toute la chaîne en aval (boîte, `ancre_de_case`, échelles calées)
rendent les QUATRE fichiers identiques au bit sur les 30 pièces 75°. Ce n'est pas
seulement les trois socles du brief : c'est tout ce que le dépôt porte en 75°.

**(b) Règle du disque inscrit** (la nouvelle `DEF.pivot`, appliquée à des
tambours) — pour dire exactement ce qu'elle déplacerait et ce qu'elle ne déplace
pas :

```
ancres-defense.json              DIFFÈRE — 12 champ(s) : 6 × cote_case_pct, 6 × cote_pct_embase
ancres-blindes.json              IDENTIQUE à l'octet
ancres-defense-ouvrage.json      DIFFÈRE — 18 champ(s) : 6 × cote_case_pct, 6 × cote_pct_embase, 6 × echelle
ancres-blindes-ouvrage.json      IDENTIQUE à l'octet
```

Aucun champ de logement — `diametre_pct`, `x_pct`, `y_pct`, `dx_case_pct`,
`dy_case_pct` — ne bouge. Seuls bougent les champs qui DÉRIVENT de `pivot`.
C'est la décomposition attendue : `ancre` est invariant, `pivot` change de modèle.

⚠ **Pourquoi « 75° complet au bit » passe par la règle du tambour et non par un
discriminant dans `pivot`** : voir §4. La règle du tambour n'a plus de lecteur
dans `ancres-defense.py` — ses douze tourelles sont zénithales — mais elle vit,
inchangée au caractère, dans `ancres-blindes.py`, pour les dix tourelles de blindé
qui restent à 75°.

### T2 — le pivot mesuré est le centre du logement, sur les neuf socles neufs

**Montage.** `test/ancres-zenith.test.js`, dans `npm run check`. Pour chacun des
neuf socles redessinés, la source RVB de `art/sources/` est relue (le décodeur
`test/png-rgba.js` lit le type 2 depuis ce lot) et le trou du logement est
recalculé par une voie INDÉPENDANTE de `chassis.ancre` : demi-résolution, sujet =
distance au magenta ≥ 140, sombre = somme RVB < 200 (seuil absolu — l'intérieur du
trou vaut 129 à 186, les plaques 230 et plus), ouverture carrée de rayon 1 % W
(efface les traits), fermeture de rayon 2,5 % W (recolle les quatre quartiers du
disque du socle joueur, coupés par sa croix métallique), composantes 4-connexes,
la plus grande qui ne touche ni le fond ni le bord, centroïde. Ni percentile, ni
`fill_holes`, ni rondeur. Un appât vérifie que la mesure sait distinguer (les
valeurs 75° du 08/09 doivent tomber).

**Sortie brute, table du lot (prototype Python, même recette) :**

```
socle                           T2 x    T2 y  ancre x  ancre y   |dx|   |dy|  verdict
socle_def_j_batterie           -0.02   -1.90     -0.0     -1.2   0.02   0.70  ok
socle_def_j_casemate           -0.02   -1.90     -0.0     -1.2   0.02   0.70  ok
socle_def_j_creneau            -0.02   -1.90     -0.0     -1.2   0.02   0.70  ok
socle_def_o_batterie           -0.01   -0.26      0.0     -0.2   0.01   0.06  ok
socle_def_o_casemate           -0.04   -0.38     -0.0     -0.4   0.04   0.02  ok
socle_def_o_creneau            -0.02   -0.34     -0.0     -0.3   0.02   0.04  ok
socle_def_o_faucheuse          -0.03   -0.63     -0.0     -0.6   0.03   0.03  ok
socle_def_o_harpon             -0.05   -0.65     -0.0     -0.7   0.05   0.05  ok
socle_def_o_mortier            -0.01   -0.82     -0.0     -0.8   0.01   0.02  ok
```

**Sortie brute, table du 08/09 contre les mêmes dessins — le test AVANT le lot :**

```
socle_def_j_batterie           -0.02   -1.90     -0.1    -17.6   0.08  15.70  ÉCART
socle_def_j_casemate           -0.02   -1.90     -0.1    -17.6   0.08  15.70  ÉCART
socle_def_j_creneau            -0.02   -1.90     -0.1    -17.6   0.08  15.70  ÉCART
socle_def_o_batterie           -0.01   -0.26      0.1    -26.0   0.11  25.74  ÉCART
socle_def_o_casemate           -0.04   -0.38      0.1    -26.0   0.14  25.62  ÉCART
socle_def_o_creneau            -0.02   -0.34      0.1    -25.1   0.12  24.76  ÉCART
socle_def_o_faucheuse          -0.03   -0.63      0.2    -35.3   0.23  34.67  ÉCART
socle_def_o_harpon             -0.05   -0.65      0.2    -35.2   0.25  34.55  ÉCART
socle_def_o_mortier            -0.01   -0.82      0.2    -34.7   0.21  33.88  ÉCART
```

Et le test Node lui-même, joué avant la transcription (table encore à 75°) :
`not ok 1 — socle_def_o_batterie : la table pose le logement en (0.1, -26) %, le
dessin le porte en (-0.06, -0.36) % — écart 25.64 %`. Après transcription :
`ok 1` (1,8 s pour les neuf décodages), `ok 2`.

**Verdict : rouge avant (écarts de 15,7 à 34,7 % du côté), vert après (0,05 en x,
0,70 en y au pire).** Le 0,70 du joueur vient de la croix peinte sur son trou, que
la fermeture recolle sans la faire disparaître ; le détecteur, lui, remplit le
liseré.

⚠ La même recette, jouée sur les douze socles 75° du worktree contre leur table
d'avant, **ne trouve pas le logement** (écarts 4 à 44 %) : un trou vu de biais a
une paroi intérieure éclairée, il n'est pas une tache uniforme. T2 ne porte donc
que sur les neuf socles neufs, comme le brief le demande, et ce fait est écrit
dans le test.

### Réancrage — `sprite.test.js`, « le carré de tourelle déborde sur les socles »

Ce test est tombé, comme il le devait : il affirmait que les douze socles
débordent parce que leur logement est haut sur la pièce. Réancré sur la mesure :
dix socles sur douze débordent, le Créneau tient dans sa case des deux côtés
(48,98 · 48,18), le pire est le Harpon des deux côtés (99,97 · 90,56) au lieu de la
Faucheuse (65,34 · 83,94), et une assertion NEUVE mesure ce que `echelle_calee`
promet — joueur et Ouvrage à 0,1 près sur les trois socles de tourelle. Les
nombres d'avant sont écrits à côté de ceux d'après. Aucune assertion retirée.

---

## 4. Ce qui a été réparé, et pourquoi le 75° ne bouge pas

### 4.1 `chassis.py:ancre` — deux réparations, mesurées au bit sur 30 pièces

1. **Quatrième contrainte : `h ≤ 1,2 w`.** Un logement n'est jamais plus haut que
   large — rond vu de dessus (h = w), ellipse écrasée verticalement vu de biais
   (h < w). Mesuré sur les 30 pièces 75° du dépôt et sur **tous** leurs candidats
   retenus, pas seulement les gagnants : **h/w ≤ 1,076** (le disque du Pionnier
   v2, trouvé au dernier recours). Sur les logements zénithaux justes : 0,96 à
   1,03. Sur la fausse tache du créneau : **1,374**. Le seuil 1,2 est à 0,12 du
   pire 75° et à 0,17 de la fausse tache. Par construction, une contrainte qui ne
   rejette aucun candidat des 30 pièces 75° ne peut pas y changer le gagnant —
   et T1 (a) le vérifie plutôt que de le déduire.
2. **Second dernier recours : la tache sombre après ouverture.** Après le « trou
   du clair » (le recours du Pionnier), si rien n'a été trouvé : masque « somme <
   percentile q » pour q ∈ {30, 40, 50, 60}, ouverture morphologique par un disque
   de rayon 1 % de W — les traits (contours, ombres fines, 4 à 8 px) disparaissent,
   les taches restent —, PAS de `fill_holes` (c'est le remplissage qui recollait
   tout le corps), les mêmes quatre contraintes, la première coupe qui rend un
   candidat l'emporte. Les trois marcheurs y trouvent leur disque à q40 (rondeur
   0,99 à 1,01, décalage 0,01). Il ne court **que si les passes précédentes n'ont
   rien rendu**, ce qui n'arrive sur aucune des 30 pièces 75° — elles trouvent
   toutes plus haut, donc il ne s'y exécute jamais.

**Trois pistes mesurées et écartées**, écrites dans `chassis.py` pour qu'on ne
les repropose pas :
- exclure les pixels d'accent saturé de la coupe (« un accent est de la peinture,
  pas de l'ombre ») : **déplace trois coques de l'Ouvrage** (27/30 identiques) et
  ne répare pas le créneau — sa tache ne contient pas l'anneau rouge ;
- préférer le candidat le plus rond, ou refuser qu'une tache qui grossit perde de
  la rondeur : `off_j_belier_chassis` 75° a un candidat emboîté plus rond de
  **+0,148** que son gagnant, davantage que le créneau (+0,142) ;
- l'excentrement du centre de masse dans sa boîte : 0,024 au créneau, **0,037** au
  Pionnier.

### 4.2 `ancres-defense.py:pivot` — un changement de modèle, pas une retouche

La règle du tambour — « largeur maximale, première ligne de la bande » — est
vraie d'un cylindre vu de biais et fausse d'un disque vu de dessus : sur un
disque, la première ligne à 98 % de la largeur est à 0,1 D **au-dessus** du centre
(d'où les +3 à +12 % du brief sur cinq tourelles Ouvrage), et quand autre chose
est plus large que l'embase — la rangée de missiles du Harpon — D et le pivot
partent avec (858 pour 390, pivot 157 px trop haut).

**Nouvelle règle : l'embase est le plus grand disque inscrit dans la silhouette.**
Centre = centre du plateau du maximum de la transformée de distance (les pixels à
moins d'un centième du rayon du maximum ; `argmax` seul rend le premier pixel
d'un plateau, et sur l'embase ovale du mortier Ouvrage ce plateau court de y = 614
à 695 pour un anneau centré vers 655) ; diamètre = deux fois ce rayon. Vérifié
disque tracé sur les douze dessins (`rapports/planche-ancres-zenith-pivots.png`) :
les six de l'Ouvrage l'épousent, les six du joueur trouvent la plaque sous les
canons, les deux harpons ignorent leurs rampes.

**Le brief proposait de « faire découler D du logement trouvé par `ancre` » ; ce
n'est pas ce qui a été fait, et voici la mesure.** `ancre` sur les tourelles de
l'Ouvrage trouve le disque sombre AU CENTRE de leur embase — 60 % de l'embase,
pas l'embase ; sur celles du joueur il trouve la plaque à quatre rivets ou
l'optique, sans rapport de taille constant. Le disque inscrit, lui, donne
l'embase sur les douze.

**Une approximation assumée :** sur une embase polygonale ou à brides, le disque
inscrit est l'apothème, un peu sous la largeur du plateau (606 pour 627 sur
`def_o_casemate`, 3 %). Et sur une plaque plus large que haute
(`def_j_batterie`, 742 × 370), c'est la HAUTEUR qui borne le disque : D = 411,
d'où `cote_pct_embase` 333,8 et un carré de 130 % ; prendre la largeur de la
plaque aurait donné 185 et 72 %. C'est la définition retenue — le plus grand disque
qui tienne sous le corps dessiné —, elle est écrite là où elle se mesure, et
`echelle` reste le bouton d'Ethan.

**Pourquoi pas un discriminant automatique 75°/zénithal dans une seule
fonction.** Cinq ont été mesurés sur les 24 planches (12 anciennes, 12 neuves),
aucun ne sépare :

| discriminant | 75° (12) | zénithal (12) |
|---|---|---|
| asymétrie du mur (lignes ≥ 0,9 D sous / sur y*) | 2,2 – 8,7 | 1,9 – 4,8 |
| disque inscrit / largeur maximale | 0,80 – 0,94 | 0,45 – 0,97 |
| position du disque inscrit sous y*, en D | 0,11 – 0,40 | 0,07 – 0,26 |
| centre du disque inscrit vs milieu de la bande, en D | 0,00 – 0,16 | 0,00 – 0,18 |
| logement du socle centré ⇒ tourelle zénithale | sépare les socles… | …mais les trois paires MIXTES (socle 75° + tourelle zénithale) tombent du mauvais côté |

Donc **deux fonctions, une par géométrie, chacune avec ses lecteurs** :
`ancres-defense.pivot` = disque inscrit, pour les douze tourelles de défense
(toutes zénithales) ; `ancres-blindes.pivot` = tambour, inchangée, pour les dix
tourelles de blindé (toutes à 75°). Le 75° n'a pas de lecteur dans la première ;
il n'est pas perdu, et T1 (a) le rejoue.

### 4.3 `ancres-ouvrage.py` suit sans modification propre — vérifié

Il importe `ancre` de `chassis.py` et `DEF.pivot` de `ancres-defense.py` : les
six socles et six tourelles de l'Ouvrage sortent avec les valeurs réparées sans
qu'une ligne de son code ait changé (`git diff` : docstring seulement — le
paragraphe qui justifiait `decal_max = 0,40` par des logements à 25–35 % est
devenu faux, il dit maintenant que 0,40 ne mord plus et pourquoi il reste : T1
rejoue cet outil sur les sources 75° écartées, qui en ont besoin). `echelle_calee`
fait son travail : joueur et Ouvrage à 0,1 près (107,19 / 107,19 ; 95,84 / 95,82 ;
130,20 / 130,18 ; 146,89 / 146,88 ; 159,17 / 159,18 ; 180,01 / 179,99). ⚠ Le
Créneau de l'Ouvrage passe sous 1 (0,992) : son embase est plus petite que son
carré ne le demande, et c'est le calage qui le dit.

---

## 5. Ce qui n'a PAS été re-mesuré, et pourquoi

- **`socle_def_j_{faucheuse,mortier,harpon}`** — les socles d'artillerie du
  joueur n'ont pas été redessinés. Arbitrage d'Ethan du 19/09 : « si j'ai pas
  modifié, c'est qu'il n'y a pas besoin ». L'ancre décrit le socle ; le socle n'a
  pas bougé, l'ancre non plus : leurs cinq champs de logement sont **identiques
  au bit** (§2). Les relancer dans le détecteur réparé rendrait d'ailleurs les
  mêmes nombres — T1 (a) le prouve sur les 30 pièces 75°. Leur `cote_case_pct`
  seul a bougé, avec leur tourelle. **La table est donc MIXTE**, neuf zénithaux et
  trois 75°, et c'est écrit : en tête de `src/data/ancres-defense.js`, dans
  `CLAUDE.md` §0, et gardé par `AZ T2` qui tombera si l'un des trois se retrouve
  centré sans qu'un lot le dise.
- **Les huit autres coques de `ANCRES_BLINDES`** (`ratisseur`, `fendeur`,
  `broyeur`, `belier` × 2 poses) et les **neuf coques de l'Ouvrage** — non
  redessinées ; sorties identiques au bit du détecteur réparé (§2).
- **Les dix tourelles de blindé** (`off_{j,o}_*_tourelle`) — non redessinées,
  toujours à 75° ; `ancres-blindes.pivot` inchangé. Cinq tourelles de blindé
  joueur zénithales figurent dans la livraison du 19/09 et n'entrent pas : hors
  périmètre.

---

## 6. Vérificateur, écarts au brief, fichiers touchés

**`python tools/verifier.py`** — dû, le lot touche `art/` et `tools/`. Voir la
sortie en fin de rapport (§8) : les quatre JSON d'ancres se reproduisent à
l'octet ; les sprites 64/128 des 22 pièces redessinées sont « différents » —
**attendu et voulu** : les sources sont zénithales, les sprites cousus sont
encore les 75°, et le conditionnement est hors périmètre (brief §5) ; le reste
des « différents » est le bruit d'encodeur de cette machine (Pillow 12.3.0 contre
celui du dépôt), déjà documenté en §0 de `CLAUDE.md` au lot TERRITOIRE-ET-ÉCHELLE.

**État transitoire, à connaître avant de le découvrir en jouant :** les ancres
décrivent les dessins zénithaux, les atlas portent encore les sprites à 75°. En
jeu, la tourelle est posée au centre d'un socle dont le trou est encore en haut,
jusqu'au lot de conditionnement. C'est le découpage du brief, pas un oubli.

**Écarts au brief, déclarés :**
1. Pré-check 5 échoué → arrêt, question, arbitrage, puis entrée des 22 sources par
   ce lot (§0).
2. T1 « champ par champ » n'est atteignable qu'avec la règle du tambour pour
   l'embase, parce que `cote_case_pct` des trois socles survivants dérive de leur
   TOURELLE redessinée. Fait ainsi, et la règle du disque mesurée à côté (§3).
3. Quatre JSON régénérés et deux `.js` transcrits, pas trois :
   `ancres-blindes-ouvrage.json` bouge par `echelle_calee` (Obusier).
4. `pivot` ne découle pas du logement trouvé par `ancre` (piste du brief), mais du
   disque inscrit — mesuré, §4.2.
5. `test/png-rgba.js` généralisé au RVB (type 2), alpha 255 : nécessaire pour que
   T2 lise les sources. Aucun lecteur existant ne change.
6. Le docstring d'`ancres-ouvrage.py` est amendé (un paragraphe devenu faux) ;
   son code ne l'est pas.

**Fichiers touchés :** `tools/chassis.py`, `tools/ancres-defense.py`,
`tools/ancres-ouvrage.py` (docstring), `art/sprites/ancres-{defense,blindes}.json`,
`art/sprites/ancres-{defense,blindes}-ouvrage.json`, `src/data/ancres-defense.js`,
`src/data/ancres-blindes.js`, `test/ancres-zenith.test.js` (nouveau),
`test/png-rgba.js`, `test/sprite.test.js`, `art/sources/` (22 remplacées, 22
`_75_ECARTE` ajoutées), `art/sources-declarees.json`, `CLAUDE.md`,
`package.json`, `package-lock.json`, `rapports/RAPPORT-lotANCRES-ZENITH.md`,
`rapports/planche-ancres-zenith-pivots.png`.

**Tests :** 1 641 → 1 643 (+2, `AZ T1`, `AZ T2`). Aucune assertion retirée ni
assouplie ; un test réancré avec les nombres d'avant à côté de ceux d'après, une
assertion ajoutée (échelle calée mesurée). Falsification jouée : T2 rouge avant
la transcription (neuf écarts de 15,7 à 34,7 %), vert après ; T1 (b) montre que la
règle du disque appliquée aux tambours déplace exactement les champs dérivés de
`pivot` et aucun autre.

`SAVE_VERSION` ne bouge pas : rien n'entre dans l'état.

---

## 7. Ce qui reste ouvert

1. **Les douze tourelles zénithales ne sont PAS centrées sur leur pivot dans le
   fichier, et dix ont un carré de rotation plus grand que la planche.** Mesuré :
   embase de 21 px (`def_o_casemate`) à 225 px (`def_j_mortier`) SOUS le centre du
   fichier ; carré 1 430 à 1 638 pour des planches de 1 254 chez le joueur. Le
   mode `carre` de `joueur_v2.py` — « aucun recadrage, la planche EST le sprite »,
   vrai des planches à 75° — ne peut pas leur être appliqué tel quel : le lot de
   conditionnement devra RECENTRER sur le pivot que `pivot` rend et agrandir la
   toile au côté que `cote_du_carre` rend, sinon la tourelle décrira un cercle de
   20 à 225 px autour de son embase en tournant. Écrit dans `cote_du_carre`.
2. **`echelle` est à rejuger par Ethan sur les dessins zénithaux.** Choisie à
   l'œil à 40 px sur les tourelles à 75° (1,6 / 2,4), elle donne ici des carrés de
   96 à 180 % de la case : le Harpon joueur atteint 99,97 % de demi-case, la pointe
   de ses missiles touche le bord opposé de la case voisine ; à 64 px c'est 58 px
   du pivot. Ce n'est pas le détecteur : les dessins ont des canons deux à trois
   fois plus longs que leur embase (`cote_pct_embase` 246 à 334 contre 143 à 209).
   La Batterie joueur (130 %) tient en plus à la définition de l'embase sur une
   plaque large (§4.2).
3. **Le diamètre des trois socles carrés de l'Ouvrage est gonflé par leurs
   brides** : 55 % mesuré pour un trou visuel de ~45 % — la composante retenue
   emporte les contours des quatre brides, qui étirent sa boîte. Sans effet sur le
   rendu (le centre est juste, et pour l'Ouvrage `echelle_calee` absorbe le
   diamètre) ; à savoir si un jour le diamètre sert à autre chose.
4. **Sources Ouvrage sur magenta, pas sur vert** — le passage au vert reste le lot
   de code sur `cond.py` que le brief exclut. `est_fond_sujet` lit la clé sur les
   coins, donc rien n'a eu à changer.
5. **Les 23 autres fichiers livrés le 19/09** (ruines de défense × 8, barrières et
   merlon × 2 camps, coques et tourelles de blindé joueur zénithales × 10) attendent
   leurs lots : RUINES-DÉFENSE, et un lot blindés zénithaux qui devra alors traiter
   `ancres-blindes.pivot` comme celui-ci a traité `ancres-defense.pivot`.
6. **Deux fonctions `pivot` dans deux fichiers.** C'était déjà deux copies de la
   même règle avant ce lot ; ce sont maintenant deux règles. Le jour où les
   blindés passeront au zénithal, la règle du tambour n'aura plus de lecteur et
   pourra partir — avec T1 (a) qui la rejoue.
7. **L'écran de raid et le Chantier n'ont pas été vus** : le lot ne change que
   des tables et des outils ; ce qu'il change à l'écran ne se verra qu'au lot de
   conditionnement, et une capture aujourd'hui montrerait une tourelle centrée sur
   un socle encore à 75°.

---

## 8. Vérificateur de la chaîne d'art

`python tools/verifier.py --silencieux` (Pillow 12.3.0, numpy 2.5.3, scipy 1.18.1,
`opusenc` d'opus-tools 0.2 sur le PATH), **9 min 59** :

```
identiques à l'octet : 178
différents           : 932
nouveaux             : 0
MANQUANTS            : 0
  DIFFÈRE   ancres-blindes-ouvrage.json
  DIFFÈRE   ancres-blindes.json
  DIFFÈRE   ancres-defense-ouvrage.json
  DIFFÈRE   ancres-defense.json
  … (928 sprites)
  ATLAS    un atlas cousu ne correspond plus à ses sprites — relancer `python3 tools/atlas.py --ecrire`
VERDICT : la chaîne ne répond pas de ses sprites
```

**Ce verdict est celui de la machine, pas celui du lot, et il se décompose.** Le
lot TERRITOIRE-ET-ÉCHELLE l'a mesuré sur un arbre PRISTINE avec cette même
toolchain : 46 identiques · 798 différents à l'octet, **0 différence au pixel** —
c'est l'encodeur PNG de Pillow 12.3 contre celui du dépôt. Pour isoler ce que CE
lot change, les producteurs concernés (`joueur_v2`, `ouvrage_v2` et les trois
outils d'ancres) ont été rejoués sous `FZ_SPRITES` et comparés au **pixel**, les
JSON au caractère près après retrait des CRLF de Windows :

```
sprites produits par joueur_v2 + ouvrage_v2 : 168 — identiques au PIXEL : 124, différents au pixel : 44
  différent au pixel : chassis\128\off_j_pilon_chassis.png
  différent au pixel : chassis\64\off_j_pilon_chassis.png
  différent au pixel : defense\128\def_j_batterie.png
  différent au pixel : defense\128\def_j_casemate.png
  différent au pixel : defense\128\def_j_creneau.png
  différent au pixel : defense\128\def_j_faucheuse.png
  différent au pixel : defense\128\def_j_harpon.png
  différent au pixel : defense\128\def_j_mortier.png
  différent au pixel : defense\128\def_o_batterie.png
  différent au pixel : defense\128\def_o_casemate.png
  différent au pixel : defense\128\def_o_creneau.png
  différent au pixel : defense\128\def_o_faucheuse.png
  différent au pixel : defense\128\def_o_harpon.png
  différent au pixel : defense\128\def_o_mortier.png
  différent au pixel : defense\64\def_j_batterie.png
  différent au pixel : defense\64\def_j_casemate.png
  différent au pixel : defense\64\def_j_creneau.png
  différent au pixel : defense\64\def_j_faucheuse.png
  différent au pixel : defense\64\def_j_harpon.png
  différent au pixel : defense\64\def_j_mortier.png
  différent au pixel : defense\64\def_o_batterie.png
  différent au pixel : defense\64\def_o_casemate.png
  différent au pixel : defense\64\def_o_creneau.png
  différent au pixel : defense\64\def_o_faucheuse.png
  différent au pixel : defense\64\def_o_harpon.png
  différent au pixel : defense\64\def_o_mortier.png
  différent au pixel : socle\128\socle_def_j_batterie.png
  différent au pixel : socle\128\socle_def_j_casemate.png
  différent au pixel : socle\128\socle_def_j_creneau.png
  différent au pixel : socle\128\socle_def_o_batterie.png
  différent au pixel : socle\128\socle_def_o_casemate.png
  différent au pixel : socle\128\socle_def_o_creneau.png
  différent au pixel : socle\128\socle_def_o_faucheuse.png
  différent au pixel : socle\128\socle_def_o_harpon.png
  différent au pixel : socle\128\socle_def_o_mortier.png
  différent au pixel : socle\64\socle_def_j_batterie.png
  différent au pixel : socle\64\socle_def_j_casemate.png
  différent au pixel : socle\64\socle_def_j_creneau.png
  différent au pixel : socle\64\socle_def_o_batterie.png
  différent au pixel : socle\64\socle_def_o_casemate.png
  différent au pixel : socle\64\socle_def_o_creneau.png
  différent au pixel : socle\64\socle_def_o_faucheuse.png
  différent au pixel : socle\64\socle_def_o_harpon.png
  différent au pixel : socle\64\socle_def_o_mortier.png
  ancres-blindes-ouvrage.json              IDENTIQUE une fois les 107 CRLF retirés
  ancres-blindes.json                      IDENTIQUE une fois les 107 CRLF retirés
  ancres-defense-ouvrage.json              IDENTIQUE une fois les 84 CRLF retirés
  ancres-defense.json                      IDENTIQUE une fois les 84 CRLF retirés
```

Donc : **exactement 44 sprites diffèrent au pixel — les 22 pièces redessinées,
aux deux grilles —, les 124 autres sont identiques au pixel, et les quatre JSON
d'ancres se reproduisent au caractère près** (le CRLF est le défaut connu des
outils sous Windows, documenté dans `entrees.py` : « trois outils sur treize sont
corrigés, les dix autres restent, et c'est un lot à part »). Les 44 sont l'état
transitoire assumé du §6 : sources zénithales, sprites 75° au dépôt, jusqu'au lot
de conditionnement. La ligne `ATLAS` en découle. ⚠ **Aucun sprite n'a été
régénéré ni commité** pour faire taire l'outil.

`python tools/entrees.py --verifier` (chaîne rejouée sous le mouchard, 4 min) :

```
art/sources/            676 fichiers
  consommées (trace)    501   déclarées 501
  dormantes (déduites)  175   déclarées 175
art/sourcesstandby/      34 fichiers, 0 lu(s) par la chaîne
art/reserve/             10 fichiers, 0 lu(s) par la chaîne

VERDICT : la chaîne lit exactement les sources déclarées
```
