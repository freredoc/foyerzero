// Le générateur des témoins de coûts — il écrit `test/temoins-couts.js`.
//
// ⚠⚠ IL IMPORTE `montantDuPalier`, IL NE LA RECOPIE PAS. Un générateur qui
// réimplémenterait la formule ne testerait plus rien : le témoin dirait
// seulement que deux écritures de la même idée s'accordent, ce qui est vrai
// même quand les deux sont fausses. Ce qu'on veut figer, c'est la SORTIE du
// code livré, palier par palier, pour qu'un ratio déplacé se voie dans un diff
// au lieu de se lire comme un rééquilibrage.
//
// ⚠⚠ ET LA TABLE VIT DANS `test/`, PAS DANS `dist/`. Ethan a demandé le 05/09
// qu'il n'y ait aucun écart entre ce qui est voulu et ce qui est joué, et que
// le jeu lise des entiers pré-calculés. La formule à arrondi UNIQUE rend
// exactement les mêmes entiers qu'une table pré-calculée — c'est précisément ce
// qui la rend sûre —, donc embarquer la table dans le livrable coûterait des
// dizaines de kilo-octets pour zéro nombre différent. Elle est donc figée là où
// elle sert : dans les tests, sur le modèle de `test/temoins-combat.js`.
//
//   node tools/generer-temoins-couts.mjs
//
// ⚠ IL ÉCRIT, DONC IL NE SE LANCE PAS TOUT SEUL. Le jour où quelqu'un touche un
// ratio, une ancre ou un arrondi, le diff des témoins montre EXACTEMENT quels
// prix bougent, et il faut le vouloir pour les régénérer.

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { NIVEAU } from '../src/data/niveaux.js';
import { ECONOMIE_NIVEAU, montantDuPalier } from '../src/data/economie.js';
import { BASE_BATIMENTS, COUT_NIVEAU_DEUX, COEFFICIENT_DE_REGIME } from '../src/data/base.js';
import {
  COUT_NIVEAU_DEUX_OFFENSE, COUT_NIVEAU_DEUX_DEFENSE, RAPPORT_COEFFICIENT_OFFENSE,
} from '../src/data/couts-militaires.js';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');
const PREMIER = ECONOMIE_NIVEAU.premierNiveauPayant;

/**
 * Les quarante-deux entités, avec leur ancre d'accueil et leur coefficient de
 * régime. C'est la SEULE chose que ce fichier compose ; les deux nombres se
 * lisent dans les tables, ils ne s'écrivent pas ici.
 */
export function entitesDuBareme() {
  const lignes = [];
  for (const [id, ancre] of Object.entries(COUT_NIVEAU_DEUX_OFFENSE)) {
    lignes.push([`offense/${id}`, ancre, ancre * RAPPORT_COEFFICIENT_OFFENSE]);
  }
  for (const [id, ligne] of Object.entries(COUT_NIVEAU_DEUX_DEFENSE)) {
    // Le coefficient de la défense EST son ancre — facteur 1, aucun
    // redressement. Choix conservateur du 05/09, voir `couts-militaires.js`.
    lignes.push([`defense/${id}`, ligne.montant, ligne.montant]);
  }
  for (const id of Object.keys(BASE_BATIMENTS)) {
    lignes.push([`batiment/${id}`, COUT_NIVEAU_DEUX[BASE_BATIMENTS[id].classeDeCout],
      COEFFICIENT_DE_REGIME[id]]);
  }
  return lignes;
}

function composer() {
  const entetes = [
    '// LES QUARANTE-DEUX BARÈMES, PALIER PAR PALIER — ce n\'est pas un test,',
    '// c\'est sa RÉFÉRENCE. Écrit par `tools/generer-temoins-couts.mjs`, jamais à',
    '// la main.',
    '//',
    '// ⚠⚠ ETHAN A DEMANDÉ LE 05/09 QU\'IL N\'Y AIT AUCUN ÉCART ENTRE CE QUI EST',
    '// VOULU ET CE QUI EST JOUÉ, et que le jeu lise des entiers pré-calculés. La',
    '// formule à arrondi unique rend exactement les mêmes entiers qu\'une table',
    '// pré-calculée ; cette table-ci est donc la PREUVE de cette égalité, pas une',
    '// seconde implémentation. Elle est dans `test/` et non dans `dist/` : le',
    '// livrable n\'y gagnerait pas un nombre différent, et y perdrait des',
    '// dizaines de kilo-octets.',
    '//',
    '// ⚠ ELLE NE SE RAFRAÎCHIT PAS TOUTE SEULE. Le jour où un ratio, une ancre ou',
    '// un arrondi bouge, le diff de ce fichier dit EXACTEMENT quels prix ont',
    '// changé — et il faut le vouloir pour le régénérer.',
    '//',
    `// Colonnes : famille/clé · ancre · coefficient · les ${NIVEAU.plafond - PREMIER + 1}`,
    `// paliers, du niveau ${PREMIER} au niveau ${NIVEAU.plafond}, dans la ressource principale.`,
    'export const TEMOINS_COUTS = [',
  ];
  const corps = entitesDuBareme().map(([nom, ancre, coefficient]) => {
    const paliers = [];
    for (let n = PREMIER; n <= NIVEAU.plafond; n += 1) {
      paliers.push(montantDuPalier(ancre, coefficient, n));
    }
    return `  ["${nom}",${ancre},${coefficient},${paliers.join(',')}],`;
  });
  return `${[...entetes, ...corps, '];'].join('\n')}\n`;
}

const sortie = join(RACINE, 'test', 'temoins-couts.js');
writeFileSync(sortie, composer());
process.stderr.write(`${entitesDuBareme().length} entités × `
  + `${NIVEAU.plafond - PREMIER + 1} paliers → ${sortie}\n`);
