# Session de relevé — ce qu'il faut capturer

Mise à jour du 22/08/2026 après les précisions d'Ethan. Trois points sont **résolus sans
relevé** et sortent de la liste (§0).

Objectif : une seule connexion suffit. Priorité décroissante — les blocs 1 et 2 sont ceux qui
débloquent le modèle économique.

**Méthode :** capture d'écran systématique plutôt que recopie. Un chiffre transcrit à la main
est un chiffre qu'on ne pourra pas vérifier.

---

## 0. Acquis — ne plus relever

| Fait | Valeur |
|---|---|
| Zone d'influence | **fixe, ne croît jamais.** Rayon 2 joueur, 3 ennemi |
| Rayon d'attaque | **fixe à 10**, quel que soit le niveau de la base |
| Délai entre deux déplacements de base | **1 h au départ → 24 h au niveau 50** |
| Niveau d'une base | **moyenne des niveaux de ses bâtiments** |
| Camps et avant-postes | indexés sur le joueur, n'attaquent jamais |
| Bases ennemies | 10 en périphérie → 50 au centre ; **seules elles attaquent** |

**Conséquence du niveau moyen.** Le niveau n'est pas un compteur, c'est une statistique
dérivée. Monter un seul bâtiment très haut ne monte presque pas le niveau de la base — donc
n'augmente presque pas le butin qu'elle offre. Le générateur de bases devra composer des
niveaux, pas les tirer.

---

## 1. Le butin (le plus urgent)

### 1.1 La décroissance 0,7ⁿ et sa réinitialisation — **à faire en premier**

Dix minutes, et ça tranche la seule décision de forme qui reste sur le butin.

Attaquer **le même camp trois fois de suite**, noter le butin à chaque passage.
Attendu : 1 · 0,7 · 0,49.

Puis **revenir sur la même cible après plusieurs heures**, noter le quatrième passage :

- butin revenu au niveau initial → le pot est **renouvelable**, et c'est le taux de
  régénération qui régule le jeu ;
- butin toujours autour de 0,34 → chaque cible est une **réserve épuisable**, et la carte
  devient un compte à rebours.

Les deux donnent des jeux différents.

### 1.2 Contenu par bâtiment

Pour **une base ennemie**, noter le butin par bâtiment détruit :

| Bâtiment | Ressource A | Ressource B | Crédits |
|---|---|---|---|
| Harvester | | | |
| Refinery | | | |
| Silo générique | | | |
| Silo A | | | |
| Silo B | | | |
| Defense HQ | | | |
| Defense Facility | | | |
| Trade Center | | | |
| Construction Yard | | | |

### 1.3 La courbe par niveau

**Le point qui décide de tout.** Répéter le relevé 1.2 sur **trois niveaux espacés** — par
exemple 15, 25, 35.

Deux points suffisent à ajuster un ratio géométrique. Le troisième sert à vérifier que c'en est
bien un : une courbe passe toujours par deux points, ça ne prouve rien.

Question à laquelle ces trois mesures répondent : **le butin croît-il plus vite ou moins vite
que ×1,7 par niveau ?** Plus vite, la progression ne sature jamais. Moins vite, elle sature
plus tard qu'on ne le croyait. C'est la question laissée ouverte au §2 du modèle économique.

### 1.4 La composition des niveaux dans une base ennemie

Hypothèse à vérifier : les bâtiments d'une base ennemie ne sont qu'à **deux niveaux adjacents**
(23/24, 35/36…), répartis pour que la moyenne tombe sur la valeur visée. Une cible de 34,6
donnerait 60 % de bâtiments au niveau 35 et 40 % au niveau 34.

À relever sur **deux ou trois bases de niveaux différents** : liste des bâtiments et niveau de
chacun. Si l'hypothèse tient, le générateur de bases se réduit à un seul paramètre — le niveau
visé — et la répartition en découle.

---

## 2. Confirmer les deux courbes

Sur **un seul bâtiment**, coût et production sur au moins 5 niveaux consécutifs :

| Niveau | Coût A | Coût B | Coût énergie | Production/h |
|---|---|---|---|---|

Vérifie d'un coup les trois faits déjà tenus pour acquis : coût ×1,32, production ×1,20,
énergie = exactement la moitié du coût en ressource.

Si possible, refaire sur un **bâtiment d'une autre famille** — c'est ce qui confirme que la
pente est universelle et non propre au bâtiment.

---

## 3. Points de commandement

Le rayon est fixe à 10, mais le **coût** ne l'est pas. C'est lui qui pilote le calibrage
directeur des 3 à 5 attaques par session ; sans lui, ce calibrage n'est pas vérifiable.

| À relever | Note |
|---|---|
| Coût en PC à distance 1, 3, 5, 8, 10 | croissant — linéaire, ou pas ? |
| Régénération des PC | par heure |
| Plafond de PC | et ce qui le fait monter |

---

## 4. Les trois types de site

| Type | Niveau min | Nb bâtiments | Défense | Attaque | Indexé sur |
|---|---|---|---|---|---|
| **Camp** | | peu | faible | non | le joueur |
| **Avant-poste** | ~10 ? | plus | plus dure | non | le joueur |
| **Base** | 10 | complet | complète | **oui** | position (10 → 50) |

À confirmer : le seuil d'apparition des avant-postes, et **sur quoi exactement** se cale le
niveau des camps et avant-postes — niveau d'offense, niveau de base, ou rang du joueur.

Non relevable en une session : **la fréquence des raids**. C'est un timer, il faudra plusieurs
jours ou un dump.

---

## 5. Si l'occasion se présente

- **Console du navigateur, dump `GAMEDATA`** : réglerait d'un coup la matrice de dégâts, les
  stats d'unités et les valeurs de réserve — les trois trous marqués **[X]** du relevé tactique
- Coût de réparation après un raid, comparé au butin obtenu : valide directement
  `butin = coût_réparation × 0,7ⁿ`
- Points d'armée disponibles selon le niveau du Command Center
- Un raid mené proprement rapporte-t-il vraiment sans aucun coût de réparation ?

---

*Ce qui n'est pas capturé devra être inventé et calibré. Ce n'est pas grave — mais autant
savoir lequel des deux on fait.*
