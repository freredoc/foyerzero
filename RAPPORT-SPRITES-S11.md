# RAPPORT — lot SPRITES-S11 — 30/08/2026 au soir

Dépôt des sources d'interface livrées par Ethan
(`FoyerZero_S11_UI_complet_v1.zip`). **Ce lot ne fait que POSER des originaux
dans `art/sources/`** — aucune ligne de `src/`, aucun test, aucun outil.

| Grandeur | Valeur |
|---|---|
| Version | **0.49.0 · build 50 — INCHANGÉE**, et c'est voulu (§3) |
| `npm run check` | **634 pass / 0 fail** |
| `dist/index.html` | **1 242 496 octets — identique à l'OCTET**, SHA-256 compris |
| `python3 tools/verifier.py` | **VERT** — 1 370 identiques · 2 différents (déclarés) · 0 nouveau · 0 MANQUANT |
| `art/sources/` | 148 → **161** fichiers à la racine (424 en comptant `carte/`) |

---

## 1. Ce qui est entré

Treize fichiers, tous à la racine d'`art/sources/`, aucun écrasement — vérifié
fichier par fichier avant la copie, la commande s'arrêtant à la première
collision.

**Les neuf planches du lot 7** (`INVENTAIRE-SPRITES.md` §7), toutes en
1024 × 1024, RVB 8 bits, fond magenta comme le reste du dossier :

| Fichier | Contenu | Grille |
|---|---|---|
| `P11.1_ressources_3x1_1024.png` | quartz · scorie · électricité | 3 × 1 |
| `P11.2_points_strategiques_2x2_1024.png` | attaque · armée off. · armée déf. · recherche | 2 × 2 |
| `P11.3_cibles_chassis_3x2_1024.png` | cibles AI/AV/AA · châssis escouade/blindé/aéronef | 3 × 2 |
| `P11.4_categories_defense_2x2_1024.png` | mur · barrière · tourelle · artillerie | 2 × 2 |
| `P11.5_modules_1-8_4x2_1024.png` | modules 1 à 8 | 4 × 2 |
| `P11.6_modules_9-14_3x2_1024.png` | modules 9 à 14 | 3 × 2 |
| `P11.7_stats_actions_3x2_1024.png` | PV · dégâts · butin · réparation · temps · niveau | 3 × 2 |
| `P11.8_etats_interface_2x2_1024.png` | verrou · emplacement · vague · budget | 2 × 2 |
| `P11.9_fleches_plus_moins_3x2_1024.png` | flèches g/d · grande flèche verte · plus · moins | 3 × 2 |

**Les trois flèches vertes**, qui ne sont PAS au brief d'origine et répondent à
la demande d'Ethan — « des flèches vertes pour les bonus proximité comme
collecteur raffinerie » :

`ui_fleche_verte_1024x1024.png` · `ui_fleche_verte_x1_5_1024x1536.png` ·
`ui_fleche_verte_x2_1024x2048.png`

⚠ **LES TROIS RAPPORTS D'ASPECT SONT LE POINT.** Un bonus de proximité relie
deux cases voisines, mais la distance entre elles n'est pas toujours la même :
une flèche droite couvre une case, une diagonale en couvre √2. Les trois
longueurs — 1, 1,5 et 2 — sont ce qui permettra de tracer le trait sans étirer
un pixel art. C'est la seule lecture que j'ai faite du contenu ; elle n'est pas
arbitrée.

**Le manifeste**, renommé `S11_UI_CONTENU.txt` — le `CONTENU.txt` de l'archive
aurait été, à la racine d'un dossier de 161 fichiers, un titre qui ne dit pas de
quoi il parle.

---

## 2. ⚠⚠ CE QUI N'EST PAS ARRIVÉ : LES MURS

Ethan demande aussi « des murs pour faire le contour des bases », et les quatre
images sont bien dans le message — angles et segments, en deux matières (brique
ocre et pierre mauve), avec leurs variantes horizontale, verticale et les quatre
coins.

**Mais elles ne sont pas des FICHIERS.** Le seul téléversement de la session est
`FoyerZero_S11_UI_complet_v1.zip`, et il ne contient que les treize fichiers
ci-dessus. Vérifié :

```
ls /root/.claude/uploads/<session>/   → le zip, et lui seul
find / -name "*.png" -newermt "-6 hours"  → rien d'autre
```

Une image jointe à un message est visible, elle n'est pas déposée sur le disque :
je ne peux pas la recopier dans `art/sources/` sans la reconstituer, c'est-à-dire
sans en fabriquer une approximation à la place de l'original. **`art/sources/`
ne porte que des originaux** — c'est ce qui le distingue d'`art/sprites/`, qui
est entièrement reproductible — donc y déposer une reconstitution serait pire
que de ne rien déposer.

**Il suffit de les renvoyer dans une archive**, comme les planches S11, et je les
pose dans la même minute.

---

## 3. Pourquoi la version n'est PAS bumpée

`CLAUDE.md` §5 : on bumpe « **seulement quand `dist/index.html` change** ». Il
n'a pas changé — mesuré, pas supposé :

```
avant : 58437fa9038f9c02f44ea17e81a69976707f452c60ec2117a2e73215215613b9
après  : 58437fa9038f9c02f44ea17e81a69976707f452c60ec2117a2e73215215613b9
```

C'est attendu : `tools/build.js` n'inline que les images qu'un marqueur nomme, et
aucun marqueur ne pointe vers une planche de `art/sources/`. Bumper aurait poussé
une mise à jour à tous les appareils pour un fichier identique.

---

## 4. Le vérificateur — lancé, et il fallait le lancer

`CLAUDE.md` §0.5 impose `tools/verifier.py` dès qu'un lot touche `art/sources/`,
`art/sprites/` ou `tools/`. Celui-ci touche le premier.

**VERDICT : la chaîne répond de ses sprites**, code de sortie 0.

| | |
|---|---|
| identiques à l'octet | **1 370** |
| différents | **2** — `unite/32/off_j_belier.png` et `unite/32/off_j_ratisseur.png`, tous deux DÉCLARÉS |
| nouveaux | **0** |
| MANQUANTS | **0** |

C'est **exactement le verdict du lot FINITIONS**, ce qui est le résultat attendu :
aucun outil ne lit les planches P11 aujourd'hui.

⚠ **ET LE « 0 NOUVEAU » EST LA MESURE QUI COMPTE ICI.** `planches.py` lit
`art/sources/` ; si sa sélection avait été un balayage du dossier plutôt qu'une
liste, les douze planches déposées auraient produit des sprites que le dépôt n'a
pas, et le vérificateur les aurait comptés « nouveaux ». Il en compte zéro : la
chaîne les ignore, et déposer des sources est donc bien un geste inerte.

### ⚠⚠ IL NE TOURNE PAS SUR UN CONTENEUR NEUF SANS TROIS PAQUETS

Trouvé en le lançant : `tools/planches.py` importe `PIL`, `numpy` et `scipy`, et
aucun n'est installé dans l'environnement d'exécution. Le vérificateur sort alors
en **1** au premier outil, avec une trace Python — il ne ment pas, mais on peut
croire à une chaîne cassée alors qu'il manque une dépendance.

```
python3 -m pip install Pillow numpy scipy
```

C'est noté dans `CLAUDE.md` §3, parce que la prochaine session le redécouvrira
sinon — et parce que « deux minutes, mesurées » suppose qu'il démarre.

---

## 5. Ce qui reste à faire — la CHAÎNE, plus l'art

L'art est là ; **rien d'autre ne l'est**. Pour qu'une icône paraisse à l'écran il
faut, dans cet ordre :

1. **Un producteur** dans `tools/` — la douzième — qui découpe les neuf planches
   selon leurs grilles et conditionne en 128 · 64 · 32, comme les onze autres.
   Il devra demander sa destination au module de chemins (`FZ_SPRITES`), sans
   quoi le vérificateur ne pourra pas le rejouer.
2. **Les quarante et un noms**, qui sont déjà écrits dans
   `INVENTAIRE-SPRITES.md` §7 : c'est la liste qui fait foi, et le producteur
   doit la suivre plutôt qu'inventer des noms depuis les planches.
3. **La couture** : `python3 tools/atlas.py --ecrire`, qui régénère
   `src/data/atlas.js`. Une famille de plus dans l'index.
4. **Le marqueur** dans `tools/build.js` et la variable CSS — et là il faudra
   compter les octets : un atlas de 41 sprites en 64 pèsera de l'ordre de
   50 000 à 80 000 octets en base64, contre **57 504 de marge** sous la borne de
   T10. **C'est serré, et c'est le premier vrai arbitrage du lot suivant** : soit
   la borne monte en écrivant pourquoi, soit on ne coud que ce qui sert
   aujourd'hui — les 3 ressources et les 4 compteurs, qui tiennent largement.
5. **Le branchement**, écran par écran.

⚠ **LA FLÈCHE VERTE EST UN CAS À PART**, et probablement le plus rapide à
rendre. Le trait de voisinage existe déjà — calque SVG posé sur la grille,
`viewBox` en unités de case, depuis le lot RETOURS-ETHAN — et il est aujourd'hui
dessiné en primitives. Le remplacer par le sprite ne demande ni atlas ni index :
une image de plus, et le calque qui la pose. Mais son fond est magenta, pas
transparent : il faudra la conditionner comme les autres.

---

## 6. Fichiers touchés

| Fichier | Ce qui change |
|---|---|
| `art/sources/` | **+13 fichiers**, aucun retiré, aucun écrasé |
| `CLAUDE.md` | le compte d'`art/sources/` (87 annoncé → 161 mesuré) ; les trois paquets du vérificateur |
| `RAPPORT-SPRITES-ET-ZOOM.md` | amendé : son §2 disait « les fichiers n'existent pas », ce qui cesse d'être vrai |

⚠ **RIEN DANS `src/`, RIEN DANS `test/`.** C'est ce qui rend ce lot sûr à
commiter tel quel : il ne peut pas casser le jeu, et la suite le confirme à
634 tests.
