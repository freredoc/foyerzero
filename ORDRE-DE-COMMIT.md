# OÙ ON EN EST — une seule archive, tout l'état final

**Jette les huit ZIP précédents.** Celle-ci les remplace toutes : chaque fichier
y est dans sa dernière version, et rien n'y est périmé. Elle se décompresse à la
racine de `freredoc/chantier`.

---

## Ce qu'elle contient

**42 sources de l'Ouvrage** — le camp est complet.

| Famille | Nombre | Détail |
|---|---|---|
| Escouades | 9 | 5 poses d'attaque, 4 de défense (les Fouisseurs n'en ont pas) |
| Aéronefs | 4 | monolithiques |
| Coques de blindé | 9 | 5 d'attaque, 4 de flanc (le Pilon n'en a pas) |
| Tourelles de blindé | 5 | carrées, centrées sur leur pivot |
| Socles de défense | 6 | 3 carrés, 3 coques à pattes |
| Tourelles de défense | 6 | carrées, centrées sur leur pivot |
| Monolithiques | 3 | Merlon, Ronce, Herse |

**4 sources du joueur** — `off_j_meute`, `off_j_meute_def` passent à 5 figures,
`off_j_guetteur`, `off_j_guetteur_def` à 3. Elles **écrasent** celles du dépôt.

**2 JSON d'ancres**, `art/sprites/ancres-blindes-ouvrage.json` et
`ancres-defense-ouvrage.json`, au format exact de ceux du joueur.

**8 outils**, dont un seul modifie un fichier existant : `tools/chassis.py`, où
`ancre` prend un paramètre `decal_max` de défaut **0,22 inchangé**. Les sept
autres sont nouveaux.

---

## Ce qu'il reste à faire, dans l'ordre

1. **Commiter cette archive.** `tools/entrees.py --declarer` pour inscrire les 46
   sources, puis `npm run check`.
2. **Vérifier la non-régression du joueur** : `python3 tools/ancres-defense.py` et
   `tools/ancres-blindes.py` doivent rendre des JSON identiques à ceux du dépôt.
   C'est le seul contrôle que le changement de `chassis.py` demande, et il est
   déjà passé ici.
3. **Le brief de câblage** — il est écrivable maintenant. Il fait quatre choses :
   étendre la table de `tools/joueur_v2.py` aux 42 sources de l'Ouvrage,
   transcrire les deux JSON en `src/data/ancres-*-ouvrage.js` avec le test qui
   les confronte, régénérer l'atlas, et retirer les 80 orientations v1 de
   l'Ouvrage plus les cinq blindés monolithes.

---

## Ce qui reste ouvert, et que le brief ne peut pas trancher

- **Le bloc rose du Merlon** : 9 428 px de `#D091CC`, seul pixel hors palette des
  42 pièces, sur la seule défense dont la cible vaut `null`. Non traité.
- **`FICHE-STYLE.md` §7 « taille = coût »**, son plafond A7 à 28 et le bloc
  « Dard » qui code le coût par le nombre de modules : les trois décrivent une
  règle abandonnée. À réécrire, pas à supprimer — sinon ils reviennent comme des
  défauts à corriger, ce qui est déjà arrivé à A6.
- **Les emprises par pièce.** Tu as dit reprendre les tailles à zéro. Aujourd'hui
  elles sont par châssis dans `joueur_v2.py` (escouade 18/24, blindé 20/31,
  aéronef 25/32) et valent pour les deux camps. Le seul écart déjà décidé est le
  Frappeur à ×0,90 et les trois artilleries à ×1,10 — ils ne sont **pas** dans le
  code, seulement dans `tools/planche-echelles-ouvrage.py`.

---

## Les échelles de tourelle, une par pièce

Décision du 07/09. Chacune est **calculée**, pas choisie : elle aligne le carré
de la tourelle de l'Ouvrage sur celui de son homologue du joueur, en pourcentage
de case. Les deux camps se lisent donc à la même taille, et la valeur se
recalcule si un dessin change.

| Tourelle | Échelle | Carré obtenu | Carré du joueur |
|---|---|---|---|
| `off_o_ratisseur_tourelle` | 3,192 | 42,44 % | 42,44 % |
| `off_o_fendeur_tourelle` | 1,956 | 84,90 % | 84,92 % |
| `off_o_broyeur_tourelle` | 1,455 | 77,10 % | 77,10 % |
| `off_o_belier_tourelle` | 1,505 | 40,18 % | 40,19 % |
| `off_o_pilon_tourelle` | 1,407 | 48,00 % | 48,01 % |
| `def_o_casemate` | 2,370 | 93,35 % | 93,36 % |
| `def_o_creneau` | 1,604 | 93,61 % | 93,62 % |
| `def_o_batterie` | 1,874 | 93,83 % | 93,82 % |
| `def_o_faucheuse` | 2,934 | 111,95 % | 111,95 % |
| `def_o_mortier` | 3,023 | 104,94 % | 104,96 % |
| `def_o_harpon` | 2,815 | 96,52 % | 96,53 % |

⚠ **Je me suis trompé au rapport précédent, et la correction compte.** J'avais
annoncé que les échelles du joueur ne transféraient pas, parce que quatre carrés
de l'Ouvrage dépassaient 100 % de la case. Or **le carré porte la marge de
rotation, et il dépasse aussi chez le joueur** : `socle_def_j_faucheuse` est à
111,95 %, `mortier` à 104,96, et le rendu du joueur est juste. Les deux camps
tenaient déjà la même fourchette — 28 à 112 % chez le joueur, 29 à 117 % à
l'Ouvrage. `art/essai/COMPARATIF-MONTAGE-40.png` pose les deux camps l'un sous
l'autre, à la formule du rendu : c'est ce montage-là qui l'a montré.
