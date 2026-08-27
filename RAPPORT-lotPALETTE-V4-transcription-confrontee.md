# RAPPORT — lot PALETTE-V4 : une transcription qui ne se confronte pas vieillit

> Trouvé en relisant `main` après la session sprites du 27/08. Ce lot ne
> corrige pas une faute de cette session-là : il rattrape une garde qui aurait
> dû suivre et qui n'avait aucun moyen de le dire.

---

## 1. Version et build produits

| | Avant | Après |
|---|---|---|
| `version` · `config.build` | 0.12.0 · 12 | **0.12.0 · 12** — pas de bump |
| `dist/index.html` | 81 236 o, `f6b082b4…5ad430` | **identique** |
| `npm test` | 256 pass / 0 fail | **257 pass / 0 fail** |

---

## 2. Ce qui a été trouvé

`FICHE-STYLE.md` est passé en **v4** le 27/08 : trois rampes complètes s'y sont
ajoutées — le sol du joueur, l'ardoise de l'Ouvrage, les accents de terrain.
La fiche porte désormais **28 teintes**.

La garde de `banc.test.js` (« aucune teinte hors de la palette de
`FICHE-STYLE.md` ») en transcrivait **14**. Son commentaire disait « transcrite
ici indépendamment » ; elle ne l'était plus.

### Ce qui rend le cas intéressant : elle serait restée verte

La garde ne balaie que `src/render/`, `src/ui/` et `src/index.src.html`. Aucun
de ces fichiers n'emploie encore les nouvelles teintes — le sol du joueur et
l'ardoise vivent dans `art/`, pas dans le code. **La suite était donc verte, et
elle le serait restée indéfiniment**, tout en s'apprêtant à refuser quatorze
couleurs parfaitement légitimes au premier écran qui s'en servirait.

Une garde périmée ne se signale pas toute seule. Celle-ci n'avait aucun moyen de
savoir que sa source avait bougé.

---

## 3. Le correctif

**La liste reste écrite**, portée à 28 dans `test/banc.test.js` et dans
`tools/audit-maquette.mjs`. Elle n'est pas remplacée par une lecture du
document, et c'est délibéré :

- écrite, un ajout de teinte se **voit en relecture** ;
- écrite, une faute de frappe dans la fiche n'autorise pas une couleur en
  silence.

**Et un test l'asserte contre le document, dans les deux sens.** C'est ce qui
manquait : la transcription se confronte désormais à sa source à chaque
exécution. Le jour où la fiche passera en v5, le test nommera l'écart au lieu de
laisser la garde vieillir une deuxième fois.

Montage falsifiable avant la mesure : les deux listes doivent compter au moins
vingt teintes et ne pas porter de doublon, sinon l'égalité serait triviale.

⚠ **Ce n'est PAS un assouplissement.** `CLAUDE.md` §5 l'autorise explicitement —
« recalculer un seuil parce qu'une constante a bougé : oui ; baisser une borne
pour faire passer un lot : jamais ». Aucun lot n'attendait ces teintes ; la
borne a été recalculée parce que la fiche, qui fait autorité sur le style, avait
changé.

---

## 4. Falsification — cinq défauts injectés, cinq attrapés

| # | Défaut injecté | Résultat |
|---|---|---|
| P1 | une teinte retirée de la transcription | **rouge** |
| P2 | une teinte inventée ajoutée à la transcription | **rouge** |
| P3 | la fiche gagne une teinte, la garde ne suit pas | **rouge** |
| P4 | la garde revient à quatorze teintes (l'état d'avant ce lot) | **rouge** |
| P5 | une couleur hors fiche dans `index.src.html` | **rouge** |

P3 et P4 sont les deux sens du défaut réel : la source qui avance, et la
transcription qui recule. Aucun des deux n'était détectable avant ce lot.

---

## 5. Deux points relevés sur `main`, qui ne sont pas dans ce lot

**`LISEZ-MOI-DEPOT.md` a été commité à la racine.** C'est une notice de dépôt,
pas un fichier du projet : elle voyageait dans mes archives à côté des fichiers
à téléverser, et elle a suivi. **C'est mon défaut d'emballage** — une notice ne
doit pas être sélectionnable en même temps que les fichiers qu'elle décrit. À
supprimer, et mes prochaines archives la nommeront de façon à ce qu'elle ne
puisse pas être confondue avec un livrable.

**`PASSATION-2026-08-27.md` annonce « la suite reste à 240 tests ».** Le chiffre
était juste au début de la session graphique et ne l'est plus : `main` en porte
257. Le document est de rang 3 et se lit au premier geste de chaque session ;
c'est exactement le genre de chiffre qui fait démarrer un lot sur une base
fausse. Non corrigé ici — c'est la passation d'une autre session, et son auteur
décide.

---

## 6. Ce qui reste devant

- **La maquette a été dessinée sous la contrainte à quatorze teintes.** Elle
  tient, mais elle ne connaît pas les couleurs de terrain que la fiche porte
  maintenant : `#9FB3C5` · `#C1CEDA` pour le quartz, `#382E47` pour la scorie.
  À reprendre — c'est une décision de style, et la fiche fait autorité.
- **La couche d'action** (poser, améliorer, démonter) attend toujours
  l'arbitrage sur la part de scorie d'un coût de construction.
- **L'écran en lecture** n'a plus aucun blocage devant lui.
