# RAPPORT — lot 7, les quatorze unités de l'Ouvrage

**30/08/2026.** 66 fichiers dans `art/sprites/unite/{128,64,32}` : 14 unités en
version attaque, 8 en version défense. Aucun fichier de `src/` ni `test/`
touché. Le total du dépôt passe à **1 535 sprites**.

---

## 1. ⚠ Une planche source a été supprimée par erreur, et récupérée

`file_000000003a90…png` a été supprimée le 30/08 comme doublon. **Ce n'en était
pas un** : c'est la version de dos du trio meute / perceurs / carapace, et sans
elle trois des cinq escouades de l'Ouvrage n'ont pas de sprite d'attaque.

L'erreur est la mienne : je l'avais annoncée comme doublon en comparant sa
structure et ses accents, qui sont identiques entre un dos et sa face, sans
jamais comparer les silhouettes.

Elle est récupérée depuis l'historique git, objet `f714031`, 2172 × 724, et
livrée sous le nom `off_o_meute_perceurs_carapace_dos.png`. **Elle doit être
déposée dans `art/sources/` avant de lancer l'outil.**

## 2. La coupe, et pourquoi une règle automatique ne marche pas

Une escouade est faite d'individus séparés par des espaces aussi larges que ceux
qui séparent deux cellules. Couper à chaque gouttière scinde les escouades : la
planche du trio sortait en six morceaux au lieu de trois, celle de la paire en
quatre au lieu de deux.

Une règle par ratio d'écart — « une gouttière est une frontière si elle dépasse
la médiane d'un facteur donné » — a été essayée et **échoue à 3 planches sur
10**, quel que soit le seuil de 1,5 à 3,0. La raison est structurelle : trois
écarts égaux séparent tantôt trois unités distinctes, tantôt les membres d'une
même escouade. La géométrie seule ne les distingue pas.

La coupe se fait donc aux **N−1 plus grands écarts**, N venant du nom de
fichier. Vérifié contre les groupements donnés par Ethan : **10 planches sur
10**, sans exception.

## 3. L'attribution : deux signaux sur trois tenaient

Elle vient des noms de fichier, posés par Ethan le 30/08. Elle avait d'abord été
tentée par la mesure :

- **L'accent donne la spécialité.** Vérifié sur les 14 unités du joueur déjà
  produites, **14 sur 14** : blanc = antiInfanterie, rouge = antiVéhicule,
  jaune = antiStructure. Aucune exception.
- **La structure de planche donne le palier de points.** Chez le joueur, `P2_3`
  porte le trio à 10 points et `P2_4` la paire à 15 — 232 k contre 405 k de
  matière, rapport 1,74. Côté Ouvrage, 188 k et 210 k pour les trios, 352 k et
  360 k pour les paires : **rapport 1,7 à 1,9, aucun recouvrement**.
- **Distinguer un dos d'un second jet de face a échoué.** L'IoU d'une paire
  dos/face avérée vaut **0,76 à 0,91** — mesuré sur les trois paires nommées par
  Ethan — ce qui recouvre exactement ce que donnerait un doublon. C'est cette
  zone de recouvrement qui a produit l'erreur du §1.

Le nom de fichier tranche là où la mesure ne peut pas. C'est la leçon du lot.

## 4. Les six unités sans version de défense

`UNITES[x].defense.present` est faux pour `fouisseurs` et `pilon`, et les quatre
aéronefs ne garnissent jamais une défense. Les planches de face portent quand
même le fouisseur et le pilon ; l'outil ne les écrit pas. D'où 22 sprites et non
28.

## 5. Contrôles passés

| Contrôle | Résultat |
|---|---|
| Fichiers écrits | **66** |
| Sprites | 14 en attaque, 8 en défense |
| Couleurs hors palette | **0** |
| Occupation en 32 | 20,0 % de moyenne, **12,8 % au minimum** |
| Comparaison au joueur en 32 | 26,5 % de moyenne et 9,4 % au minimum côté joueur — l'Ouvrage a un plancher **plus haut** |
| Planche de contrôle en 32 | ✔ regardée, les 22 sont lisibles et les accents concordent |

Le plancher d'occupation est le chiffre qui compte : à 12,8 %, ces unités n'ont
rien du filigrane des tourelles de défense de l'Ouvrage, qui tombaient à 0,10 %.

## 6. Reste ouvert

1. **`off_o_guetteurs_fouisseur_face.png`** porte un `s` de trop à guetteur.
   L'outil suit le nom du dépôt ; à renommer si tu veux la cohérence.
2. **`off_o_ratisseur` et `off_o_crecelle` tirent vers le kaki** plutôt que vers
   la rampe A, comme les tourelles d'unité de l'Ouvrage au lot 2. À regarder si
   la lisibilité des camps en souffre.
3. **Les châssis sans tourelle du joueur** — `P3.3`, `P3.4` et les cinq
   `off_j_*_chassis_face_profil` — restent le dernier lot d'unités non traité.
