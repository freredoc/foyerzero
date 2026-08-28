# RAPPORT — lot TUTORIEL

L'onglet Mission cesse d'être mort : il porte le tutoriel. Il était « bouton
mort pour l'instant, futur tuto » dans la liste du 28/08 ; le futur est arrivé.

**Arbitré le 28/08 :** *des missions qui se cochent toutes seules, sans
récompense.*

**Version produite : 0.25.0 · build 26.** `dist/index.html` : 161 583 →
**167 308 octets** (+5 725), SHA-256
`4195e2f572232a9ca11e60cbdd0647c219d6762ad0db3082eae6dfe43fc418f5`, 0 référence
externe. **`SAVE_VERSION` INCHANGÉE À 6** — et ce n'est pas un détail, c'est le
cœur du lot : le tutoriel n'ajoute rien à la sauvegarde.

**Suite : 338 → 348 pass / 0 fail** — dix tests ajoutés dans un fichier neuf,
deux gardes existantes reprises (voir §5), aucune retirée ni assouplie.
`audit-maquette.mjs` : **vert**.

**Vérifications appareil : NON EXÉCUTÉES.** L'écran a en revanche été **exécuté
headless** dans un talon DOM jetable, non commité : les deux états — base neuve
et deux gestes plus tard — ont été dessinés et relus. Ce n'est pas une
vérification appareil, et ça ne la remplace pas.

---

## 1. Une mission est une question posée à la base

`sim/missions.js` LIT `disposition` et `champs`, et dit si le geste décrit est
accompli. Elle n'écrit rien, ne récompense rien, ne débloque rien. Un test
photographie l'état et exige qu'il soit intact après lecture.

⚠ **Aucune progression n'est sauvegardée, et c'est délibéré.** Retenir
« mission 3 faite » créerait une **seconde source de vérité** sur ce que le
joueur a construit, alors que la première — sa base — est déjà là et ne peut
pas mentir. Deux conséquences, toutes deux assumées :

- `SAVE_VERSION` reste à **6**. Aucune migration, aucun risque pour une partie
  en cours.
- **Démolir décoche.** Un test l'asserte de face, après avoir vérifié que la
  mission était bien cochée avant — sinon il ne mesurerait pas le décochage.
  C'est honnête : le conseil redevient vrai.

## 2. La chaîne est l'ouverture MESURÉE, pas une idée de l'ouverture

| # | Mission | Ce qu'elle apprend |
|---|---|---|
| 1 | Monte ton Chantier de construction au niveau 2 | il ouvre deux emplacements, sans quoi la partie s'arrête |
| 2 | Pose un Collecteur sur un champ | c'est le champ SOUS lui qui décide de sa ressource |
| 3 | Pose une Raffinerie au contact de ton Collecteur | le voisinage fait produire, et les flèches le montrent |
| 4 | Monte ta Raffinerie au niveau 2 | la capacité double par palier — et sans capacité, la production s'arrête |
| 5 | Pose une Centrale | à partir du niveau 3, améliorer coûte de l'électricité |

C'est exactement le passage que `CLAUDE.md` §6 chiffre geste par geste, et
exactement celui où tu t'étais arrêté en croyant que rien ne produisait : un
Collecteur seul sature son stock en cinq minutes.

⚠ **La chaîne est jouée par le VRAI moteur dans le test**, pas simulée à côté :
`ameliorer`, `poser` et `demolir` de `sim/state.js`. Chaque geste coche
**exactement une** mission — le test l'exige geste par geste, pas seulement à
l'arrivée.

⚠ **Elle tient dans les emplacements qu'elle fait ouvrir** : quatre bâtiments
pour les quatre emplacements d'un Chantier de niveau 2. **C'est la garde qui
compte.** Une sixième mission demandant un cinquième bâtiment rendrait le
tutoriel **infinissable**, et rien à la relecture ne le dirait. Le test le
vérifie dans les deux sens : la chaîne tient à quatre emplacements, et elle ne
tiendrait PAS aux deux du départ — sans quoi il passerait aussi sur un tutoriel
vide.

## 3. Aucun nombre, aucun nom n'est recopié

- le niveau visé vient d'`ECONOMIE_NIVEAU.premierNiveauPayant` ;
- les noms viennent de `nom.joueur` — un test refuse **tout** nom de l'Ouvrage
  dans le tutoriel, et exige que les noms du joueur y soient (sans quoi
  l'interdiction passerait sur un texte qui ne nomme rien) ;
- le niveau où l'électricité commence à coûter se **MESURE** sur `coutDeMontee`,
  sur les onze bâtiments et non sur un seul. Mesuré : **3**, sur 527 des 539
  paliers.

## 4. L'écran coche, il ne décide pas

`ui/mission.js` demande à `sim/missions.js` ce qui est fait, et à
`missionCourante` laquelle mettre en avant. Il n'ajoute qu'une coche, une teinte
et un compte.

⚠ **Il se peint à l'ouverture, et seulement là.** Rien ne peut changer pendant
qu'on le regarde : toutes les missions portent sur ce que le joueur a POSÉ ou
AMÉLIORÉ, gestes qui se font sur l'écran de la base. Le brancher sur le
rafraîchissement à 10 Hz réécrirait cinq lignes de texte dix fois par seconde
pour rien.
**Ce n'est vrai que tant qu'aucune mission ne lit l'ÉCONOMIE** — une mission
« accumule 100 quartz » avancerait sous les yeux du joueur sans que rien ne se
redessine. Un test balaie `sim/missions.js` pour l'interdire.

⚠ **Et cette garde-là a dû être resserrée après un faux positif :** elle tombait
sur l'import de `data/economie.js`, qui est la table des **coûts** et non les
stocks du joueur. Les lignes d'import sont ôtées avant le balayage, et le test
vérifie que ce retrait n'a pas emporté le corps du fichier.

⚠ **« Tutoriel terminé », pas « 5 / 5 ».** Un compte plein se lit comme un
compteur qui pourrait encore monter.

⚠ **Aucune barre à hauteur fixe n'a été ajoutée.** L'écran défile dans
`#ecrans` comme les autres : le chrome reste à **288 px sur 320**, et la garde
de `chantier.test.js` — qui asserte la LISTE des barres fixes — n'a pas bougé.

## 5. Deux gardes existantes reprises, et pourquoi ce n'est pas un assouplissement

Les deux comptaient les onglets morts. Mission ayant cessé de l'être, le compte
tombe de 3 à 2. **Un seuil se recalcule quand une constante bouge** ; ce qui a
bougé ici est un arbitrage.

Elles ne comptent plus : elles **nomment**. `['Monde', 'Recherche']`, en
égalité. Le motif l'exigeait — l'une des deux annonçait « Recherche, Monde et
**Options** » alors qu'Options était vivant depuis le lot MISE EN PAGE : **le
message mentait déjà**, et un nombre nu ne dit pas lequel des trois vient de
bouger.

Reprise aussi, sans qu'un test le demande : `session.js` décidait quel onglet
allumer par « actif si ce n'est pas Options ». Ça allumait **« Base » sur
l'écran Mission**. C'est maintenant une table, `ONGLET_DE_L_ECRAN`, et un test
exige qu'elle couvre exactement `ECRANS`.

## 6. Falsification — neuf mutations, neuf verdicts rouges… après en avoir raté une

Une mutation à la fois, restauration par copie, **identité des sources vérifiée
à l'octet**.

| # | Mutation | Verdict |
|---|---|---|
| M1 | une mission écrit dans l'état | **ROUGE** |
| M2 | une sixième mission, un cinquième bâtiment | **ROUGE** |
| M3 | « la suivante de la dernière faite » | **ROUGE** *(après correction, voir plus bas)* |
| M4 | toutes les missions non faites mises en avant | **ROUGE** |
| M5 | le niveau visé recopié à la main | **ROUGE** |
| M6 | les noms de l'Ouvrage dans le tutoriel | **ROUGE** |
| M7 | une mission lit l'économie | **ROUGE** |
| M8 | l'onglet Mission redevient mort | **ROUGE** |
| M9 | un écran absent d'`ONGLET_DE_L_ECRAN` | **ROUGE** |

⚠ **M3 EST PASSÉE VERTE AU PREMIER ESSAI, ET ELLE A TROUVÉ UN VRAI DÉFAUT DE MON
CODE.** `lignesDeMission`, dans l'écran, refaisait le choix sur place —
`findIndex((m) => !m.faite)` — au lieu de le demander au moteur. Remplacer ce
choix par « la suivante de la dernière faite » **dans l'écran** ne faisait
tomber aucun test : celui du moteur n'interrogeait que `missionCourante`, celui
de l'écran ne comptait que les lignes.

C'était **une seconde lecture de la même règle**, exactement ce que l'en-tête du
fichier interdisait trois lignes plus haut. Le remède n'est pas un test de plus
mais **une lecture de moins** : l'écran désigne désormais la ligne dont
l'identifiant est celui que rend `missionCourante`. Le dixième test asserte
l'accord des deux, sur un montage bâti exprès pour distinguer les deux façons de
choisir — le joueur pose une Centrale **avant** sa Raffinerie.

## 7. Fichiers touchés

| Fichier | Δ | Ce qui change |
|---|---|---|
| `src/sim/missions.js` | **neuf**, 193 l. | la chaîne, les prédicats, le niveau électrique mesuré |
| `src/ui/mission.js` | **neuf**, 102 l. | l'écran : une coche, une mise en avant, un compte |
| `src/ui/session.js` | +23 −3 | quatrième écran, `ONGLET_DE_L_ECRAN`, câblage de l'onglet |
| `src/index.src.html` | +45 −1 | l'onglet vivant, l'écran, ses styles |
| `test/missions.test.js` | **neuf**, 319 l. | dix tests |
| `test/chantier.test.js` | +22 −8 | les deux gardes d'onglets morts, nommées |
| `foyer-zero-ui.html` | +4 −2 | Mission n'est plus grisée dans la maquette |
| `CLAUDE.md` | +59 −11 | §0, §2, §6 |
| `package.json` | +2 −2 | `version` et `config.build`, ensemble |

## 8. Vérifications appareil — NON EXÉCUTÉES

1. **L'onglet Mission s'ouvre** et montre cinq lignes, la première en ambre.
2. **Monter le Chantier coche la première** et met la deuxième en avant.
3. **La liste tient dans l'écran** sans pousser les onglets ni la barre du bas
   hors du cadre, y compris en écriture agrandie.
4. **Revenir sur Base puis rouvrir Mission** montre l'avancement à jour.
5. **Démolir la Centrale décoche la cinquième**, et l'en-tête repasse de
   « Tutoriel terminé » à « Mission 4 / 5 ».

## 9. Points laissés en suspens

- **Le tutoriel s'arrête où le jeu s'arrête.** Il ne parle ni de raid, ni de
  recherche, ni de carte : ces trois-là n'existent pas encore dans la partie.
  Les missions correspondantes s'ajouteront à la chaîne le jour venu — mais
  **pas sans monter le Chantier d'un palier de plus**, faute d'emplacements ; le
  test de §2 tombera pour le rappeler.
- **Aucune récompense**, comme arbitré. Le jour où un barème sera fixé, il se
  débitera dans `state.js`, pas dans les missions.
- **Recherche et Monde restent morts.** Ce sont les deux derniers onglets
  inertes, et ils se nomment maintenant dans les gardes.
