# RAPPORT-S1-terrain.md — Foyer Zéro, 27/08/2026

Session S1, le lot 1. Objet : les 29 tuiles de terrain.

**Résultat : 29 fichiers livrés dans `sprites/terrain/`, zéro régénération.** Le
premier jet était juste de géométrie et faux de couleur ; il a été récupéré par
substitution une fois la rampe de sol arrêtée.

---

## 1. Ce que le premier jet a produit

Huit générations en planches 2 × 2, 32 tuiles, régime *Tuile*, palette *aucune*.

**Le pavage était réussi du premier coup**, et c'était la difficulté du lot :
quatre variantes plus la rotation d'A3, sur 5 × 5 cases à 43 px, sans couture ni
motif de répétition visible. Rien de cette partie n'a été refait.

**La couleur, elle, était intégralement fausse.** Mesuré sur les 32 fichiers :

| Génération | Composition |
|---|---|
| 56489 | kaki 70 % · **accent blanc 30 %** |
| 56490 | métal 52 % · kaki 48 % |
| 56491 | kaki 58 % · **accent blanc 30 %** · métal 12 % |
| 56492 | kaki 100 % |
| 56493 | kaki 100 % |
| 56494 | **accent blanc 79 %** · kaki 21 % |
| 56495 | métal 80 % · kaki 20 % |
| 56496 | **accent blanc 100 %** |

Pas un ton de terrain : les 32 tuiles étaient faites de tons d'entités.
`#928E80`, qui est l'ombre de l'**accent anti-infanterie**, couvrait la totalité
d'un terrain et 79 % d'un autre.

Conséquence constatée à 43 px, entités posées sur le pavage : **l'escouade du
joueur disparaissait** sur quatre des huit terrains, seuls les casques blancs
surnageant — et ils surnageaient parce que le sol était de leur famille. Les
entités de l'Ouvrage se lisaient partout. Le joueur était camouflé sur son propre
sol, l'ennemi non.

## 2. La cause : une sixième dette DA

`FICHE-STYLE.md` §3 définissait quatre rampes — kaki, métal, accents, ardoise —
et **les quatre sont des rampes d'entité**. Le §9 nommait les sept terrains, sous
un titre « Nommage », et ne leur donnait aucune couleur. Le modèle n'avait rien à
sa disposition : il a emprunté.

C'est une **sixième dette DA**, restée invisible parce que le §9 avait l'air
réglé. Elle n'était pas dans le tableau des cinq, et le jet d'essai S0 ne
comportait aucune tuile — le plan mettait le terrain en premier au motif que
c'était « le seul lot où le modèle travaille sans contrainte de silhouette ».
Le raisonnement était juste et la conclusion fausse : c'était le seul lot sans
contrainte de **palette**.

## 3. La rampe de sol

Le sol de la référence fournie par Ethan a été échantillonné sur une zone nue :
**L\* 40–51, chroma 21–28, teinte ~60°** — une terre cuite.

⚠ **Cette valeur est inreprenable telle quelle.** Le kaki du joueur occupe
L\* 36–48 : même bande. Le genre s'en tire parce que son infanterie est pâle sur
sol sombre ; la nôtre est vert-brun moyen. La teinte a donc été conservée et la
**bande de clarté remontée au-dessus de L\* 62**, plafond du ton kaki le plus
clair.

Deux candidates générées, comparées sur le même pavage avec quatre entités
posées dessus — protocole du jet d'essai S0, arbitrage sur pièce :

| | Bande | Chroma | Retenue |
|---|---|---|---|
| A — sable | L\* 66–84 | 22 → 13 | non — contraste maximal, mais le sol ne raconte rien |
| **B — terre cuite** | **L\* 58–78** | **30 → 18** | **oui**, tranchée par Ethan |

```
#B87E64   #C38C73   #CF9A83   #D7A995   #E0B9A8
creux     ombre     sol nu    clair     poussière
```

Écart minimal à chaque ton existant de la palette : **22 à 26 ΔE**. Aucune
collision.

⚠ **Limite structurelle, à ne pas rouvrir.** Les deux candidates lisent *sable
rosé* et non *terre rouge*. Au-dessus de L\* 60 le sRGB ne permet plus la
saturation de la référence : le rouge profond exige la valeur basse, et la valeur
basse est occupée par les entités. C'est le prix de la lisibilité, il est payé
une fois.

**Le pétrole ne reçoit pas de ton propre.** Celui calculé pour lui tombait à
**ΔE 2,1** de `#1E2124`, indistinguable — une teinte de plus au catalogue pour
rien. `tile_suintement` réutilise `#1E2124`.

**Aucun vert dans le terrain.** Le vert est la couleur du joueur : une friche
verte rendrait une escouade invisible. La végétation est sèche — bois mort,
paille — ce qui est cohérent avec un décor aride.

## 4. Un seul sol, sept matières

Les sept terrains partagent **la même rampe de sol**. Ce qui les distingue est
une matière posée dessus, jamais une teinte de sol différente. Sans cette règle,
sept sols différents se ressemblent tous : c'est ce qu'a produit le premier jet,
huit textures indiscernables les unes des autres.

| Terrain | Matière | Couverture mesurée |
|---|---|---|
| `tile_sterile` | aucune, sol nu | 0 % |
| `tile_friche` | broussaille, en ton de sol clair | 0 % |
| `tile_suintement` | pétrole `#1E2124` | 20 % |
| `tile_futaie` | bois mort `#5B4133` | 21 % |
| `tile_affleurement` | quartz `#9FB3C5` · `#C1CEDA` | 35 % |
| `tile_croute` | scorie `#382E47` | **50 %** |
| `tile_vasiere` | eau croupie `#1F5160` | **53 %** |

### Trois réserves, aucune bloquante

1. **`tile_croute` à 50 % et `tile_vasiere` à 53 %.** Au-delà d'environ 35 % la
   matière cesse d'être posée sur un sol et devient le sol. Sur ces deux-là, une
   entité de l'Ouvrage — ardoise sombre sur scorie ardoise, ou sur eau sombre —
   redevient difficile à lire. **C'est le défaut symétrique de celui du premier
   jet**, et il mérite d'être vu comme tel : on a corrigé la camouflage du joueur
   en créant celle de l'Ouvrage sur deux terrains. Deux générations à couverture
   plus basse le règlent.
2. **`tile_horschamp` est un aplat.** Il doit dire « on ne va pas là » ; un aplat
   de ton de sol ne le dit pas. Une génération.
3. **La génération 56489 laissait voir ses coutures** à 43 px, ses quatre
   variantes n'ayant pas la même clarté d'ensemble. Elle sert `tile_vasiere`, où
   la matière masque le défaut — mais il est là.

## 5. Attribution des générations aux terrains

L'affectation est **une décision de ce rapport**, prise sur la densité mesurée du
bruit, pas une instruction reçue. Elle se change en une ligne de table de
substitution, sans rien régénérer.

| Terrain | Source | Densité de la source |
|---|---|---|
| `tile_sterile` | 56492 | 91 / 9 — la plus calme |
| `tile_friche` | 56493 | 51 / 49 — mouchetis fin et dense |
| `tile_futaie` | 56495 | 79 / 21 — amas épars |
| `tile_suintement` | 56494 | 80 / 20 — taches |
| `tile_affleurement` | 56491 | 5 tons — la seule à structure cristalline |
| `tile_croute` | 56490 | 50 / 50 — dense |
| `tile_vasiere` | 56489 | 53 / 47 — dense |
| `tile_horschamp` | 56496 | aplat |

## 6. Deux décisions annexes, prises en livrant

- **Destination des fichiers finis : `sprites/`**, un sous-dossier par lot. La
  question était ouverte depuis la remise au propre de l'inventaire ; le lot 1
  sortant 29 fichiers, elle ne pouvait plus attendre. `art/` reste réservé aux
  **références** — étalons et moules — qui ne sont pas des livrables.
- **Le réglage de palette du conditionneur pour S1** passe de *Joueur seul* à
  *Sol*. C'est le réglage noté dans le plan qui a produit le premier jet.

## 7. Ce qui reste ouvert

1. Les trois réserves du §4 — trois générations.
2. Les **1024 sources** des références Ouvrage, toujours absentes du dépôt.
3. Le conditionneur n'a pas de palette *Sol* ni de fourchettes pour le terrain :
   il touche au DOM, donc il passera par un brief Claude Code.
4. La carte du monde n'aura **aucune variation à grande échelle** : 9 000 cases
   de texture uniforme. Ce n'est ni un lot ni un blocage ; si ça gêne un jour, la
   réponse est une teinte procédurale par zone, pas des fichiers en plus.

---

*S1 close. 29 fichiers, 8 générations, 0 régénération.*
