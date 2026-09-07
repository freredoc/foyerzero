# RAPPORT — lot ORPHELIN : retrait de `sim/economy.js`

> Lot annoncé par `PASSATION-2026-08-26-soir.md` §3.1. Aucun arbitrage :
> purement mécanique. Exécuté le **27/08/2026**.

---

## 1. Version et build produits

**Aucun bump. `dist/index.html` n'a pas bougé d'un octet.**

| | Avant | Après |
|---|---|---|
| `version` · `config.build` | 0.12.0 · 12 | **0.12.0 · 12** — inchangés |
| `dist/index.html` | 81 236 o | **81 236 o** |
| SHA-256 | `f6b082b4fa9c62362b016c1840189846b8893b92e84515796e11e909cf5ad430` | **identique** |

Mesuré par `sha256sum` après `npm run build`, pas déduit. C'est la règle de
`CLAUDE.md` §5 : bumper pousserait une mise à jour aux appareils pour un
changement qui ne les concerne pas. Dixième reconduction consécutive.

⚠ Le module retiré n'était **pas** dans le bundle : `index.src.html` n'importe
que `ui/banc.js`, dont le graphe ne passait ni par `sim/economy.js` ni par
`data/params.js`. Le retrait ne pouvait donc pas faire bouger le HTML, et le
SHA identique le confirme au lieu de l'espérer.

---

## 2. Suite de tests

| | |
|---|---|
| Avant (relevé sur `main` frais) | **247 pass / 0 fail**, 17,6 s |
| Après | **240 pass / 0 fail**, 18,1 s |
| Delta | **−7**, exactement le nombre de `test(` en tête de ligne de `test/economy.test.js` |

**Le delta a été vérifié dans les deux sens** : 240 déclarations comptées sur le
disque, 240 exécutées par `node --test`. C'est le contrôle de `PASSATION-2026-08-26-soir.md`
§4.4 — un fichier de test qui ne se charge pas fait disparaître ses tests en
silence, et seul l'écart entre déclarés et exécutés le dit.

---

## 3. Ce qui a été retiré

| Fichier | Lignes | Octets |
|---|---|---|
| `src/sim/economy.js` | 306 | 12 574 |
| `src/data/params.js` | 66 | 2 888 |
| `test/economy.test.js` | 210 | 9 477 |
| **Total** | **582** | **24 939** |

### ⚠ La liste des champs morts était incomplète, et c'est la seule surprise du lot

`PASSATION-2026-08-26-soir.md` §3.1 annonçait quatre champs de `PARAMS` devenus
morts : `batiments`, `stockage`, `courbes`, `adjacence`.

**Mesuré au retrait : les huit champs l'étaient, plus l'export `RHO`.**
`facteurTempsRetour`, `rho`, `plancherAmorcageNiveaux` et `fluxContinu` ne
servaient pas davantage. Recensement fait sur les `import` réels, pas sur les
mentions du nom :

```
importeurs de src/data/params.js  → test/economy.test.js, et lui seul
importeurs de src/sim/economy.js  → test/economy.test.js, et lui seul
```

Les quatre autres occurrences du mot « economy » dans `src/` étaient des
commentaires — le piège que la passation signalait elle-même.

**Conséquence : `data/params.js` a été retiré en entier**, pas amputé de quatre
champs. Un fichier de `src/data/` qu'aucun code n'importe contredit de face ce
que `CLAUDE.md` §1 dit de ce dossier (« seule source lue par le code ») ; le
laisser à moitié vide aurait coûté une relecture à la session suivante.

Ce que `params.js` portait est remplacé, et ailleurs :

| Grandeur du lot 1 | Où elle vit aujourd'hui |
|---|---|
| courbe de coût / production | `data/economie.js` (`ECONOMIE_NIVEAU`) |
| débits des bâtiments | `data/base.js` (`DEBITS`, `debitParHeure`) |
| adjacence | `data/base.js` (`VOISINAGE`) + `sim/disposition.js` |
| capacité de stockage | `data/base.js` (`capaciteDuNiveau`, par bâtiment ET par ressource) |

---

## 4. Ce qui a été corrigé autour

Le retrait laissait onze références vers deux fichiers absents. **Aucune n'a été
supprimée** : elles racontent des décisions et de l'histoire, et `CLAUDE.md` §6
rappelle qu'une garde morte se documente au lieu de se nettoyer. Elles ont été
mises au passé et **datées**, pour qu'aucune ne se lise comme un renvoi vivant.

| Fichier | Ce qui a été corrigé |
|---|---|
| `src/sim/economie-base.js` | l'en-tête annonçait encore « CE MODULE NE REMPLACE PAS `sim/economy.js` […] il est encore branché à `sim/state.js` » — **faux depuis la bascule**, signalé par la passation ; plus deux renvois au passé (seuil d'exactitude, arguments du rattrapage) |
| `src/data/base.js` | trois blocs : l'arrondi « par economy.js », le bloc colis qui annonçait deux conséquences « à solder » alors qu'elles le sont, et le bloc du débit horaire |
| `src/data/combat.js` | « Convention héritée de params.js » — la convention tient, le fichier non ; elle renvoie maintenant à `CLAUDE.md` §4 |
| `src/sim/state.js` | commentaire de la migration v1 → v2 |
| `src/sim/disposition.js` | le plafond d'adjacence du lot 1 |
| `test/disposition.test.js` | idem, côté test |
| `CLAUDE.md` | §0, §2, §6 — voir ci-dessous |

### `CLAUDE.md` — six passages de §6 étaient périmés, deux avant ce lot

Deux ne dépendaient pas du retrait et sont corrigés au passage :

- **« la capacité par bâtiment […] n'est lue par personne, comme `base.js` tout
  entier »** — faux : `champs.js`, `disposition.js` et `economie-base.js`
  l'importent tous les trois. Un fait d'orphelinage se remesure ; celui-là avait
  été reconduit.
- **La règle de livraison** citait `economy.js` / `economy.test.js` comme
  exemple de noms courts confondus dans le sélecteur du téléphone. Les deux
  fichiers disparaissant, l'exemple a été remplacé par celui qui a réellement
  causé l'accident : `disposition.js` / `disposition.test.js`.

§0 passe à 240 tests et §2 à `src/data/` 5 · `src/sim/` 10 · `test/` 21, la
liste nominale des tests perdant `economy`.

---

## 5. Falsification — cinq défauts injectés, cinq attrapés

| # | Défaut injecté | Résultat |
|---|---|---|
| F1 | §0 de `CLAUDE.md` annonce 241 au lieu de 240 | **rouge** — `documentation.test.js` 3 pass / 1 fail |
| F2 | §2 annonce 11 fichiers dans `src/sim/` | **rouge** — 3 pass / 1 fail |
| F3 | `economy` laissé dans la liste nominale de §2 | **rouge** — 3 pass / 1 fail |
| F4 | `import { PARAMS } from '../data/params.js'` réintroduit dans `sim/disposition.js` | **rouge** — `disposition.test.js` 0 pass / 1 fail (erreur de liaison) |
| F5 | un `faux.test.js` déposé dans `src/sim/` | **rouge** — 2 pass / 2 fail |

⚠ **F4 est passé au BUILD.** `npm run build` a produit un HTML valide de 81 236
octets avec un import vers un fichier absent, parce que `sim/disposition.js`
n'est pas dans le graphe d'`index.src.html`. **Le build ne garde que ce qui est
branché à l'écran ; aujourd'hui c'est presque rien.** Seule la suite de tests a
vu la faute. Tant que le moteur n'est pas branché, `npm run build` vert ne dit
rien de la santé de `src/sim/`.

---

## 6. Écarts par rapport à ce qui était annoncé

Un seul, assumé et mesuré : **`src/data/params.js` a été supprimé**, là où la
passation ne demandait que le nettoyage de quatre de ses champs. La raison est
au §3 : les huit étaient morts. Si Ethan préfère le conserver, c'est un seul
fichier à restaurer depuis l'historique — mais il faudra alors remettre §2 de
`CLAUDE.md` à 6 fichiers, sans quoi la suite passe au rouge.

---

## 7. Points laissés en suspens

- **Brancher un écran** (`PASSATION-2026-08-26-soir.md` §3.2) reste le premier
  lot qui produira quelque chose de regardable, et le premier qui justifiera un
  bump. Le §5 ci-dessus lui ajoute un argument : tant que le bundle ne contient
  que le banc, le build ne protège presque rien.
- Les deux arbitrages ouverts (redéploiement et champs ; valeurs de l'onglet
  TROUS) ne sont pas touchés par ce lot.
