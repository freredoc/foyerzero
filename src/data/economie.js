// Courbe économique des coûts et de la production — transcription figée.
//
// SOURCE : arbitrages d'Ethan du 25/08/2026, onglet EFFETS du classeur
// FOYER-ZERO-BATIMENTS-JOUEUR.xlsx.
//
// POURQUOI CE FICHIER EXISTE. Jusqu'ici `NIVEAU.penteHaute` de niveaux.js
// servait DEUX grandeurs : la mise à l'échelle du combat ET la pente des coûts
// de montée. Elles valaient 1,32 toutes les deux, donc la confusion ne coûtait
// rien et ne se voyait pas. Elles divergent maintenant — le combat passe à une
// pente unique de 1,1, l'économie reste à 1,32 — et une constante ne peut plus
// porter les deux. CLAUDE.md §4 : une table fait foi par grandeur. Séparer les
// fichiers rend la distinction structurelle plutôt que déclarative.

export const ECONOMIE_NIVEAU = {
  // Le niveau 1 est gratuit pour tout bâtiment. Le premier coût est celui du
  // niveau 2, et il dépend de la classe du bâtiment — voir BASE.classeDeCout.
  premierNiveauPayant: 2,

  // Ratios de coût, du niveau (index + 2) vers le suivant. Dix valeurs, puis
  // la pente stable. Ils ne sont PAS ronds : ils restituent une table relevée.
  //   8 → 10 → 20 → 80 → 440 → 1 440 → 4 400 → 12 800 → 35 200 → 89 600 → 192 000
  ratios: [
    1.25, // 2 → 3
    2, // 3 → 4
    4, // 4 → 5
    5.5, // 5 → 6
    36 / 11, // 6 → 7    ≈ 3,2727
    55 / 18, // 7 → 8    ≈ 3,0556
    32 / 11, // 8 → 9    ≈ 2,9091
    2.75, // 9 → 10
    28 / 11, // 10 → 11  ≈ 2,5455
    15 / 7, // 11 → 12   ≈ 2,1429
  ],

  // Au-delà du douzième niveau, une pente unique. C'est l'ancienne
  // `NIVEAU.penteHaute`, désormais chez elle.
  penteStable: 1.32,

  // Production d'un bâtiment : × 1,25 par niveau, sans rupture, sur les
  // cinquante niveaux. Volontairement plus plate que la pente des coûts : sur
  // les 38 niveaux qui séparent 12 de 50, une amélioration finit par coûter
  // 7,9 fois plus d'heures de production qu'au départ. Le jeu pousse donc vers
  // le raid, dont le butin suit la pente des coûts, et non vers l'attente.
  penteProduction: 1.25,
};

// ---------------------------------------------------------------------------
// La rampe elle-même — une seule implémentation, pour deux familles de coûts
// ---------------------------------------------------------------------------
//
// ⚠ CETTE BOUCLE VIVAIT DANS `data/base.js`, EN PRIVÉ, ET ELLE Y ÉTAIT SEULE.
// Elle est remontée ici le 28/08 quand la défense et l'offense ont reçu leurs
// ancres : la recopier à côté aurait fait DEUX implémentations de la même
// rampe, et la première divergence — un arrondi déplacé, un rang décalé — se
// serait lue comme un déséquilibre de jeu, pas comme un défaut de programme.
//
// ⚠⚠ UNE ENTITÉ A DEUX NOMBRES, ET LE DÉPÔT N'EN PORTAIT QU'UN — 05/09/2026.
// `RELEVE-TA-COURBES-2.md` §0 le disait sans qu'on en tire la conséquence :
// « passer la Caserne de 1 à 2 coûte 5 unités de tibérium là où la courbe
// extrapolée en réclamerait 8 966 ; tout ce qui précède le niveau 11 relève de
// l'accueil du joueur et NE SE MODÉLISE PAS ». Les dix premiers niveaux sont
// une remise pédagogique posée à la main ; le régime commence au niveau 12 et
// monte de 1,32. Une entité porte donc :
//   — son PRIX D'ACCUEIL, le coût du niveau 2, dicté entité par entité ;
//   — son COEFFICIENT DE RÉGIME, qui commande sa courbe haute.
// Les deux ne coïncident que pour le Chantier de construction, et c'est
// exactement sur lui que `ratios` avait été calée. Mesuré : toutes les autres
// entités étaient mal prixées en fin de partie, jusqu'à 50 %.
//
// ⚠⚠ LE REDRESSEMENT EST UNE SEULE FORMULE, PAS DEUX BRANCHES.
//
//     facteur    = coefficient / ancre
//     montant(n) = round( ancre × PROFIL(n) × facteur ^ ( min(n − 2, 10) / 10 ) )
//
// Le plafond `min(n − 2, 10)` est le CŒUR de la formule, pas une protection.
// Sans lui, le redressement continuerait au-delà du niveau 12 et rendrait
// `coefficient² / ancre × 24 000` au lieu de `coefficient × 24 000`. Avec lui,
// les deux zones se raccordent EXACTEMENT : au niveau 12, `facteur^1` rend
// `ancre × 24 000 × coefficient / ancre`, soit `coefficient × 24 000`, qui est
// la mesure du relevé. Un test le vérifie sur les quarante-deux entités.
//
// ⚠ NI LE 2 NI LE 10 NE SONT ÉCRITS EN DUR ci-dessous : le premier est
// `premierNiveauPayant`, le second `ratios.length`. Les recopier ferait deux
// vérités sur la longueur de la zone d'accueil, et la première divergence se
// lirait comme un déséquilibre.
//
// ⚠⚠ L'ARRONDI EST UNIQUE, EN SORTIE, ET LE COMMENTAIRE QUI DISAIT LE CONTRAIRE
// ÉTAIT FAUX. Il affirmait : « les ratios ne sont pas ronds et le produit
// flottant rate la table relevée — 440 × 36/11 rend 1 439,999 999 999 999 8.
// Arrondir une seule fois à la fin ferait diverger la chaîne dès le sixième
// palier. » MESURÉ : cette erreur vaut 1e-10, `Math.round` l'absorbe, et la
// rampe de référence est restituée à l'identique — 8 · 10 · 20 · 80 · 440 ·
// 1 440 · 4 400 · 12 800 · 35 200 · 89 600 · 192 000.
//
// ⚠⚠ CE QUI REND L'ARRONDI UNIQUE NÉCESSAIRE EST L'INVERSE DE CE QU'ON CROYAIT :
// l'arrondi PAR PALIER se compose, et il détruit les proportions des petites
// ancres. Mesuré sur le code d'avant : l'ancre 1 rendait au niveau 10 le TIERS
// de l'ancre 2, là où le relevé dit la MOITIÉ — un Escadron de tireurs à 1 est
// remonté par neuf arrondis successifs, chacun tirant vers le haut. Une seule
// division du même nombre garde le rapport exact.

/**
 * Le PROFIL de la courbe au niveau donné : le produit des ratios, du niveau 2
 * au niveau `niveau`, SANS AUCUN ARRONDI.
 *
 * C'est la forme de la rampe, dépouillée de son ancre — `PROFIL(2)` vaut 1 par
 * construction, `PROFIL(12)` vaut 24 000, et au-delà chaque niveau multiplie
 * par `penteStable`.
 *
 * ⚠ IL EST EXPORTÉ POUR QUE PERSONNE NE LE RECOPIE. Les tests et le générateur
 * de témoins en ont besoin ; une seconde boucle à côté serait une seconde
 * vérité sur la forme de la courbe, et c'est précisément ce que le retour de la
 * rampe dans ce fichier, le 28/08, était venu empêcher.
 *
 * ⚠ LA MAJUSCULE SUIT LE NOM DE LA GRANDEUR, pas la convention des fonctions du
 * dépôt : `PROFIL` est le nom que le relevé et le rapport lui donnent, et le
 * lecteur qui cherche « profil » dans l'un doit tomber sur l'autre.
 *
 * @param {number} niveau le niveau ATTEINT, ≥ `premierNiveauPayant`
 * @returns {number} réel, jamais arrondi
 */
export function PROFIL(niveau) {
  const { ratios, penteStable, premierNiveauPayant } = ECONOMIE_NIVEAU;
  let profil = 1;
  for (let n = premierNiveauPayant + 1; n <= niveau; n++) {
    const rang = n - premierNiveauPayant - 1;
    profil *= rang < ratios.length ? ratios[rang] : penteStable;
  }
  return profil;
}

/**
 * Le montant d'un palier, dans l'unité de la ressource principale, hors
 * électricité. C'est l'ancre d'accueil, prolongée par la courbe et redressée
 * pour atterrir sur le coefficient de régime au niveau 12.
 *
 * ⚠ L'ARGUMENT EST LE NIVEAU QU'ON ATTEINT, PAS CELUI D'OÙ L'ON PART.
 * `montantDuPalier(8, 8, 2)` vaut 8 — le prix du passage de 1 à 2. Au niveau 2
 * le profil vaut 1 et l'exposant zéro : l'ancre EST le premier palier, quelle
 * que soit la valeur du coefficient.
 *
 * ⚠ L'ANCRE PEUT ÊTRE FRACTIONNAIRE, et c'est voulu : l'Escadron
 * lance-missiles vaut 1,6 et s'affiche 2 parce que la sortie est arrondie. La
 * table dictée le 28/08 portait ces arrondis ; le relevé du 05/09 a rendu les
 * fractions, et les deux se rejoignent au niveau 2.
 *
 * Aucune borne n'est vérifiée ici — c'est le rôle de l'appelant, qui seul sait
 * à quelle table appartient l'entité et donc quel plafond lui opposer.
 *
 * @param {number} ancre le coût du niveau 2, entier ou fractionnaire
 * @param {number} coefficient le coefficient de régime de l'entité
 * @param {number} niveau le niveau ATTEINT, ≥ `premierNiveauPayant`
 * @returns {number} entier
 */
export function montantDuPalier(ancre, coefficient, niveau) {
  const { ratios, premierNiveauPayant } = ECONOMIE_NIVEAU;
  const facteur = coefficient / ancre;
  const paliersRedresses = Math.min(niveau - premierNiveauPayant, ratios.length);
  return Math.round(ancre * PROFIL(niveau) * facteur ** (paliersRedresses / ratios.length));
}
