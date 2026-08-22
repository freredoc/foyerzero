# Synthèse — jeu de guerre idle (projet sans nom)

État au terme de la **Phase 0**. Recherche close, DA établie, trois décisions de cadrage prises, aucun code de jeu écrit.

Le projet s'appelle **Foyer Zéro**. Codename interne et nom de dépôt : *Chantier*.

---

## 1. Ce que le jeu est devenu

Un **jeu de guerre idle solo, hors ligne**, dans lequel un joueur unique affronte un système industriel autonome sur une carte finie. L'économie tourne sans le joueur ; l'attaque, jamais.

La partie se termine — prise de la forteresse centrale — puis repart sur une nouvelle carte avec une méta-progression. Un roguelite stratégique à rythme idle, pas un MMO.

Ça élimine d'emblée la contrainte serveur : on retombe sur le modèle Archipel — fichier autonome, sauvegarde locale, hors ligne d'abord.

---

## 2. Décisions verrouillées

### Boucle

| Décision | Détail |
|---|---|
| Solo hors ligne | 1 faction joueur contre le jeu. Pas de dualité GDI/Nod |
| Idle l'économie | Production, régénération, packages tournent hors ligne |
| Idle la défense | Les raids ennemis sont résolus hors ligne, rapport au retour |
| Jamais idle l'attaque | Choix de cible, composition, placement restent manuels |
| CP / RT conservés | Mais les plafonds montent par la recherche et les POI, **jamais par de l'argent** |
| POI = arbre de progression | Améliorations permanentes posées sur la carte, pas un menu |
| Prestige | Forteresse centrale = fin de run → reset + méta-progression |

**Calibrage directeur :** le joueur doit toujours pouvoir enchaîner **3 à 5 attaques par session**, quel que soit son palier. C'est ce qui pilote la courbe de plafond CP.

### Architecture (décision 0.3)

| Décision | Détail |
|---|---|
| Livrable | **HTML autonome, offline, sauvegarde locale.** Non négociable — c'est ce qui rend le Play Store possible |
| Sources | **Modulaires**, pas un monolithe éditable. « Livré autonome » n'implique pas « source unique » |
| Build | **esbuild seul**, version épinglée, aucune dépendance transitive, fonctionne sans réseau |
| `dist/` | Produit **par la CI uniquement**. Jamais édité ni commité à la main — la désynchronisation devient impossible, pas seulement déconseillée |
| Langage | **JavaScript + JSDoc.** Pas de TypeScript pour l'instant ; bascule locale si le moteur le mérite |
| Tests | **`node --test` natif**, zéro framework |
| `sim/` | Pur, déterministe, PRNG injecté, **zéro dépendance navigateur** |
| `render/` | Canvas 2D, interpolation 60 fps, **aucune logique** |
| `data/` | Tables de calibrage **générées depuis le tableur de la 1.2**, jamais écrites à la main |
| Sauvegarde | Versionnée **avec migration dès le premier jour** (Archipel l'a ajouté après coup, il en est à `SAVE_VERSION` 31) |

**Ce qui a emporté la décision :** la simulation est déterministe à 10 Hz. Un cœur pur se teste en Node en millisecondes et se rejoue depuis une graine — donc 10 000 combats en batch pour calibrer. C'est la seule façon de confronter le modèle économique au moteur avant l'étape 2.5.

**Ce qu'on perd, et c'est réel :** dans le modèle Archipel, le fichier source *est* le fichier livré. Aucun build à déboguer. Les garde-fous ci-dessus existent pour compenser cette perte.

### Défense idle (décision 0.2)

| Décision | Détail |
|---|---|
| Sanction | **Par les PV, pas par une taxe.** Production proportionnelle aux PV + réservoir Base qui se vide en réparant : la punition existe déjà, elle est lisible et s'auto-régule |
| Butin | **Oui, en réserve saturante.** Chaque raid repoussé l'alimente, elle plafonne |
| Plafond | ~**une attaque manuelle**, pas trois. Valeur exacte fixée par le modèle de la 1.2 — on verrouille la forme, pas le chiffre |
| Collecte | **Manuelle**, au retour |

**Bénéfice technique, aussi lourd que le bénéfice de design :** la saturation rend le rattrapage hors ligne **analytique**. Sans plafond, revenir après trois jours obligerait à rejouer des dizaines de combats 10 Hz au chargement — coûteux, et surtout une source de divergence entre la sim de rattrapage et la sim en direct. Avec saturation, l'état final se calcule : réserve pleine, PV au plancher, réservoir Base à l'équilibre.

**Contrainte induite :** la fréquence des raids doit être indexée sur la **progression** du joueur, jamais sur sa **vulnérabilité** — sinon on crée une incitation à rester mal défendu pour farmer.

### Univers et lexique (décision 0.1)

Monde **distinct d'Archipel**. On hérite de la méthode de nommage, pas du monde. Trois raisons : Archipel est un jeu de logistique pacifique déjà en test fermé et son ton ne doit pas changer rétroactivement ; un univers partagé crée une dette bidirectionnelle sur chaque nom ; le cross-sell ne paie que si le premier jeu a une audience, ce qui n'est pas encore le cas.

L'univers n'a pas été inventé, il a été **constaté** : la DA l'avait déjà tranché. Ennemi radial, à pattes, modules identiques, accent émissif = une machine qui se réplique, pas une nation. Joueur kaki, directionnel, chenillé, à évents = industriel et humain. Forteresse au centre d'un disque = une racine qu'on remonte.

| Terme | Désigne |
|---|---|
| **L'Ouvrage** | La faction ennemie. Nom collectif, jamais une nation, jamais un chef |
| **Le Foyer** | La forteresse centrale. Sa prise arrête la réplication et termine la run |
| **Quartz** | Ressource neutre, présente partout, sert la structure et la construction |
| **Scorie** | Le dépôt que l'Ouvrage laisse en s'étendant. Ressource riche, donc située sur le terrain contaminé, donc défendu |

**Prémisse.** Une installation d'extraction automatisée a continué de tourner sans supervision. Elle s'est répliquée, module par module, jusqu'à recouvrir le terrain de son propre dépôt. Le joueur dirige un **chantier de reprise** industrielle qui remonte les anneaux jusqu'au nœud d'origine.

**Pourquoi « l'Ouvrage » :** c'est un nom d'usage, pas une métaphore. Le mot que l'installation emploierait dans ses propres journaux d'exploitation, sans intention. Une machine qui continue son travail parce que personne ne l'a arrêtée est plus inquiétante qu'une machine hostile. Bénéfice induit : **chantier de reprise contre Ouvrage**, deux termes du même registre industriel — le joueur ne combat pas une autre espèce, il reprend un site. C'est ce ton qui alimentera les rapports de raid et les descriptions.

**Titre : Foyer Zéro.** *Foyer* est métallurgique — le creuset, la forge. Mais « foyer zéro »
calque « patient zéro » : le **foyer originel d'une contagion**, ce qu'est exactement l'Ouvrage,
une réplication partie sans supervision. Le titre porte les deux sens à la fois.

**Contre-ouvrage** — terme de fortification, ouvrage élevé face à celui de l'assiégeant — n'est
**pas** dans le titre mais devient le mot in-game pour **la base du joueur**. On ne construit pas
« une base » : on élève **son contre-ouvrage** face à l'Ouvrage. Placé là, le mot travaille à
chaque écran plutôt que d'être consommé une fois sur une icône.

**Piège identifié :** la scorie ne doit pas dériver vers un cristal vert qui pousse tout seul. C'est le point exact où la reprise C&C se réintroduit sans qu'on la voie.

Non nommés à dessein : les **14 bâtiments** (leur vocabulaire dépend de fonctions économiques que la 1.2 n'a pas fixées) et le **projet lui-même**.

### Dimensionnement visé

- Carte : disque de rayon ~24 cases (~1 800 cases), 5–6 anneaux de difficulté
- Contenu PNJ : 150–250 cibles
- Bases joueur : 1 au départ, 3–4 via MCV
- Durée d'une run : 15–25 h de jeu, soit 2–4 semaines en rythme idle
- Session type : 8–12 min

### Direction artistique

| Décision | Détail |
|---|---|
| Vue | top-down strict, portrait, avance bas → haut |
| Grille | 9 colonnes × 20 lignes — **tient dans un écran de téléphone sans caméra** |
| Sprites | 32×32 logique, ×4 nearest → PNG 128×128, rendu ~40 px CSS |
| Orientation | 3 signaux cumulatifs : gradient avant/arrière, masse asymétrique, pont arrière |
| Couleur | l'accent code **la cible**, pas le camp. Rouge anti-véh, jaune anti-air, blanc anti-inf |
| Joueur | kaki chaud désaturé, directionnel, blindé |
| Ennemi | **anodisé sombre**, radial, pattes, accent **émissif**, modules identiques |
| Sprites | livrés **en couches** (corps + arme), ombre **jamais cuite** |
| Animation | 3 couches : transformations, procédural, planches (rares) |
| Horloges | simulation 10 Hz déterministe / rendu 60 fps interpolé |

---

## 3. Acquis techniques, par niveau de confiance

### Vérifié — lu dans du code ou recoupé arithmétiquement

| Fait | Source |
|---|---|
| Grille 9 × 20 : lignes 0–7 base, 8–15 défense, 16–19 offensive | encodeur `zbluebugz/CnC-TA-Opt` |
| 7 terrains : vide, cristal, ressource-B, bois, broussaille, pétrole, marais | idem |
| **Butin = coût_réparation(dégâts) × 0,7^(attaques précédentes)** | `Battle Simulator V2` |
| Butin de points de recherche = `max(1, floor(RP × ratio_dégâts))` | idem |
| Combat = simulation à pas fixe **10 Hz**, +3 s d'évacuation si fin anticipée | idem |
| **4 réservoirs de réparation séparés** : Inf / Véh / Air / Base | énumérations `ClientLib` |
| 6 classes de locomotion : Feet, Wheel, Track, Air, Air2, Structure | idem |
| 14 bâtiments joueur, nommés | idem |
| Défenses = matrice **3 châssis × 3 cibles** + 3 longue portée + 3 barrières = 15 | noms internes PNJ |
| Offensif = 14 unités : 5 infanterie, 6 véhicules, 3 aériens | encodeur |
| **Coût ×1,32 / niveau · Production ×1,20 / niveau**, à partir du niveau 12 | table communautaire, vérifié |
| Coût énergie = **exactement 0,5 × coût ressource** | idem |
| Intervalle de package : monte jusqu'à **6 h au niveau 12, puis figé** | idem |
| Production **proportionnelle aux PV** du bâtiment | script d'auto-réparation |
| Adjacence : +25 % par gisement, plafond +100 % | doc communautaire |
| Base détruite → bâtiments à **5 % de PV** | doc officielle |
| 1,32 / 1,20 = 1,10 → **chaque niveau a un retour 10 % plus long** | calculé |

### Déduit — cohérent mais non confirmé

- Le facteur 1,20 est un **paramètre serveur** (`get_TechLevelUpgradeFactorBonusAmount`), donc la courbe entière se règle avec un seul curseur
- Le plafond de niveau est aussi par monde (`get_PlayerUpgradeCap`, 65 sur les mondes récents)
- La morale : 3 états, PNJ uniquement, désactivée sur la forteresse

### Hypothèse — à valider

- **Matrice de dégâts** : ×2 sur la cible spécialisée, ×1 neutre, ×0,5 défavorable, ×0 impossible

---

## 4. Les trous

### A — Bloquants pour un prototype jouable

| Trou | Pourquoi c'est bloquant |
|---|---|
| **Formule de coût de réparation** | Le butin en dépend entièrement. Sans elle, pas d'économie |
| **Matrice de dégâts** | C'est le cœur du combat. L'hypothèse ×2/×1/×0,5/×0 est plausible, non vérifiée |
| **Stats d'unités** | PV, dégâts, portée, vitesse, coût par niveau. **Rien du tout** |
| **Résolution du combat** | Déplacement par tick, priorité de ciblage, portée en cases, fonctionnement des vagues |
| **Taux CP / RT** | Régénération, plafonds, coût d'attaque par distance |
| **Budget de points d'armée** | Par niveau de Command Center |
| **Courbes de stockage** | Capacité des silos et raffineries |

Les trois premiers peuvent être comblés par un dump `GAMEDATA` depuis la console du jeu, ou reconstruits par calibrage propre. Les autres seront de toute façon réinventés.

### B — Décisions de conception non prises

*Les trois premiers points de cette liste — butin de la défense idle, univers, lexique — ont été tranchés en Phase 0. Voir §2.*

1. **Courbe de pression ennemie.** C'est ce qui remplace la tension sociale du multi. Rien de défini. **Contrainte déjà posée :** indexée sur la progression, jamais sur la vulnérabilité (cf. 0.2).
2. **Contenu de la méta-progression.** Que gagne-t-on au reset ?
3. **Équivalents des 7 POI** et leurs bonus.
4. **Arbre de recherche.** Structure, coûts, ce qu'il débloque.
5. **Rythme des MCV** et nombre de bases.
6. **Nommage des 14 bâtiments.** Volontairement repoussé après la 1.2 : nommer une chose avant de savoir ce qu'elle fait, c'est se contraindre pour rien.
7. *(clos)* **Nom du projet** — **Foyer Zéro**, arrêté le 22/08/2026.

### C — Technique

*Tranché en 0.3 : architecture, build, format et migration de sauvegarde, déterminisme par graine. Voir §2.*

Reste ouvert, sans rien bloquer :

- **React ou pas pour l'UI.** Le prototype en rectangles colorés n'a quasiment pas d'interface ; la question se pose au moment des panneaux, de la recherche et des rapports, pas avant
- **Cible de publication** : web seul, ou Play Store comme Archipel. L'architecture retenue ne ferme aucune des deux portes
- **Rattrapage hors ligne** : rendu analytique par la saturation du butin (cf. 0.2). Reste à écrire, mais le problème difficile — éviter de resimuler des heures de combat au chargement — est désamorcé

### D — Dette DA déjà connue

- **Marcheur** : pattes trop fines, se confond avec le pylône à 40 px
- **Infanterie joueur** : casques redevenus neutres au passage en couches — l'escouade a perdu son code couleur. Il faut une couche d'accent séparée, ou accepter 3 corps distincts pour ce châssis
- Tourelle : le dôme mange le socle ; l'anneau blanc anti-infanterie se lit comme du métal
- Palette ennemie B validée, mais aucune rampe ennemie n'est encore inscrite dans la fiche de style

---

## 5. Ordre de travail

### Le principe

**Le prototype de combat passe avant l'art.** On a fait la DA d'abord parce que c'est là qu'allait la conversation, et c'était utile — la fiche de style empêche la dérive. Mais produire 50 sprites avant de savoir si le combat est amusant, c'est le risque le plus coûteux du projet.

Un prototype en rectangles colorés répond à la seule question qui compte : *est-ce que placer trois vagues contre une défense visible est intéressant à faire cinquante fois ?* Si la réponse est non, tout le reste est sans objet.

### Phase 0 — Décider (aucun code) — **CLOSE**

| # | Tâche | Verdict |
|---|---|---|
| 0.1 | Univers et nommage | Monde distinct. L'Ouvrage, le Foyer, quartz, scorie, 7 terrains renommés |
| 0.2 | Défense idle : butin ou pas | Butin en réserve saturante, sanction par les PV |
| 0.3 | Cible technique et architecture | Sources modulaires + esbuild → HTML autonome unique |

Détail dans §2. **Ne pas rouvrir sans raison nouvelle.**

### Phase 1 — Chiffrer

| # | Tâche | Note |
|---|---|---|
| 1.1 | Dump `GAMEDATA` depuis la console | valide l'hypothèse de matrice de dégâts. Compte jetable |
| 1.2 | **Modèle économique en tableur** | courbes 1,32 / 1,20, durée de run, nombre de cibles, plafonds CP. C'est ici que vit le calibrage, pas dans le code |
| 1.3 | Stats de la matrice 3×3 | PV, dégâts, portée, vitesse — inventées, calibrées sur le modèle |

### Phase 2 — Prototype vertical, sans art

| # | Tâche |
|---|---|
| 2.1 | Moteur de combat 10 Hz déterministe, rectangles colorés |
| 2.2 | Placement pré-combat, lecture de la défense adverse |
| 2.3 | Une base, puzzle d'adjacence, un tick d'économie |
| 2.4 | Butin `réparation × 0,7^n` branché |
| 2.5 | **Test de plaisir** : 20 combats d'affilée. Verdict franc |

### Phase 3 — Art (uniquement si 2.5 est concluant)

| # | Tâche |
|---|---|
| 3.1 | Corriger la dette DA connue (marcheur, accent infanterie, tourelle) |
| 3.2 | Inscrire la rampe ennemie dans la fiche de style |
| 3.3 | Jeu défensif complet : 3 corps × 3 armes + longue portée + barrières |
| 3.4 | Jeu ennemi complet |
| 3.5 | Unités offensives (14) |
| 3.6 | Bâtiments (14), terrains (7), POI |
| 3.7 | Interface, portraits frontaux |

### Phase 4 — Contenu

| # | Tâche |
|---|---|
| 4.1 | Générateur de carte (disque, anneaux, layouts de gisements) |
| 4.2 | Générateur de défenses PNJ variées — **c'est le vrai travail de contenu** |
| 4.3 | Recherche, POI, méta-progression |
| 4.4 | Rattrapage hors ligne et rapport de raids |

---

## 6. Le risque principal

Il n'est pas technique. Le combat manuel doit rester intéressant sur des centaines de répétitions, alors que la même armée optimisée bat les mêmes défenses. Dans l'original, la variété venait des autres joueurs.

Ici, elle devra venir du **générateur de défenses**. C'est le poste de travail le plus sous-estimé du plan, et le seul dont l'échec condamne le projet.

---

*Fichiers liés : `FICHE-STYLE.md`, `etalon-v4.zip`, `confrontation.png`.*
