// Scène : état de combat + alpha → LISTE D'AFFICHAGE — lot 3A.
//
// Module PUR, le pivot de l'architecture. Il rend un tableau ordonné de
// primitives simples ({ forme, x, y, … }), calculé sans toucher au DOM : c'est
// lui qui rend le rendu testable sous node --test. canvas2d.js ne fait que
// l'exécuter — TOUTE décision de dessin se prend ici.
//
// LA RÈGLE EST CELLE DE FICHE-STYLE.md §1-3 : la forme code la classe, la
// couleur code la cible, jamais l'inverse. L'accent d'une entité est la
// couleur de sa colonne de dégâts DOMINANTE — pas de sa spécialité déclarée.
// La troisième colonne (structure en attaque, aviation en défense) n'a qu'une
// couleur pour ses deux lectures : c'est la même colonne, la règle de bascule
// de la spec §4 le dit. Aucune quatrième teinte d'accent n'existe.
//
// Aucune teinte hors de la palette de la fiche. Les tons de camp : le kaki est
// la rampe DU JOUEUR (fiche §3), et la rampe ennemie 5 tons est une dette DA
// « à définir » — en attendant, l'Ouvrage est dessiné dans la rampe MÉTAL de
// la même palette (« anodisé sombre », dit la fiche du Dard). Provisoire,
// consigné au rapport ; aucune teinte n'est inventée.

import { GRILLE, UNITES, DEFENSES, COLONNES_DEGATS } from '../data/combat.js';
import { BATIMENTS } from '../data/sites.js';
import { xDeColonne, yDeRangeeMilli, yDeRangee } from './projection.js';
import { positionInterpolee } from './interpolation.js';

// --- palette — transcription stricte de FICHE-STYLE.md §3 --------------------

export const PALETTE = {
  // Châssis kaki (5 tons) — la rampe du joueur.
  contour: '#161914',
  kakiOmbre: '#343A2C',
  kakiCorps: '#4E5742',
  kakiEclaire: '#6A7658',
  kakiLumiere: '#8C9A72',
  // Métal (3 tons) — canons, chenilles, socles ; et rampe provisoire de l'Ouvrage.
  metalSombre: '#1E2124',
  metalMoyen: '#3E454C',
  metalClair: '#68727E',
  // Accents fonctionnels : la couleur désigne ce que l'entité peut tuer.
  accents: {
    infanterie: { sombre: '#928E80', clair: '#F5F3E8' },
    vehicule: { sombre: '#8A1E17', clair: '#E43E32' },
    structureOuAviation: { sombre: '#A67018', clair: '#F5B636' },
  },
  // Divers.
  ombrePortee: 'rgba(0,0,0,0.31)',
};

/**
 * Fond de champ de bataille : la fiche ne définit AUCUNE teinte de terrain
 * (elles appartiennent au lot des sprites). Le plus sombre de la palette
 * existante — le contour de châssis — sert de fond uni PROVISOIRE.
 */
export const FOND = PALETTE.contour;

/** Aplat des cases d'obstacle : l'ombre de corps kaki, lisible sur le fond. */
export const COULEUR_OBSTACLE = PALETTE.kakiOmbre;

/** Barres : remplissage de PV en kaki lumière, de réserve en métal clair.
 * Jamais un accent — la fiche interdit d'employer une couleur d'accent pour
 * autre chose que la cible. */
export const COULEUR_BARRE_PV = PALETTE.kakiLumiere;
export const COULEUR_BARRE_RESERVE = PALETTE.metalClair;

// --- classes et accents ------------------------------------------------------

/**
 * Classe visuelle d'une entité — c'est elle que la forme code.
 * @returns {'escouade'|'blinde'|'aeronef'|'mur'|'barriere'|'tourelle'|'artillerie'|'batiment'}
 */
export function classeDe(genre, id) {
  if (genre === 'batiment') return 'batiment';
  if (genre === 'defense') return DEFENSES[id].type; // mur · barriere · tourelle · artillerie
  return UNITES[id].chassis; // escouade · blinde · aeronef
}

/**
 * Accent d'une entité : la paire de teintes de sa colonne de dégâts DOMINANTE.
 * Rend null pour une entité qui ne nuit à personne (Merlon, bâtiments) — elle
 * ne tue rien, elle ne porte aucun accent.
 *
 * Une barrière ne tire pas mais saigne ce qui la franchit, et ce saignement est
 * typé : la Ronce coûte cher à l'infanterie, la Herse aux véhicules. C'est donc
 * sa table de franchissement qui donne son accent, faute de table de tir. Les
 * deux ne coexistent jamais sur une même entité.
 * @returns {{ colonne: string, sombre: string, clair: string } | null}
 */
export function accentDe(genre, id) {
  if (genre === 'batiment') return null;
  const ligne = genre === 'defense' ? DEFENSES[id] : UNITES[id];
  const table = ligne.degats ?? ligne.degatsFranchissement ?? null;
  if (table === null) return null;
  let dominante = null;
  for (const colonne of COLONNES_DEGATS) {
    if (table[colonne] > 0 && (dominante === null || table[colonne] > table[dominante])) {
      dominante = colonne;
    }
  }
  if (dominante === null) return null;
  return { colonne: dominante, ...PALETTE.accents[dominante] };
}

/**
 * Nombre de primitives émises par entité vivante, par classe — la table que
 * T5 assied. Les barres (2 par barre) et les traits de tir (1) s'y ajoutent.
 */
export const NB_PRIMITIVES = {
  escouade: 6, //  3 figures en triangle pointe en haut × (corps + casque d'accent)
  blinde: 4, //    2 chenilles claires + caisse allongée verticalement + bandeau d'accent
  aeronef: 3, //   ombre portée décalée + corps fin + bandeau d'accent
  mur: 2, //       socle + contour net
  barriere: 3, //  socle bas + contour + cœur d'accent
  tourelle: 4, //  socle + contour + anneau d'accent + dôme rond
  artillerie: 5, // tourelle + tube rallongé vers le haut
  batiment: 2, //  carré plein pleine case + contour
};

// --- géométrie des formes ----------------------------------------------------
//
// Toutes les cotes dérivent de la taille de case t, en pixels entiers (floor),
// pour que la même scène rende les mêmes primitives à viewport égal.

const rect = (x, y, l, h, couleur) => ({ forme: 'rect', x, y, l, h, couleur });
const texte = (x, y, contenu, couleur, taille) =>
  ({ forme: 'texte', x, y, texte: contenu, couleur, taille });
const cadre = (x, y, l, h, couleur, epaisseur) => ({ forme: 'cadre', x, y, l, h, couleur, epaisseur });
const disque = (x, y, rayon, couleur) => ({ forme: 'disque', x, y, rayon, couleur });
const ligne = (x1, y1, x2, y2, couleur, epaisseur) => ({ forme: 'ligne', x1, y1, x2, y2, couleur, epaisseur });

/** Ton de corps d'un camp : kaki du joueur, métal de l'Ouvrage (provisoire). */
function corpsDe(camp) {
  return camp === 'attaque' ? PALETTE.kakiCorps : PALETTE.metalMoyen;
}

function dessinerEscouade(liste, x, y, t, camp, accent) {
  const f = Math.max(2, Math.floor((t * 28) / 100)); // côté d'une figure
  const m = Math.max(1, Math.floor(t / 10));
  const c = Math.max(1, Math.floor(f / 2)); // casque
  const corps = corpsDe(camp);
  const casque = accent ? accent.clair : corps;
  // Trois figures larges en triangle, pointe vers le haut (fiche §4).
  const figures = [
    [x + Math.floor((t - f) / 2), y + m], // pointe, en haut au centre
    [x + m, y + t - m - f], // base gauche
    [x + t - m - f, y + t - m - f], // base droite
  ];
  for (const [fx, fy] of figures) {
    liste.push(rect(fx, fy, f, f, corps));
    liste.push(rect(fx + Math.floor((f - c) / 2), fy, c, Math.max(1, Math.floor(c / 2)), casque));
  }
}

function dessinerBlinde(liste, x, y, t, camp, accent) {
  const m = Math.max(1, Math.floor(t / 10));
  const ch = Math.max(1, Math.floor((t * 15) / 100)); // chenille
  const h = t - 2 * m; // allongée VERTICALEMENT (fiche §4), pleine hauteur interne
  const bandeau = Math.max(2, Math.floor((t * 14) / 100));
  liste.push(rect(x + m, y + m, ch, h, PALETTE.metalClair)); // chenille gauche
  liste.push(rect(x + t - m - ch, y + m, ch, h, PALETTE.metalClair)); // chenille droite
  liste.push(rect(x + m + ch, y + m, t - 2 * m - 2 * ch, h, corpsDe(camp))); // caisse
  // Bandeau d'accent transversal sur la caisse, au tiers avant.
  liste.push(rect(x + m + ch, y + m + Math.floor(h / 3), t - 2 * m - 2 * ch, bandeau,
    accent ? accent.clair : corpsDe(camp)));
}

function dessinerAeronef(liste, x, y, t, camp, accent) {
  const m = Math.max(1, Math.floor(t / 10));
  const d = Math.max(2, Math.floor((t * 12) / 100)); // décalage d'ombre : le SEUL signal d'altitude
  const fw = Math.max(2, Math.floor((t * 30) / 100)); // forme fine
  const bandeau = Math.max(2, Math.floor((t * 15) / 100));
  liste.push(disque(x + Math.floor(t / 2) + d, y + Math.floor(t / 2) + d,
    Math.floor((t * 22) / 100), PALETTE.ombrePortee));
  liste.push(rect(x + Math.floor((t - fw) / 2), y + m, fw, t - 2 * m, corpsDe(camp)));
  liste.push(rect(x + Math.floor((t - fw) / 2), y + m + Math.floor((t - 2 * m) / 4), fw, bandeau,
    accent ? accent.clair : corpsDe(camp)));
}

function dessinerStructure(liste, x, y, t, classe, accent) {
  const m = Math.max(1, Math.floor(t / 10));
  if (classe === 'barriere') {
    // Basse : elle se traverse. Socle sur la moitié inférieure de la case.
    const h = Math.floor(t / 2) - 1;
    liste.push(rect(x + 1, y + t - 1 - h, t - 2, h, PALETTE.metalMoyen));
    liste.push(cadre(x + 1, y + t - 1 - h, t - 2, h, PALETTE.contour, 1));
    const c = Math.max(2, Math.floor((t * 20) / 100));
    liste.push(rect(x + Math.floor((t - c) / 2), y + t - 1 - Math.floor(h / 2) - Math.floor(c / 2),
      c, c, accent.clair));
    return;
  }
  // Socle carré bord à bord + contour net, pour mur, tourelle et artillerie.
  liste.push(rect(x + 1, y + 1, t - 2, t - 2, PALETTE.metalMoyen));
  liste.push(cadre(x + 1, y + 1, t - 2, t - 2, PALETTE.contour, 1));
  if (classe === 'mur') return; // le Merlon ne tue rien : aucun accent.
  // Anneau d'accent sur le socle (fiche §4), puis dôme rond.
  liste.push(cadre(x + m, y + m, t - 2 * m, t - 2 * m, accent.clair, 2));
  liste.push(disque(x + Math.floor(t / 2), y + Math.floor(t / 2),
    Math.floor((t * 26) / 100), PALETTE.metalSombre));
  if (classe === 'artillerie') {
    // Tube rallongé vers le haut — sans déborder de la case (marge fiche §2).
    const tw = Math.max(2, Math.floor(t / 10));
    liste.push(rect(x + Math.floor((t - tw) / 2), y + 2, tw, Math.floor(t / 2) - 2,
      PALETTE.metalClair));
  }
}

/**
 * LE dispatch de formes — un seul, pour les trois listes d'affichage.
 *
 * `listeAffichage` (le champ), `listeLegende` (les vignettes) et `listeArsenal`
 * (la composition) l'appellent toutes. C'est ce qui garantit qu'une unité se
 * dessine à l'identique partout : le joueur ne peut pas apprendre un
 * vocabulaire visuel dans l'éditeur et en découvrir un autre au combat. Aucune
 * de ces fonctions ne redéfinit ni forme ni couleur en propre.
 */
function dessinerEntite(liste, x, y, t, classe, camp, accent) {
  if (classe === 'batiment') dessinerBatiment(liste, x, y, t);
  else if (classe === 'escouade') dessinerEscouade(liste, x, y, t, camp, accent);
  else if (classe === 'blinde') dessinerBlinde(liste, x, y, t, camp, accent);
  else if (classe === 'aeronef') dessinerAeronef(liste, x, y, t, camp, accent);
  else dessinerStructure(liste, x, y, t, classe, accent);
}

function dessinerBatiment(liste, x, y, t) {
  // Carré plein, pleine case : plus grand que toute structure.
  liste.push(rect(x, y, t, t, PALETTE.metalMoyen));
  liste.push(cadre(x, y, t, t, PALETTE.contour, 1));
}

// --- la liste d'affichage ----------------------------------------------------

/** Une entité se dessine si elle est vivante et encore sur la grille. */
function visible(e) {
  return e.vivant && !e.sorti;
}

/**
 * Position affichée d'une entité : interpolée entre l'instantané pris avant le
 * dernier tick et la position courante. Une entité née après la prise —
 * indice ≥ instantane.length — se dessine sans interpolation.
 */
function rangeeAffichee(e, precedentes, alpha) {
  if (!precedentes || e.indice >= precedentes.length) return e.rangeeMilli;
  return positionInterpolee(precedentes[e.indice], e.rangeeMilli, alpha);
}

/**
 * Construit la liste d'affichage d'un état de combat.
 *
 * ORDRE DE DESSIN, stable et normatif (T5 l'assied) :
 * fond, obstacles, bâtiments, structures, unités, barres, traits de tir —
 * pour qu'une barre ne passe jamais sous une unité. À l'intérieur de chaque
 * groupe : l'ordre d'insertion des entités, stable par construction (lot 2A).
 *
 * Ne LIT que l'état ; ne le modifie jamais (T4 le prouve par sérialisation).
 *
 * @param {object} etat        État de combat du moteur (lot 2A).
 * @param {object} projection  Résultat de calculerProjection.
 * @param {number[]|null} precedentes  Instantané pris avant le dernier tick.
 * @param {number} alpha       Fraction du tick courant, en millièmes 0…1000.
 * @returns {Array<object>} primitives.
 */
export function listeAffichage(etat, projection, precedentes = null, alpha = 0) {
  const t = projection.tailleCase;
  const liste = [];

  // 1. Fond.
  liste.push(rect(0, 0, projection.largeurPx, projection.hauteurPx, FOND));

  // 2. Obstacles, en aplat sombre.
  for (const o of etat.obstacles) {
    liste.push(rect(xDeColonne(projection, o.colonne), yDeRangee(projection, o.rangee),
      t, t, COULEUR_OBSTACLE));
  }

  // Positions affichées, calculées une fois : barres et traits les réutilisent.
  const positions = new Map();
  for (const e of etat.entites) {
    if (visible(e)) positions.set(e.indice, rangeeAffichee(e, precedentes, alpha));
  }
  const xDe = (e) => xDeColonne(projection, e.colonne);
  const yDe = (e) => yDeRangeeMilli(projection, positions.get(e.indice));

  // 3. Bâtiments — 4. structures — 5. unités.
  for (const genreVoulu of ['batiment', 'defense', 'unite']) {
    for (const e of etat.entites) {
      if (!visible(e) || e.genre !== genreVoulu) continue;
      const x = xDe(e);
      const y = yDe(e);
      dessinerEntite(liste, x, y, t, classeDe(e.genre, e.id), e.camp,
        accentDe(e.genre, e.id));
    }
  }

  // 6. Barres — PV pour toute entité vivante, réserve pour les attaquants.
  //    Les PV ne s'interpolent JAMAIS : la barre dit l'état du tick, pas un
  //    glissement — une barre qui glisse ment sur l'instant de la mort.
  const bh = Math.max(2, Math.floor(t / 12));
  for (const e of etat.entites) {
    if (!visible(e)) continue;
    const x = xDe(e);
    const y = yDe(e);
    liste.push(rect(x + 1, y + 1, t - 2, bh, PALETTE.contour));
    liste.push(rect(x + 1, y + 1, Math.floor(((t - 2) * e.pvMilli) / e.pvMaxMilli), bh,
      COULEUR_BARRE_PV));
    if (e.camp === 'attaque' && e.genre === 'unite') {
      const reserveMax = UNITES[e.id].reserve;
      liste.push(rect(x + 1, y + 2 + bh, t - 2, bh, PALETTE.contour));
      liste.push(rect(x + 1, y + 2 + bh, Math.floor(((t - 2) * e.reserve) / reserveMax), bh,
        COULEUR_BARRE_RESERVE));
    }
  }

  // 7. Traits de tir : bref segment tireur → cible pour toute entité qui a
  //    tiré ce tick, dans la couleur CLAIRE de son accent — « la bouche du
  //    canon reprend la couleur claire de l'accent » (fiche §4). La cible peut
  //    être morte de ce tir : le trait se dessine quand même, vers sa case.
  const demi = Math.floor(t / 2);
  for (const e of etat.entites) {
    if (!visible(e) || !e.aTire || e.cibleIndice === null) continue;
    const cible = etat.entites[e.cibleIndice];
    const accent = accentDe(e.genre, e.id);
    // Une cible morte de ce tir n'est plus dans `positions` : le trait va
    // alors à sa dernière position brute.
    const milliCible = positions.get(cible.indice) ?? cible.rangeeMilli;
    liste.push(ligne(
      xDe(e) + demi, yDe(e) + demi,
      xDeColonne(projection, cible.colonne) + demi,
      yDeRangeeMilli(projection, milliCible) + demi,
      accent.clair, 2,
    ));
  }
  return liste;
}

// ---------------------------------------------------------------------------
// Légende
// ---------------------------------------------------------------------------
//
// La légende se dessine avec LES MÊMES primitives et LES MÊMES fonctions de
// forme que le champ de bataille, et s'exécute par le même canvas2d.executer.
// Aucune pastille recopiée à la main : c'est la seule façon qu'elle ne dérive
// pas du rendu au premier changement de palette.
//
// La liste des entrées, elle, est ÉCRITE À LA MAIN. Si elle se déduisait des
// données, elle se mettrait à jour toute seule et ne prouverait plus rien — le
// test qui la verrouille (T7) compare cette liste à l'énumération faite depuis
// UNITES, DEFENSES et BATIMENTS, et doit tomber en panne dès qu'une entité
// d'une classe ou d'un accent non présenté apparaît.

/** Libellé de chaque classe visuelle. */
export const NOMS_CLASSE = {
  escouade: 'Escouade',
  blinde: 'Blindé',
  aeronef: 'Aéronef',
  mur: 'Mur',
  barriere: 'Barrière',
  tourelle: 'Tourelle',
  artillerie: 'Artillerie',
  batiment: 'Bâtiment',
};

/** Libellé de chaque colonne d'accent — ce que l'entité peut tuer. */
export const NOMS_ACCENT = {
  infanterie: 'anti-infanterie',
  vehicule: 'anti-véhicule',
  structureOuAviation: 'anti-structure / aérien',
  aucun: 'ne tue rien',
};

/**
 * Les 19 couples (classe, accent) que la scène peut produire, un par entrée.
 * `accent: null` pour ce qui ne tue rien — le Merlon et les bâtiments.
 */
export const ENTREES_LEGENDE = [
  { classe: 'escouade', accent: 'infanterie' },
  { classe: 'escouade', accent: 'vehicule' },
  { classe: 'escouade', accent: 'structureOuAviation' },
  { classe: 'blinde', accent: 'infanterie' },
  { classe: 'blinde', accent: 'vehicule' },
  { classe: 'blinde', accent: 'structureOuAviation' },
  { classe: 'aeronef', accent: 'infanterie' },
  { classe: 'aeronef', accent: 'vehicule' },
  { classe: 'aeronef', accent: 'structureOuAviation' },
  { classe: 'mur', accent: null },
  { classe: 'barriere', accent: 'infanterie' },
  { classe: 'barriere', accent: 'vehicule' },
  { classe: 'tourelle', accent: 'infanterie' },
  { classe: 'tourelle', accent: 'vehicule' },
  { classe: 'tourelle', accent: 'structureOuAviation' },
  { classe: 'artillerie', accent: 'infanterie' },
  { classe: 'artillerie', accent: 'vehicule' },
  { classe: 'artillerie', accent: 'structureOuAviation' },
  { classe: 'batiment', accent: null },
];

/** Dessine une entité de classe et d'accent donnés, comme sur le champ. */
function dessinerVignette(liste, x, y, t, classe, camp, colonneAccent) {
  const accent = colonneAccent === null ? null
    : { colonne: colonneAccent, ...PALETTE.accents[colonneAccent] };
  dessinerEntite(liste, x, y, t, classe, camp, accent);
}

/**
 * Liste d'affichage de la légende. Elle occupe tout le canvas : le banc est en
 * pause pendant qu'elle est ouverte, personne ne regarde le combat.
 *
 * @param {object} projection Résultat de calculerProjection.
 * @returns {Array<object>} primitives, exécutables par canvas2d.executer.
 */
export function listeLegende(projection) {
  const { largeurPx, hauteurPx } = projection;
  const liste = [rect(0, 0, largeurPx, hauteurPx, FOND)];

  // Une vignette par ligne, la hauteur de canvas répartie sur les 19 couples,
  // les 2 camps, les 4 divers et les 4 titres — 29 lignes en tout.
  const lignes = ENTREES_LEGENDE.length + 2 + 4 + 4;
  const pas = Math.max(12, Math.floor((hauteurPx - 8) / lignes));
  const t = Math.max(8, pas - 4);
  const marge = Math.max(4, Math.floor(largeurPx / 40));
  const taillePolice = Math.max(9, Math.min(13, Math.floor(t * 0.55)));
  const xLibelle = marge + t + marge;
  let y = 4;

  const titre = (contenu) => {
    liste.push(texte(marge, y + Math.floor(pas / 2), contenu, PALETTE.kakiLumiere,
      Math.max(10, taillePolice + 1)));
    y += pas;
  };
  const ligneVignette = (dessin, libelle) => {
    dessin(y);
    liste.push(texte(xLibelle, y + Math.floor(t / 2), libelle, PALETTE.metalClair, taillePolice));
    y += pas;
  };

  titre('LA FORME DIT LA CLASSE, LA COULEUR DIT LA CIBLE');
  for (const entree of ENTREES_LEGENDE) {
    const libelle = `${NOMS_CLASSE[entree.classe]} · ${NOMS_ACCENT[entree.accent ?? 'aucun']}`;
    ligneVignette(
      (yv) => dessinerVignette(liste, marge, yv, t, entree.classe, 'attaque', entree.accent),
      libelle,
    );
  }

  titre('LE CAMP SE LIT AU TON DU CHÂSSIS');
  for (const [camp, libelle] of [['attaque', 'Vous — châssis kaki'], ['defense', 'L\'Ouvrage — métal sombre']]) {
    ligneVignette(
      (yv) => dessinerVignette(liste, marge, yv, t, 'blinde', camp, 'vehicule'),
      libelle,
    );
  }

  titre('LE RESTE');
  const bh = Math.max(2, Math.floor(t / 6));
  ligneVignette(
    (yv) => liste.push(rect(marge, yv, t, t, COULEUR_OBSTACLE)),
    'Obstacle — vitesse divisée par 2,5',
  );
  ligneVignette((yv) => {
    liste.push(rect(marge, yv + Math.floor(t / 2) - bh, t, bh, PALETTE.contour));
    liste.push(rect(marge, yv + Math.floor(t / 2) - bh, Math.floor((t * 2) / 3), bh, COULEUR_BARRE_PV));
  }, 'Barre de PV — au-dessus de chaque entité');
  ligneVignette((yv) => {
    liste.push(rect(marge, yv + Math.floor(t / 2) - bh, t, bh, PALETTE.contour));
    liste.push(rect(marge, yv + Math.floor(t / 2) - bh, Math.floor(t / 3), bh, COULEUR_BARRE_RESERVE));
  }, 'Barre de réserve — munitions restantes');
  ligneVignette(
    (yv) => liste.push(ligne(marge, yv + t, marge + t, yv, PALETTE.accents.vehicule.clair, 2)),
    'Trait de tir — dans la couleur de la cible',
  );

  titre('Toucher une case pour identifier son occupant.');
  return liste;
}

// --- l'Arsenal — lot 5A ------------------------------------------------------

/**
 * Liste d'affichage de l'Arsenal : la grille 4 × 9 de composition.
 *
 * ⚠ L'INVARIANT DU LOT. Les abscisses viennent de `xDeColonne`, les ordonnées
 * de `yDeRangee` — les MÊMES que le champ de bataille. La colonne de l'Arsenal
 * est donc la colonne du champ AU PIXEL PRÈS, et rien ici ne recalcule une
 * abscisse.
 *
 * Le bloc occupe les quatre rangées BASSES du champ, là où l'assaut se déploie.
 * La vague 1 — celle qui part la première — est la rangée du HAUT du bloc,
 * c'est-à-dire la rangée 4 du champ ; la vague 4 est la rangée 1. La file
 * avance vers le haut, comme tout le reste du jeu.
 *
 * @param {{cases: Array<Array<string|null>>}} grille État de `arsenal.js`.
 * @param {object} projection Résultat de calculerProjection.
 * @param {number[]} colonnesEnFile Colonnes portant un indice de file (§6).
 * @returns {Array<object>} primitives, exécutables par canvas2d.executer.
 */
export function listeArsenal(grille, projection, colonnesEnFile = []) {
  const t = projection.tailleCase;
  const nbVagues = grille.cases.length;
  const liste = [rect(0, 0, projection.largeurPx, projection.hauteurPx, FOND)];
  const taillePolice = Math.max(9, Math.min(14, Math.floor(t * 0.4)));

  // Numéros de colonne, juste au-dessus du bloc : ils disent au joueur que la
  // colonne 5 de l'Arsenal est la colonne 5 du champ.
  const yEntete = yDeRangee(projection, nbVagues + 1) + t - Math.floor(t / 4);
  for (let colonne = 1; colonne <= GRILLE.largeur; colonne += 1) {
    liste.push(texte(
      xDeColonne(projection, colonne) + Math.floor(t / 2) - Math.floor(taillePolice / 3),
      yEntete, String(colonne), PALETTE.metalClair, taillePolice,
    ));
  }

  // Marquage de la file : une barre fine au-dessus de la colonne concernée,
  // dans le kaki lumière de l'interface. Aucune teinte neuve, aucun accent —
  // les accents disent ce qu'une entité peut tuer, jamais un avertissement.
  const epaisseur = Math.max(2, Math.floor(t / 10));
  for (const colonne of colonnesEnFile) {
    liste.push(rect(xDeColonne(projection, colonne), yEntete + Math.floor(taillePolice / 2),
      t, epaisseur, PALETTE.kakiLumiere));
  }

  // Les quatre rangées, vague 1 en haut.
  for (let indice = 0; indice < nbVagues; indice += 1) {
    const rangee = nbVagues - indice;
    const y = yDeRangee(projection, rangee);
    for (let colonne = 1; colonne <= grille.cases[indice].length; colonne += 1) {
      const x = xDeColonne(projection, colonne);
      liste.push(cadre(x, y, t, t, PALETTE.kakiOmbre, 1));
      const id = grille.cases[indice][colonne - 1];
      if (id === null) continue;
      dessinerEntite(liste, x, y, t, classeDe('unite', id), 'attaque', accentDe('unite', id));
    }
  }
  return liste;
}

// --- l'écran de Défense — lot 5C ---------------------------------------------

/**
 * Liste d'affichage de l'écran de Défense : la grille 8 × 9 de la garnison.
 *
 * ⚠ ELLE NE SE DÉDUIT PAS DE `listeArsenal`, et trois différences l'imposent :
 *
 *  1. **Les rangées montent.** L'Arsenal calcule `nbVagues - indice` et occupe
 *     les rangées 4 à 1, les plus basses. Ici `cases[0]` est la rangée 3, la
 *     plus AVANCÉE — celle que l'assaut rencontre en premier —, d'où
 *     `rangee = PREMIERE_RANGEE + indice`, dans l'autre sens.
 *  2. **Le genre n'est pas connu d'avance.** L'Arsenal ne porte que des UNITES.
 *     La garnison porte des DEFENSES *et* des UNITES à rôle défensif : le genre
 *     se déduit de l'identifiant, comme le fait `ligne(id)` dans `defense.js`.
 *  3. **Le camp est la défense.** L'Arsenal dessine en `'attaque'`, châssis
 *     kaki ; une garnison se dessine en `'defense'`.
 *
 * L'en-tête de colonnes, lui, est repris à l'identique : la colonne 5 de
 * l'éditeur est la colonne 5 du champ, des deux côtés.
 *
 * @param {{cases: Array<Array<string|null>>}} grille État de `defense.js`.
 * @param {object} projection Résultat de calculerProjection.
 * @param {Array<{rangee: number, colonne: number}>} casesMarquees Sortie
 *   d'`indicesDeCouverture` — l'indice désigne une PIÈCE, pas un couloir, donc
 *   le marquage est par case et non par colonne.
 * @returns {Array<object>} primitives, exécutables par canvas2d.executer.
 */
export function listeDefense(grille, projection, casesMarquees = []) {
  const t = projection.tailleCase;
  const premiereRangee = GRILLE.bandes.defense.premiere;
  const nbRangees = grille.cases.length;
  const liste = [rect(0, 0, projection.largeurPx, projection.hauteurPx, FOND)];
  const taillePolice = Math.max(9, Math.min(14, Math.floor(t * 0.4)));

  // Numéros de colonne, juste au-dessus de la bande — même repère que l'Arsenal.
  const yEntete = yDeRangee(projection, premiereRangee + nbRangees) - Math.floor(t / 4);
  for (let colonne = 1; colonne <= GRILLE.largeur; colonne += 1) {
    liste.push(texte(
      xDeColonne(projection, colonne) + Math.floor(t / 2) - Math.floor(taillePolice / 3),
      yEntete, String(colonne), PALETTE.metalClair, taillePolice,
    ));
  }

  // Les huit rangées, la 3 en bas de l'écran comme sur le champ — l'assaut
  // monte, et la grille se lit dans le sens où il la traverse.
  for (let indice = 0; indice < nbRangees; indice += 1) {
    const rangee = premiereRangee + indice;
    const y = yDeRangee(projection, rangee);
    for (let colonne = 1; colonne <= grille.cases[indice].length; colonne += 1) {
      const x = xDeColonne(projection, colonne);
      liste.push(cadre(x, y, t, t, PALETTE.kakiOmbre, 1));
      const id = grille.cases[indice][colonne - 1];
      if (id === null) continue;
      const genre = DEFENSES[id] !== undefined ? 'defense' : 'unite';
      dessinerEntite(liste, x, y, t, classeDe(genre, id), 'defense', accentDe(genre, id));
    }
  }

  // Marquage de l'engagement réduit : une barre fine au bas de la CASE, dans le
  // kaki lumière de l'interface. Aucune teinte neuve, aucun accent — les accents
  // disent ce qu'une entité peut tuer, jamais un avertissement. Posée en
  // dernier, elle reste lisible par-dessus le socle d'une structure.
  const epaisseur = Math.max(2, Math.floor(t / 10));
  for (const c of casesMarquees) {
    liste.push(rect(xDeColonne(projection, c.colonne),
      yDeRangee(projection, c.rangee) + t - epaisseur, t, epaisseur, PALETTE.kakiLumiere));
  }
  return liste;
}
