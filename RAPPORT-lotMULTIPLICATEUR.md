# RAPPORT — lot MULTIPLICATEUR — 29/08/2026

Écrit et vérifié par exécution sur un clone neuf de `freredoc/chantier`.

| Grandeur | Avant | Après |
|---|---|---|
| Version | 0.37.0 · build 38 | **0.38.0 · build 39** |
| `npm run check` | 523 pass / 0 fail | **524 pass / 0 fail** |
| `dist/index.html` | 528 895 octets | **528 947 octets** (+52) |
| `SAVE_VERSION` | 11 | **11, inchangé** |

---

## 1. Ce que le lot fait

`TYPES_SITE.avantPoste.multiplicateurButin: 3.25` portait ce nombre depuis le
relevé TA et **n'était lu par personne**. Il l'est maintenant, en une ligne, à la
toute fin de `butin`.

Le montage produit par `genererSite` transporte désormais son `type` — c'est la
seule chose qui manquait, `butin` ne savait pas s'il payait un camp, un
avant-poste ou une base. Rien dans la boucle de combat ne le lit : **un
avant-poste ne se bat pas autrement qu'un camp**, il paie autrement.

⚠ **`null` VEUT DIRE 1, PAS ZÉRO.** Une base porte `multiplicateurButin: null` —
le tiret de la §10 de la spec. Le lire comme un zéro rendrait toute base sans
butin ; falsifié pour de bon, six tests tombent.

## 2. L'équilibre, mesuré sur 120 tirages par cas

| Niveau | Site | Bâtiments | Butin moyen | Force | Butin / point de défense |
|---|---|---|---|---|---|
| 20 | camp | 16 | 1 323 668 | 119 | 11 089 |
| 20 | **avant-poste** | 24 | **6 679 301** | 183 | **36 477** |
| 20 | base | 26 | 2 229 336 | 199 | 11 215 |
| 50 | camp | 25 | 8 945 515 265 | 296 | 30 226 441 |
| 50 | **avant-poste** | 35 | **41 264 796 229** | 415 | **99 421 265** |
| 50 | base | 39 | 14 139 685 421 | 462 | 30 576 149 |

**L'avant-poste rend maintenant 3,3 fois ce qu'une défense équivalente rapporte
ailleurs**, à tous les niveaux. Le camp et la base restent à égalité parfaite de
rendement — 11 089 contre 11 215 au niveau 20, 30,2 M contre 30,6 M au niveau 50
—, ce qui est normal : le ×1,1 de la base s'applique au butin ET à la défense.

Ta phrase devient donc vraie, et pour la raison que tu donnais : **on ne ferme
pas les bases**, parce qu'un avant-poste de même niveau rapporte trois fois plus
pour 10 % de défense en moins, et qu'il respawne.

⚠ **L'avant-poste rend cinq fois un camp, pas 3,25 fois.** Le multiplicateur ne
fait qu'une partie du travail : à niveau égal, un avant-poste porte aussi
**une fois et demie** les bâtiments d'un camp — 24 contre 16 au niveau 20. Les
deux effets se multiplient. C'est cohérent avec les rôles déclarés, « filet de
sécurité » contre « revenu ».

## 3. ⚠ Trois tables de référence ont bougé, et une seule ligne dans chacune

`assaut.test.js` T7, `roster.test.js` T6 et `cible.test.js` T4 mesurent des raids
de référence au champ près. Le raid **A** de la table est un avant-poste :

| | Avant | Après |
|---|---|---|
| A (avant-poste) | 237 / 79 | **772 / 257** |
| B (camp) | 37 221 / 12 407 | **inchangé** |
| C (camp) | 24 796 / 8 265 | **inchangé** |
| T4 (avant-poste) | 2 766 / 922 | **8 992 / 2 997** |

**Ni les causes, ni les ticks, ni les comptes de survivants ne bougent** — et
c'est la meilleure preuve que le multiplicateur ne touche que ce qu'il doit : il
s'applique après le combat, il ne change pas un seul tir. Que B et C soient
restés exacts à l'unité près est la seconde preuve, et elle est gratuite.

## 4. Un test mal monté, corrigé avant livraison

Le premier jet du test comparait un camp à un avant-poste **de même niveau** pour
mesurer le facteur. Ça ne mesure pas le facteur : les deux n'ont pas le même
nombre de bâtiments, et le rapport sortait à **5,05** au lieu de 3,25. Ce qui
isole le multiplicateur, c'est de payer **le même site deux fois** en ne changeant
que son type — le montage est identique, seul le champ `type` diffère, et le
rapport tombe à 3,2500. Le test porte la trace de la faute, pour que personne ne
la refasse.

## 5. Fichiers livrés

| Fichier | État |
|---|---|
| `src/sim/combat.js` | le multiplicateur, en fin de `butin` |
| `src/sim/generateur.js` | le montage transporte son `type` |
| `test/site-de-la-case.test.js` | le test qui isole le facteur (§4) |
| `test/assaut.test.js`, `test/roster.test.js`, `test/cible.test.js` | une ligne chacun (§3) |
| `SPEC-FOYER-ZERO.md` | §10 : « ×3 à 3,5 » devient ×3,25, et le tiret devient « donc ×1 » |
| `CLAUDE.md`, `package.json` | comptes, 0.38.0 · build 39 |

## 6. Ce qui reste

1. **L'acte de raid** : débiter les points d'attaque, composer l'assaut depuis
   l'armée du joueur, verser le butin dans l'économie — et voir s'il sature —,
   ramener les unités avec leurs dégâts.
2. **Les 4 645 ticks d'un raid** contre le plafond de combat.
3. **L'arbre de recherche** : le classeur porte les coûts, aucun n'est en code, et
   son LISEZ-MOI dit que la cadence reste à caler. Six autres questions ouvertes
   dans `ARBRE-RECHERCHE.md` §4, dont « les modules ont-ils des niveaux », qui
   double la taille de l'arbre selon la réponse.
4. Les blocages d'1 h et 24 h, le rayon du territoire, les deux niveaux adjacents
   d'une base de l'Ouvrage.
