# Passation — 31/08/2026, après le lot MODULES-F

**Livré : `0.56.0` · build `57`.** 731 pass / 0 fail (+13) · `dist/index.html`
1 264 511 octets (**+933**, enveloppe annoncée 2 500) · marge 35 489 o, 2,73 % ·
`SAVE_VERSION` **14**, inchangé · audit maquette **toujours rouge à 7 écarts**,
sortie identique à l'octet (`diff` vide). Branche `claude/lot-modules-f`,
PR ouverte, **non mergée**.

Le rapport complet est dans `RAPPORT-lotMODULES-F.md`. Ceci en est le condensé.

---

## Ce que le lot a fait

Les deux derniers modules **sans effet** hors Garnison sont écrits, et le canal
de l'Ouvrage — qui n'avait jamais servi — est armé.

- **Munition spéciale** : `+120 %` sur le tir, **uniquement** quand la colonne
  lue pour la cible est la `colonnePredilection` du tireur. Écrite dans
  **`degatsContre`**, qui prend désormais `etat` en premier argument.
- **Vol de vie** : le tireur récupère `floor(encaissé × 20 / 100)`.
  `appliquerDegats` fait maintenant **deux passes**.
- **Le canal** : `genererSite` remplit `modulesDebloques.ouvrage.defense` depuis
  `apparitionModule`. `offense` reste vide.
- Les deux drapeaux `cable` passent à `{ offense: false, defense: true }` :
  l'effet EXISTE, la ligne n'est pas achetable. **Zéro ligne nouvelle à
  l'écran**, mesuré des deux côtés et vérifié dans Chromium.

**Il ne reste qu'un module sans effet dans tout le catalogue : la Garnison.**

## Les cinq choses à savoir avant de toucher à ça

1. **⚠⚠ Le tampon de `tir` n'est plus un total, c'est une LISTE de coups.**
   Il est passé de `Map<cibleIndice, degats>` à
   `Map<cibleIndice, Array<{tireur, degats}>>`. Trois sites l'alimentent : le
   tir direct, le Tir de barrage, et **le franchissement — où le tireur est la
   BARRIÈRE, pas l'unité qui franchit**. Quiconque ajoute une source de dégâts
   doit fournir un indice de tireur, sinon le Vol de vie ne le verra pas.
2. **⚠ Le vol porte sur l'ENCAISSÉ, jamais sur le nominal.** L'encaissé =
   part absorbée par un Bouclier **plus** PV réellement retirés. Sur une cible
   qui tombe à zéro, le surplus au-delà de ses PV restants n'est volé par
   personne. La répartition entre plusieurs tireurs se fait **par indice
   croissant**, chacun jusqu'à son nominal — pas au prorata.
3. **⚠ Les soins sont posés dans une SECONDE passe**, une fois la passe 1
   entièrement terminée, pour que l'ordre des cibles ne puisse pas changer le
   résultat. Aujourd'hui c'est invérifiable — tout voleur est en garnison, donc
   d'indice inférieur à ses victimes — mais ça cessera de l'être le jour où un
   ATTAQUANT portera le Vol de vie.
4. **⚠ Le bonus de points de MODULES-E n'est pas un bonus de site.**
   `pointsRecherche` le donne **défense par défense**, et seulement à celles qui
   sont **endommagées dans ce raid** et dont le module figure dans le canal.
   Une garnison intacte ne rapporte rien, avec ou sans module — c'est pourquoi
   les niveaux 28 et 30 rendent des points **identiques au point** alors que
   leur canal n'est pas vide.
5. **⚠ Le Camouflage côté Ouvrage ne fait RIEN, et c'est mesuré, pas espéré.**
   `ensembleCamoufles` s'ouvre sur `if (e.camp !== 'attaque') continue;` : une
   Carapace en garnison n'est jamais examinée. Le symétriser serait un
   changement de règle, pas un câblage — **le brief l'interdit explicitement
   dans ce lot**.

## Les points de recherche ont bougé, et pas dans un seul sens

Mesuré sur neuf niveaux × trois graines, armée constante. Identique au point
jusqu'au niveau **30** ; premier mouvement à **32**, déjà mixte ; hausse franche
à **34** et **38** (3/3) ; mixte à 42 et 46 ; **baisse 3/3 à 50**.

Deux forces opposées : le bonus par défense endommagée pousse vers le haut, la
garnison plus résistante (PV +20 %, Vol de vie, Rayon minimum −1) casse moins,
donc `perduIci` baisse. **Aucun barème n'a été touché, rien n'est arbitré** —
le brief demandait de mesurer, publier, et s'arrêter là.

## Ce qui reste ouvert

- **La Garnison**, dernier module sans effet. Attend un arbitrage, pas un lot.
- **`ouvrage.offense` reste vide** : l'armer demanderait un module d'attaquant
  déclaré sur `p.module`, ce que `moduleOuvrage` ne fait pas.
- **La symétrie du Camouflage** — décision de règle.
- **L'équilibrage au-delà du niveau 42** — mesuré au §5 du rapport, non arbitré.

## Pièges de banc rencontrés (pour ne pas les repayer)

- **`genererSite` prend un OBJET destructuré** (`{ type, niveau, saveur, graine }`)
  et **`graine` doit être un entier** — une chaîne `'g-12'` jette.
- **`butin` et `pointsRecherche` prennent `(resultat, montage)`**, pas l'état.
- **`etat.attaque.points` est un `Number`**, pas un `BigInt` : y écrire `10n**18n`
  jette dans `payer` (« Cannot mix BigInt »).
- **Il n'existe aucun satellite de niveau ≥ 42 sur une carte neuve** quelle que
  soit la durée écoulée : `niveauDuSatellite` dérive de la RANGÉE. Placer la base
  en rangée 70 (niveau 46) est la géographie normale du jeu, pas un site forgé.
- **Un `modulesDebloques` plat AU SOMMET ne lève pas** (`['x'].ouvrage` vaut
  `undefined`, et MODULES-E autorise l'absence). La garde porte un cran plus bas,
  sur chaque propriétaire.
- **Trois listes de tests tombent quand un module devient câblé** — `MODULES-A T9`,
  `MODULES-B T13`, `MODULES-C T10`. C'est voulu : leur chute est le signal.
- **`documentation.test.js` asserte le compte de tests annoncé au §0 de
  `CLAUDE.md`, ligne 45.** À resynchroniser à chaque étape, sinon la suite rougit.
