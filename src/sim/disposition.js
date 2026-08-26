// La disposition de la base du joueur — validation, voisinage typé, débits.
//
// C'est la pièce qui manquait entre `sim/champs.js` (le terrain) et le moteur
// économique (qui n'existe pas encore sous cette forme). Elle répond à trois
// questions, et à trois seulement :
//
//   1. cette disposition est-elle légale, et sinon en quoi exactement ;
//   2. combien de voisins qualifiants chaque bâtiment a-t-il, PAR TYPE ;
//   3. combien produit-il par heure, à son niveau, voisinage compris.
//
// UNE DISPOSITION est une liste de `{ id, rangee, colonne, niveau }` — la même
// forme que ce que `sim/generateur.js` produit pour un site de l'Ouvrage. Ce
// n'est pas une coïncidence : la base du joueur et une base ennemie ont la même
// géométrie (arbitré le 26/08), donc elles se décrivent pareil. Un bâtiment
// occupe UNE case ; c'est ce que fait déjà `placerBatiments` du générateur.
//
// ⚠ CE MODULE NE RETIRE RIEN ET NE CORRIGE RIEN. Il SIGNALE. « Rien ne se
// retire en silence » (CLAUDE.md §4) : quand une disposition devient illégale
// parce que le contexte a bougé — un niveau de Chantier descendu, un champ qui
// n'est plus là — c'est au joueur qu'on le dit, et c'est lui qui purge. Aucune
// fonction d'ici ne lève pour une faute de JEU ; elles ne lèvent que pour une
// faute de PROGRAMME (indice hors liste, structure absente).
//
// Aucune valeur de calibrage en dur : tout vient de data/base.js.

import {
  BASE_BATIMENTS, DEBITS, CHAMPS, VOISINAGE, EMPLACEMENTS,
  emplacementsDuNiveau, debitParHeure, debitVoisinParHeure, estDansLaBase,
} from '../data/base.js';
import { ressourceDeLaCase } from './champs.js';
import { GEOGRAPHIE } from '../data/sites.js';

/** Clé d'une case. */
function cle(rangee, colonne) {
  return `${rangee}:${colonne}`;
}

/**
 * Les huit cases qui entourent celle-ci — le 3 × 3 privé de son centre.
 * Les écarts sont dérivés de `VOISINAGE.rayon`, jamais écrits en dur : porter
 * le rayon à 2 ici suffirait à passer à un 5 × 5, sans toucher au reste.
 * @param {number} rangee
 * @param {number} colonne
 * @returns {Array<[number, number]>}
 */
export function casesVoisines(rangee, colonne) {
  const r = VOISINAGE.rayon;
  const voisines = [];
  for (let dr = -r; dr <= r; dr++) {
    for (let dc = -r; dc <= r; dc++) {
      if (dr === 0 && dc === 0) continue;
      voisines.push([rangee + dr, colonne + dc]);
    }
  }
  return voisines;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Tous les défauts d'une disposition, en clair. Liste VIDE = disposition
 * légale.
 *
 * Elle rend TOUS les défauts, pas le premier : un joueur qui a trois problèmes
 * veut les voir ensemble, pas les découvrir un par un en corrigeant. Chaque
 * entrée porte un `code` stable pour l'affichage et un `message` en français.
 *
 * @param {Array<{id: string, rangee: number, colonne: number, niveau: number}>} disposition
 * @param {{cases: Array<{rangee: number, colonne: number, ressource: string}>}} champs
 * @returns {Array<{code: string, message: string, index?: number}>}
 */
export function problemesDeDisposition(disposition, champs) {
  if (!Array.isArray(disposition)) {
    throw new TypeError('disposition : une liste est attendue');
  }
  if (!champs || !Array.isArray(champs.cases)) {
    throw new TypeError('disposition : terrain absent ou malformé');
  }
  const problemes = [];
  const ajouter = (code, message, index) => problemes.push(
    index === undefined ? { code, message } : { code, message, index },
  );

  // --- défauts par bâtiment ---
  const occupation = new Map(); // case → premier index qui l'occupe
  const comptes = new Map(); // id → nombre d'exemplaires

  disposition.forEach((b, index) => {
    const def = BASE_BATIMENTS[b.id];
    if (def === undefined) {
      ajouter('inconnu', `« ${b.id} » n'est pas un bâtiment de la base`, index);
      return;
    }
    comptes.set(b.id, (comptes.get(b.id) ?? 0) + 1);

    if (!Number.isInteger(b.niveau) || b.niveau < 1 || b.niveau > GEOGRAPHIE.niveauPlafond) {
      ajouter('niveau', `${def.nom.joueur} : niveau ${b.niveau} hors de 1…${GEOGRAPHIE.niveauPlafond}`, index);
    }

    if (!estDansLaBase(b.rangee, b.colonne)) {
      ajouter('hors-base', `${def.nom.joueur} est posé hors de la base (${b.rangee},${b.colonne})`, index);
      return; // le reste des contrôles n'a pas de sens sur une case qui n'existe pas
    }

    const c = cle(b.rangee, b.colonne);
    if (occupation.has(c)) {
      ajouter('superposition', `deux bâtiments sur la case (${b.rangee},${b.colonne})`, index);
    } else {
      occupation.set(c, index);
    }

    // Le champ : socle obligatoire pour qui a le droit d'y être, interdit aux
    // autres. Les deux sens comptent — poser une centrale sur un champ gâche
    // une case de collecteur, et il n'y en a que douze.
    const surChamp = ressourceDeLaCase(champs, b.rangee, b.colonne) !== null;
    const aLeDroit = CHAMPS.posableDessus.includes(b.id);
    if (aLeDroit && !surChamp) {
      ajouter('hors-champ', `${def.nom.joueur} doit être posé sur un champ`, index);
    }
    if (!aLeDroit && surChamp) {
      ajouter('champ-gache', `${def.nom.joueur} occupe un champ, réservé au Collecteur`, index);
    }
  });

  // --- défauts d'ensemble ---
  for (const [id, n] of comptes) {
    const def = BASE_BATIMENTS[id];
    if (def?.unique === true && n > 1) {
      ajouter('doublon', `${def.nom.joueur} est unique, ${n} exemplaires posés`);
    }
  }

  const chantiers = disposition.filter((b) => b.id === 'chantierDeConstruction');
  if (chantiers.length === 0) {
    ajouter('sans-chantier', 'aucun Chantier de construction : la base n\'existe pas');
  } else if (Number.isInteger(chantiers[0].niveau)
    && chantiers[0].niveau >= 1
    && chantiers[0].niveau <= GEOGRAPHIE.niveauPlafond) {
    // Le Chantier OCCUPE un emplacement (EMPLACEMENTS.chantierOccupeUnEmplacement),
    // donc il se compte dans le total. Ne pas le compter donnerait un
    // emplacement gratuit et rendrait la base de niveau 1 constructible à deux
    // bâtiments au lieu d'un.
    const ouverts = emplacementsDuNiveau(chantiers[0].niveau);
    const occupes = EMPLACEMENTS.chantierOccupeUnEmplacement
      ? disposition.length
      : disposition.length - chantiers.length;
    if (occupes > ouverts) {
      ajouter(
        'trop-de-batiments',
        `${occupes} bâtiments pour ${ouverts} emplacements `
          + `(Chantier niveau ${chantiers[0].niveau})`,
      );
    }
  }

  return problemes;
}

/**
 * Raccourci lisible : la disposition est-elle légale ?
 * @returns {boolean}
 */
export function dispositionValide(disposition, champs) {
  return problemesDeDisposition(disposition, champs).length === 0;
}

// ---------------------------------------------------------------------------
// Voisinage typé
// ---------------------------------------------------------------------------

/**
 * Combien de voisins qualifiants le bâtiment d'indice `index` a-t-il, par type.
 *
 * Les types qualifiants ne sont pas devinés : ce sont exactement les clés de
 * `DEBITS[id].parVoisin`. Un bâtiment qui ne tire aucun bonus rend `{}`, et
 * c'est juste — compter ses voisins ne servirait à rien.
 *
 * Deux natures de voisin, et elles ne se comptent pas au même endroit :
 *   - un type commençant par `champDe` se compte sur le TERRAIN ;
 *   - tout autre type se compte parmi les BÂTIMENTS posés.
 *
 * ⚠ AUCUN PLAFOND AUTRE QUE LA GÉOMÉTRIE. Le lot 1 plafonnait l'adjacence à
 * deux voisins (`params.adjacence.maxVoisins`) ; ce modèle-ci ne plafonne rien
 * — les huit cases du 3 × 3 comptent toutes. Confondre les deux diviserait la
 * production par quatre dans le meilleur cas.
 *
 * @param {Array<object>} disposition
 * @param {object} champs
 * @param {number} index
 * @returns {Record<string, number>}
 */
export function voisinsQualifiants(disposition, champs, index) {
  const b = disposition[index];
  if (b === undefined) {
    throw new RangeError(`disposition : indice ${index} hors de la liste`);
  }
  const parVoisin = DEBITS[b.id]?.parVoisin;
  if (parVoisin === undefined) return {};

  const voisines = casesVoisines(b.rangee, b.colonne);
  const comptes = {};

  // La carte des cases occupées se construit UNE fois, pas une par type de
  // voisin : la version d'origine la reconstruisait dans la boucle, ce qui la
  // rendait quadratique pour rien.
  const occupees = new Map(
    disposition.map((autre, i) => [cle(autre.rangee, autre.colonne), i]),
  );

  for (const type of Object.keys(parVoisin)) {
    let n = 0;
    if (type.startsWith('champDe')) {
      // `champDeScorie` → ressource « scorie ». Le nom porte la ressource, et
      // c'est voulu : une clé `champDeQuartz` marcherait sans code neuf.
      const voulue = type.slice('champDe'.length).toLowerCase();
      for (const [r, c] of voisines) {
        if (ressourceDeLaCase(champs, r, c) === voulue) n += 1;
      }
    } else {
      for (const [r, c] of voisines) {
        const i = occupees.get(cle(r, c));
        // ⚠ `i !== index` EST AUJOURD'HUI INATTEIGNABLE, et c'est mesuré : la
        // retirer ne fait tomber aucun test (falsification du 26/08). La raison
        // est que `casesVoisines` exclut le centre, donc la case du bâtiment
        // lui-même n'est jamais parcourue. Elle reste pour deux raisons : sans
        // elle, la justesse d'ici dépendrait d'une propriété écrite dans une
        // AUTRE fonction ; et il suffirait qu'un jour `DEBITS[x].parVoisin`
        // porte une clé égale à `x` — un collecteur qui paierait ses
        // collecteurs voisins — pour qu'un bâtiment se compte lui-même si la
        // géométrie changeait aussi. Garde locale, coût nul, morte pour
        // l'instant : c'est écrit pour que personne ne la « nettoie » sans
        // savoir ce qu'elle tenait.
        if (i !== undefined && i !== index && disposition[i].id === type) n += 1;
      }
    }
    comptes[type] = n;
  }
  return comptes;
}

// ---------------------------------------------------------------------------
// Débits
// ---------------------------------------------------------------------------

/**
 * Débit du bâtiment d'indice `index`, en unités PAR HEURE, voisinage compris.
 *
 * Le bonus se règle sur le niveau du bâtiment QUI PRODUIT, pas sur celui du
 * voisin — c'est déjà la règle de `debitVoisinParHeure`, on ne fait que la
 * suivre. Chaque type de voisin est arrondi UNE fois puis multiplié par son
 * compte : arrondir la somme donnerait un résultat qui dépend de l'ordre.
 *
 * @param {Array<object>} disposition
 * @param {object} champs
 * @param {number} index
 * @returns {{ total: number, propre: number, parVoisin: Record<string, number> }}
 *   `total` en unités/h, entier. `parVoisin` détaille ce que chaque type a
 *   rapporté, pour qu'un panneau puisse l'afficher sans le recalculer.
 */
export function debitDuBatiment(disposition, champs, index) {
  const b = disposition[index];
  if (b === undefined) {
    throw new RangeError(`disposition : indice ${index} hors de la liste`);
  }
  const def = DEBITS[b.id];
  if (def === undefined) {
    return { total: 0, propre: 0, parVoisin: {} };
  }

  const propre = def.propre === undefined ? 0 : debitParHeure(b.id, b.niveau);
  const comptes = voisinsQualifiants(disposition, champs, index);
  const parVoisin = {};
  let total = propre;
  for (const [type, n] of Object.entries(comptes)) {
    const apport = debitVoisinParHeure(b.id, type, b.niveau) * n;
    parVoisin[type] = apport;
    total += apport;
  }
  return { total, propre, parVoisin };
}

/**
 * Quelle ressource ce bâtiment produit-il, quand il n'en produit qu'UNE ?
 *
 * Trois cas sur quatre :
 *   - collecteur  → CE QU'IL Y A SOUS LUI. Le champ décide, arbitré le 26/08
 *                   (`CHAMPS.ressourceDonneeParLeChamp`). Un collecteur hors
 *                   champ rend `null` : il est mal posé, pas ambigu.
 *   - centrale    → électricité, et elle seule.
 *   - accumulateur→ électricité aussi : son bonus de voisinage EST de la
 *                   production, pas du stockage.
 *   - raffinerie  → `null`, mais pour une raison DIFFÉRENTE des précédentes :
 *                   elle en produit plusieurs à la fois. Passer par
 *                   `productionParRessource`, qui les sépare.
 *
 * ⚠ `null` recouvre donc deux situations qui n'ont rien à voir — « mal posé »
 * et « plusieurs à la fois ». C'est pour ça que cette fonction n'est plus le
 * point d'entrée : `productionParRessource` l'est.
 *
 * @returns {string|null} 'quartz' · 'scorie' · 'electricite' · null
 */
export function ressourceProduite(disposition, champs, index) {
  const b = disposition[index];
  if (b === undefined) {
    throw new RangeError(`disposition : indice ${index} hors de la liste`);
  }
  if (b.id === 'collecteur') {
    return ressourceDeLaCase(champs, b.rangee, b.colonne);
  }
  const def = BASE_BATIMENTS[b.id];
  if (def?.ressource === 'electricite') return 'electricite';
  return null;
}

/**
 * Ce que ce bâtiment produit, PAR RESSOURCE, en unités par heure.
 *
 * ARBITRÉ le 26/08 par Ethan, et la règle n'est pas celle qu'on croit au
 * premier regard. Ce n'est PAS « la ressource du voisin » en général : une
 * centrale qui touche trois champs de scorie ne produit pas de la scorie, elle
 * produit de l'électricité. Le discriminant est le champ `ressource` de
 * `BASE_BATIMENTS`, et c'est exactement la distinction posée le 26/08 :
 *
 *   `quartzOuScorie`  (collecteur)  → il A une ressource propre, celle du champ
 *                                     sous lui. TOUT ce qu'il produit y va,
 *                                     bonus de voisinage compris.
 *   `electricite`     (centrale,     → pareil, tout va en électricité.
 *                      accumulateur)
 *   `quartzEtScorie`  (raffinerie)   → il n'a PAS de ressource propre, et pas
 *                                     de production propre non plus. Chaque
 *                                     voisin apporte SA ressource à lui.
 *
 * L'exemple d'Ethan, mot pour mot : une raffinerie de niveau 1 entourée de deux
 * collecteurs à quartz et trois à scorie produit **144/h de quartz et 216/h de
 * scorie** — 2 × 72 et 3 × 72, séparés, jamais additionnés.
 *
 * @returns {Record<string, number>} ressource → unités/h. Objet VIDE si le
 *   bâtiment ne produit rien (le Chantier, une caserne). La clé spéciale
 *   `indetermine` recueille ce qui n'a pas pu être attribué — un voisin
 *   collecteur posé hors champ, par exemple. Elle ne devrait jamais apparaître
 *   sur une disposition valide, et sa présence est un signal, pas une valeur à
 *   sommer avec les autres.
 */
export function productionParRessource(disposition, champs, index) {
  const b = disposition[index];
  if (b === undefined) {
    throw new RangeError(`disposition : indice ${index} hors de la liste`);
  }
  const def = BASE_BATIMENTS[b.id];
  if (DEBITS[b.id] === undefined) return {};

  const debit = debitDuBatiment(disposition, champs, index);
  const production = {};
  const verser = (ressource, montant) => {
    if (montant === 0) return;
    const cle_ = ressource ?? 'indetermine';
    production[cle_] = (production[cle_] ?? 0) + montant;
  };

  // Cas 1 — le bâtiment a une ressource propre : tout y va.
  if (def?.ressource !== 'quartzEtScorie') {
    verser(ressourceProduite(disposition, champs, index), debit.total);
    return production;
  }

  // Cas 2 — pas de ressource propre : chaque voisin apporte la sienne. On
  // repasse par les voisins un par un plutôt que par les totaux de
  // `debitDuBatiment`, parce qu'un total ne dit pas QUI l'a causé.
  verser(ressourceProduite(disposition, champs, index), debit.propre);

  const parVoisin = DEBITS[b.id].parVoisin ?? {};
  const occupees = new Map(
    disposition.map((autre, i) => [cle(autre.rangee, autre.colonne), i]),
  );
  for (const [r, c] of casesVoisines(b.rangee, b.colonne)) {
    const i = occupees.get(cle(r, c));
    // `i === index` est inatteignable pour la même raison que dans
    // `voisinsQualifiants` — voir la garde commentée là-haut. Falsifié le
    // 26/08 : la retirer ne fait tomber aucun test. Elle reste pour la même
    // raison aussi : ne pas faire dépendre la justesse d'ici d'une propriété
    // écrite ailleurs.
    if (i === undefined || i === index) continue;
    const apport = parVoisin[disposition[i].id];
    if (apport === undefined) continue;
    verser(
      ressourceProduite(disposition, champs, i),
      debitVoisinParHeure(b.id, disposition[i].id, b.niveau),
    );
  }
  return production;
}
