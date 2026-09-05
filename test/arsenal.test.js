// Tests T1 à T11 du brief du lot 5A — l'Arsenal.
//
// Aucun DOM : `arsenal.js` est pur, `listeArsenal` rend des primitives, et le
// moteur se conduit à la main. Chaque seuil porte son calcul.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { defenseVide } from '../src/ui/defense.js';

import { UNITES, GRILLE } from '../src/data/combat.js';
import { POINTS_ARMEE } from '../src/data/sites.js';
import { NIVEAU } from '../src/data/niveaux.js';
import {
  arsenalVide, poser, retirer, enVagues, depuisVagues, avecNiveau, purger,
  unitesDisponibles, bilan, budgetDuNiveau, indicesDeFile,
  NB_VAGUES, NB_COLONNES, NB_EMPLACEMENTS,
} from '../src/ui/arsenal.js';
import { calculerProjection, xDeColonne, yDeRangee } from '../src/render/projection.js';
import { listeArsenal, listeAffichage, classeDe, accentDe, PALETTE, NB_PRIMITIVES } from '../src/render/scene.js';
import { creerCombat, tick, resoudre, TICKS_PAR_VAGUE } from '../src/sim/combat.js';
import { genererAssaut } from '../src/sim/generateur.js';

const VIEWPORTS = [[412, 810], [360, 640], [800, 800]];

/** Un site minimal : un bâtiment hors de portée, pour que le moteur accepte. */
const socle = (vagues) => ({
  niveau: 1,
  saveur: null,
  obstacles: [],
  batiments: [{ id: 'gangue', rangee: 18, colonne: 1 }],
  defenseurs: [],
  vagues,
  modulesDebloques: { ouvrage: { offense: [], defense: [] }, joueur: { offense: [], defense: [] } },
});

// ---------------------------------------------------------------------------
// T1 — l'alignement des colonnes
// ---------------------------------------------------------------------------

test('T1 — les neuf abscisses de l\'Arsenal sont celles du champ, sur trois viewports', () => {
  // C'EST L'INVARIANT DU LOT. La colonne où le joueur pose une unité EST le
  // couloir qu'elle empruntera : aucune unité ne change jamais de colonne
  // pendant un raid. Si cet alignement tombe, tout le reste perd son sens.
  for (const [largeur, hauteur] of VIEWPORTS) {
    const projection = calculerProjection(largeur, hauteur);
    const t = projection.tailleCase;
    const attendues = Array.from({ length: NB_COLONNES }, (_, i) => xDeColonne(projection, i + 1));

    // La MÊME unité dans les neuf colonnes, en vague 1 — soit la rangée 4 du
    // champ, où `yDeRangeeMilli(4000)` et `yDeRangee(4)` coïncident.
    let grille = arsenalVide(50);
    for (let colonne = 1; colonne <= NB_COLONNES; colonne += 1) {
      grille = poser(grille, { vague: 1, colonne, id: 'meute' });
    }
    const etat = creerCombat(socle([
      Array.from({ length: NB_COLONNES }, (_, i) => ({ id: 'meute', colonne: i + 1, rangee: 4 })),
    ]));

    // 1. Les cadres de case de l'Arsenal tombent EXACTEMENT sur xDeColonne.
    const cadres = listeArsenal(grille, projection)
      .filter((p) => p.forme === 'cadre')
      .map((p) => p.x);
    assert.equal(cadres.length, NB_VAGUES * NB_COLONNES, `${largeur}×${hauteur} : 36 cases`);
    assert.deepEqual([...new Set(cadres)].sort((a, b) => a - b), attendues,
      `${largeur}×${hauteur} : les cases de l'Arsenal ne suivent pas xDeColonne`);

    // 2. Et les FORMES tombent aux mêmes abscisses des deux côtés, colonne par
    //    colonne — pas seulement les cases, les dessins eux-mêmes.
    // La bande de la rangée 4, et elle seule : le champ porte aussi une Gangue
    // en rangée 18, qui tomberait dans le groupe de sa colonne.
    const hautRangee = yDeRangee(projection, 4);
    const parColonne = (liste) => {
      const groupes = new Map();
      for (const p of liste) {
        if (p.forme === 'texte' || p.forme === 'cadre') continue;
        const x = p.x ?? p.x1;
        const y = p.y ?? p.y1;
        if (x === undefined || y === undefined) continue;
        if (p.forme === 'rect' && p.l > t * 2) continue; // le fond
        if (y < hautRangee - t || y >= hautRangee + 2 * t) continue;
        const colonne = Math.floor((x - projection.margeX) / t) + 1;
        if (colonne < 1 || colonne > NB_COLONNES) continue;
        if (!groupes.has(colonne)) groupes.set(colonne, []);
        groupes.get(colonne).push(x);
      }
      // Une escouade émet six primitives par case : on garde les six premières,
      // le champ ajoutant ensuite ses barres de PV et de réserve.
      const sortie = new Map();
      for (const [colonne, xs] of groupes) sortie.set(colonne, xs.slice(0, NB_PRIMITIVES.escouade));
      return sortie;
    };
    const arsenalX = parColonne(listeArsenal(grille, projection));
    const champX = parColonne(listeAffichage(etat, projection));
    assert.equal(arsenalX.size, NB_COLONNES, `${largeur}×${hauteur} : neuf colonnes dessinées`);
    for (let colonne = 1; colonne <= NB_COLONNES; colonne += 1) {
      assert.deepEqual(arsenalX.get(colonne), champX.get(colonne),
        `${largeur}×${hauteur} : colonne ${colonne}, les formes ne tombent pas au même pixel`);
      assert.ok(Math.min(...arsenalX.get(colonne)) >= attendues[colonne - 1],
        `${largeur}×${hauteur} : colonne ${colonne} déborde à gauche de sa case`);
    }
  }
});

// ---------------------------------------------------------------------------
// T2 — le budget est une barrière
// ---------------------------------------------------------------------------

test('T2 — une pose qui dépasserait le budget est refusée, pas tronquée', () => {
  // Niveau 10 : budget 20 + 5 × 10 = 70. Les Grenadiers coûtent 5 points.
  // 14 × 5 = 70 pile ; le quinzième ferait 75.
  assert.equal(budgetDuNiveau(10), 70);
  assert.equal(UNITES.perceurs.points, 5);
  let etat = arsenalVide(10);
  for (let i = 0; i < 14; i += 1) {
    etat = poser(etat, { vague: Math.floor(i / NB_COLONNES) + 1, colonne: (i % NB_COLONNES) + 1, id: 'perceurs' });
  }
  const b = bilan(etat);
  assert.equal(b.pointsEngages, 70);
  assert.equal(b.pointsRestants, 0);
  assert.equal(b.emplacementsOccupes, 14);
  assert.ok(b.valide);
  assert.throws(
    () => poser(etat, { vague: 2, colonne: 6, id: 'perceurs' }),
    /75 points dépasseraient le budget de 70/,
  );
  // Et le refus n'a rien changé : l'état d'origine est intact.
  assert.equal(bilan(etat).pointsEngages, 70);

  // Niveau 1 : budget 25, cinq Meute à 5 points passent, la sixième non.
  assert.equal(budgetDuNiveau(1), 25);
  let bas = arsenalVide(1);
  for (let colonne = 1; colonne <= 5; colonne += 1) {
    bas = poser(bas, { vague: 1, colonne, id: 'meute' });
  }
  assert.equal(bilan(bas).pointsEngages, 25);
  assert.throws(() => poser(bas, { vague: 1, colonne: 6, id: 'meute' }),
    /30 points dépasseraient le budget de 25/);

  // Le budget suit bien la formule des données, à tous les niveaux.
  for (const niveau of [1, 10, 25, 40, 50]) {
    assert.equal(budgetDuNiveau(niveau),
      POINTS_ARMEE.offense.base + POINTS_ARMEE.offense.parNiveau * niveau);
  }
});

// ---------------------------------------------------------------------------
// T3 — le déblocage
// ---------------------------------------------------------------------------

test('T3 — seules les unités débloquées sont proposées, et posables', () => {
  // ⚠⚠ CE TEST A CHANGÉ DE PORTE AU LOT RECHERCHE, PAS D'INTENTION. Il
  // asserait `apparition <= niveau` ; Ethan a tranché le 30/08 que la recherche
  // SEULE ouvre les pièces. La question posée reste la même : ce que la palette
  // propose est-il exactement ce que le joueur peut poser ?
  const ouvertes = ['meute', 'perceurs', 'carapace', 'crecelle'];
  assert.deepEqual(unitesDisponibles(ouvertes), ouvertes);
  assert.deepEqual(unitesDisponibles([]), [], 'rien d\'acquis devrait tout fermer');
  assert.equal(unitesDisponibles(Object.keys(UNITES)).length, 14, 'les quatorze une fois tout acheté');
  // ⚠ `null` N'EST PAS `[]` : c'est le banc, qui monte hors partie et voit tout.
  assert.deepEqual(unitesDisponibles(null).sort(), Object.keys(UNITES).sort());

  // L'ordre rendu est celui des données, pas celui de la liste reçue : la
  // palette ne doit pas se réordonner sous le doigt entre deux achats.
  assert.deepEqual(unitesDisponibles(['crecelle', 'meute']), ['meute', 'crecelle']);

  const etat = arsenalVide(10, ouvertes);
  assert.throws(() => poser(etat, { vague: 1, colonne: 1, id: 'fendeur' }),
    /fendeur n'est pas débloquée par la recherche/);
  assert.throws(() => poser(etat, { vague: 1, colonne: 1, id: 'chimere' }),
    /unité inconnue/);
  // Et une unité ouverte passe : sans ça le refus ci-dessus pourrait venir
  // d'ailleurs.
  assert.doesNotThrow(() => poser(etat, { vague: 1, colonne: 1, id: 'meute' }));
});

// ---------------------------------------------------------------------------
// T4 — l'ordre des vagues
// ---------------------------------------------------------------------------

test('T4 — la rangée du haut est la vague 1, et une vague vide garde son rang', () => {
  let etat = arsenalVide(15);
  etat = poser(etat, { vague: 1, colonne: 2, id: 'meute' });
  etat = poser(etat, { vague: 3, colonne: 4, id: 'perceurs' });
  const vagues = enVagues(etat);

  // QUATRE vagues, toujours — la 2 laissée vide ne décale pas la 3.
  assert.equal(vagues.length, NB_VAGUES);
  assert.deepEqual(vagues, [
    [{ id: 'meute', colonne: 2, niveau: 15 }],
    [],
    [{ id: 'perceurs', colonne: 4, niveau: 15 }],
    [],
  ]);

  // Et le moteur le lit bien ainsi : la vague n apparaît au tick (n−1) × 50.
  // La vague 3 doit donc entrer au tick 100, pas au 50.
  assert.equal(TICKS_PAR_VAGUE, 50);
  const combat = creerCombat(socle(vagues));
  const presents = () => combat.entites.filter((e) => e.camp === 'attaque' && e.vivant && !e.sorti).length;
  assert.equal(presents(), 1, 'la vague 1 est là dès le départ');
  while (combat.tick < 99) tick(combat);
  assert.equal(presents(), 1, 'rien de neuf au tick 99');
  tick(combat);
  assert.equal(combat.tick, 100);
  assert.equal(presents(), 2, 'la vague 3 entre au tick 100');
  assert.ok(combat.entites.some((e) => e.id === 'perceurs' && e.camp === 'attaque'));
});

// ---------------------------------------------------------------------------
// T5 — le montage produit est valide
// ---------------------------------------------------------------------------

test('T5 — pour les 50 niveaux, ce que rend l\'Arsenal passe creerCombat', () => {
  for (let niveau = 1; niveau <= NIVEAU.plafond; niveau += 1) {
    for (const profil of ['infanterie', 'blindeLourd', 'mixte']) {
      const force = genererAssaut({ niveau, profil, graine: niveau * 3 + 1 });
      const etat = depuisVagues(force.vagues, niveau);
      const vagues = enVagues(etat);

      // Rien ne s'est perdu au passage.
      assert.equal(vagues.flat().length, force.vagues.flat().length,
        `${profil}/${niveau} : des unités ont disparu`);
      const b = bilan(etat);
      assert.equal(b.pointsEngages, force.pointsEngages, `${profil}/${niveau} : coût`);
      assert.ok(b.valide, `${profil}/${niveau} : composition invalide`);

      assert.doesNotThrow(() => creerCombat({
        ...socle(vagues), niveau,
        batiments: [{ id: 'gangue', rangee: 18, colonne: 1, niveau }],
      }), `${profil}/${niveau} : creerCombat refuse le montage`);
    }
  }
});

// ---------------------------------------------------------------------------
// T6 — aller-retour
// ---------------------------------------------------------------------------

test('T6 — enVagues puis rechargement rend un état identique', () => {
  // C'est ce qui permettra la sauvegarde plus tard sans y toucher aujourd'hui.
  let etat = arsenalVide(25);
  const poses = [
    { vague: 1, colonne: 1, id: 'meute' }, { vague: 1, colonne: 9, id: 'guetteur' },
    { vague: 2, colonne: 5, id: 'fendeur' }, { vague: 4, colonne: 3, id: 'crecelle' },
  ];
  for (const p of poses) etat = poser(etat, p);

  const recharge = depuisVagues(enVagues(etat), etat.niveau);
  assert.deepEqual(recharge, etat);
  assert.deepEqual(enVagues(recharge), enVagues(etat));

  // L'état est SÉRIALISABLE : c'est la condition de la sauvegarde.
  assert.deepEqual(JSON.parse(JSON.stringify(etat)), etat);

  // Et la grille vide fait aussi l'aller-retour.
  const vide = arsenalVide(7);
  assert.deepEqual(depuisVagues(enVagues(vide), 7), vide);
});

// ---------------------------------------------------------------------------
// T7 — l'indice de file, mesuré
// ---------------------------------------------------------------------------

/** Tick auquel l'unité `id` quitte le champ — par le haut, ou par le repli. */
function tickDeSortie(vagues, id) {
  const etat = creerCombat(socle(vagues));
  for (let t = 1; t <= 3000 && !etat.termine; t += 1) {
    tick(etat);
    const c = etat.entites.find((e) => e.id === id && e.camp === 'attaque');
    if (c !== undefined && c.sorti) return t;
  }
  return null;
}

test('T7 — une unité rapide derrière une lente perd 70 ticks, et l\'Arsenal le dit', () => {
  // ⚠ PRÉCISION SUR LE BRIEF. Le §6 parle d'« un Fendeur seul en colonne 5 [qui]
  // sort du champ au tick 257 ». Deux choses à corriger dans la formulation, les
  // NOMBRES étant justes : ce Fendeur est en vague 2 — la vague 1 partirait 50
  // ticks plus tôt et sortirait au 208 — et il ne sort pas « par le haut ». Un
  // blindé n'est pas traversant : il monte jusqu'à la dernière rangée, s'y
  // trouve inutile, et rentre à la base après 30 ticks — le repli du lot 3B.
  const seul = tickDeSortie([[], [{ id: 'fendeur', colonne: 5 }]], 'fendeur');
  const derriere = tickDeSortie(
    [[{ id: 'meute', colonne: 5 }], [{ id: 'fendeur', colonne: 5 }]], 'fendeur',
  );
  assert.equal(seul, 257);
  assert.equal(derriere, 327);
  assert.equal(derriere - seul, 70, 'sept secondes sur un plafond de quatre-vingt-dix');

  // C'est bien la COLONNE qui décide : le même Fusilier en colonne 4 ne coûte
  // rien du tout.
  assert.equal(tickDeSortie(
    [[{ id: 'meute', colonne: 4 }], [{ id: 'fendeur', colonne: 5 }]], 'fendeur',
  ), 257);

  // Et l'Arsenal signale la colonne 5, et elle seule.
  let etat = arsenalVide(15);
  etat = poser(etat, { vague: 1, colonne: 5, id: 'meute' });
  etat = poser(etat, { vague: 2, colonne: 5, id: 'fendeur' });
  etat = poser(etat, { vague: 1, colonne: 4, id: 'meute' });
  const indices = indicesDeFile(etat);
  assert.equal(indices.length, 1);
  assert.equal(indices[0].colonne, 5);
  assert.equal(indices[0].devant.id, 'meute');
  assert.equal(indices[0].devant.vague, 1);
  assert.equal(indices[0].derriere.id, 'fendeur');
  assert.equal(indices[0].derriere.vague, 2);
  assert.deepEqual(bilan(etat).indices, indices);

  // L'ordre inverse ne lève RIEN : une lente derrière une rapide ne gêne
  // personne — la rapide est déjà partie.
  let inverse = arsenalVide(15);
  inverse = poser(inverse, { vague: 1, colonne: 5, id: 'fendeur' });
  inverse = poser(inverse, { vague: 2, colonne: 5, id: 'meute' });
  assert.deepEqual(indicesDeFile(inverse), []);

  // LE CAS NÉGATIF — les aéronefs ne bloquent rien et ne sont bloqués par rien :
  // masse nulle. Un Frappeur en vague 2 sort au tick 120, seul comme derrière
  // une Crécelle, comme derrière un Fusilier.
  assert.equal(UNITES.frappeur.masse, 0);
  assert.equal(UNITES.crecelle.masse, 0);
  const frappeurSeul = tickDeSortie([[], [{ id: 'frappeur', colonne: 5 }]], 'frappeur');
  assert.equal(frappeurSeul, 120);
  assert.equal(tickDeSortie(
    [[{ id: 'crecelle', colonne: 5 }], [{ id: 'frappeur', colonne: 5 }]], 'frappeur',
  ), frappeurSeul);
  assert.equal(tickDeSortie(
    [[{ id: 'meute', colonne: 5 }], [{ id: 'frappeur', colonne: 5 }]], 'frappeur',
  ), frappeurSeul);

  // Et aucun indice n'est levé pour eux, dans les deux sens.
  let air = arsenalVide(25);
  air = poser(air, { vague: 1, colonne: 5, id: 'crecelle' });
  air = poser(air, { vague: 2, colonne: 5, id: 'frappeur' });
  assert.deepEqual(indicesDeFile(air), [], 'un aéronef derrière un aéronef');
  let mixte = arsenalVide(25);
  mixte = poser(mixte, { vague: 1, colonne: 5, id: 'meute' });
  mixte = poser(mixte, { vague: 2, colonne: 5, id: 'frappeur' });
  assert.deepEqual(indicesDeFile(mixte), [], 'un aéronef derrière un fantassin');
});

// ---------------------------------------------------------------------------
// T8 — le rendu ne diverge pas
// ---------------------------------------------------------------------------

test('T8 — les 14 unités se dessinent à l\'identique dans l\'Arsenal et sur le champ', () => {
  // Sans quoi le joueur apprendrait un vocabulaire visuel dans l'éditeur et en
  // découvrirait un autre au combat.
  const projection = calculerProjection(412, 810);
  const t = projection.tailleCase;
  const COLONNE = 5;
  const xCase = xDeColonne(projection, COLONNE);
  // La vague 1 de l'Arsenal occupe la rangée 4 du champ : à rangeeMilli 4000,
  // yDeRangeeMilli rend margeY + (18000−4000) × t / 1000 = la même ordonnée que
  // yDeRangee(4). Les deux dessins tombent donc au MÊME pixel.
  const yCase = yDeRangee(projection, 4);

  const dansLaCase = (liste) => liste.filter((p) => {
    const x = p.x ?? p.x1;
    const y = p.y ?? p.y1;
    if (x === undefined || y === undefined) return false;
    if (p.forme === 'rect' && p.l > t * 2) return false; // le fond
    if (p.forme === 'texte') return false; // les numéros de colonne
    return x >= xCase - t && x < xCase + t && y >= yCase - t && y < yCase + 2 * t;
  });

  for (const id of Object.keys(UNITES)) {
    const niveau = UNITES[id].apparition === 0 ? 1 : UNITES[id].apparition;
    const grille = poser(arsenalVide(Math.max(niveau, 1)), { vague: 1, colonne: COLONNE, id });
    const etat = creerCombat({
      ...socle([[{ id, colonne: COLONNE, rangee: 4 }]]),
      niveau: Math.max(niveau, 1),
      batiments: [{ id: 'gangue', rangee: 18, colonne: 1, niveau: Math.max(niveau, 1) }],
    });

    const classe = classeDe('unite', id);
    const nb = NB_PRIMITIVES[classe];
    // L'Arsenal pose d'abord le cadre de la case, puis la forme.
    const deLArsenal = dansLaCase(listeArsenal(grille, projection))
      .filter((p) => p.forme !== 'cadre').slice(0, nb);
    // Le champ pose la forme, puis les barres de PV et de réserve.
    const duChamp = dansLaCase(listeAffichage(etat, projection)).slice(0, nb);

    assert.equal(deLArsenal.length, nb, `${id} : ${nb} primitives attendues dans l'Arsenal`);
    assert.deepEqual(deLArsenal, duChamp, `${id} : le dessin diverge entre l'Arsenal et le champ`);

    // ⚠⚠ LA LISTE D'AFFICHAGE NE PORTE AUCUNE COULEUR D'ACCENT, DÉLIBÉRÉMENT —
    // ET CE N'EST PAS UNE PERTE D'INFORMATION. Arbitré par Ethan le 30/08, après
    // mesure : l'accent vit dans les PIXELS DU SPRITE, et
    // `test/accent.test.js` l'asserte contre `accentDe`, sprite par sprite.
    // Mesuré à la grille 64 : l'accent dominant du dessin est celui de la table
    // quatorze fois sur quatorze pour les unités entières du joueur.
    //
    // ⚠ LA PHRASE QUI ÉTAIT ICI ÉTAIT FAUSSE, et c'est elle qui a fait croire à
    // une perte : elle disait « un sprite ne porte pas de couleur : ses pixels
    // viennent de l'atlas ». La PRIMITIVE ne porte pas de couleur ; les PIXELS,
    // si — et ce sont exactement les six teintes d'accent de la fiche.
    //
    // ⚠ UN BANDEAU D'ACCENT AJOUTÉ ICI FERAIT DIRE DEUX FOIS LA MÊME CHOSE, à
    // deux endroits qui pourraient diverger. La troisième couche n'est pas
    // ouverte, et cette assertion la refuse : elle tombera si quelqu'un en
    // rajoute une sans que la décision soit reprise.
    const accent = accentDe('unite', id);
    assert.ok(accent !== null, `${id} : une unité a toujours un accent calculé`);
    assert.ok(!deLArsenal.some((p) => p.couleur === accent.clair),
      `${id} : un bandeau d'accent reparaît — l'accent vit dans les pixels du `
      + 'sprite, voir test/accent.test.js');
    assert.ok(deLArsenal.every((p) => p.forme === 'sprite'),
      `${id} : l'unité n'est pas dessinée en sprites`);
  }

  // Aucune teinte hors de FICHE-STYLE.md, sur une grille bien remplie.
  let pleine = arsenalVide(50);
  // `null` = aucun filtre de recherche : ce test-ci mesure des PIXELS, pas une
  // porte, et il lui faut les quatorze unités.
  const ids = unitesDisponibles(null);
  for (let i = 0; i < 20; i += 1) {
    pleine = poser(pleine, {
      vague: Math.floor(i / NB_COLONNES) + 1, colonne: (i % NB_COLONNES) + 1, id: ids[i % ids.length],
    });
  }
  const admises = new Set([
    ...Object.values(PALETTE).filter((v) => typeof v === 'string'),
    ...Object.values(PALETTE.accents).flatMap((a) => [a.sombre, a.clair]),
  ]);
  for (const p of listeArsenal(pleine, projection, [3, 5])) {
    if (p.couleur === undefined) continue;
    assert.ok(admises.has(p.couleur), `teinte hors palette : ${p.couleur}`);
  }
});

// ---------------------------------------------------------------------------
// T9 — le plafond de 36
// ---------------------------------------------------------------------------

test('T9 — 36 emplacements, et le 37e est refusé budget ou non', () => {
  // Niveau 50 : budget 270. Les Fusiliers coûtent 5 points, donc 36 × 5 = 180
  // et il reste 90 points que la grille ne peut plus loger. C'est la contrainte
  // structurelle du §5, consignée et non corrigée.
  assert.equal(budgetDuNiveau(50), 270);
  assert.equal(NB_EMPLACEMENTS, 36);
  let etat = arsenalVide(50);
  for (let vague = 1; vague <= NB_VAGUES; vague += 1) {
    for (let colonne = 1; colonne <= NB_COLONNES; colonne += 1) {
      etat = poser(etat, { vague, colonne, id: 'meute' });
    }
  }
  const b = bilan(etat);
  assert.equal(b.emplacementsOccupes, 36);
  assert.equal(b.emplacementsLibres, 0);
  assert.equal(b.pointsEngages, 180);
  assert.equal(b.pointsRestants, 90, 'le reliquat que la grille ne peut pas loger');
  assert.ok(b.valide);

  // Il n'y a PAS de 37e case : toute pose retombe sur une case occupée.
  for (let vague = 1; vague <= NB_VAGUES; vague += 1) {
    for (let colonne = 1; colonne <= NB_COLONNES; colonne += 1) {
      assert.throws(() => poser(etat, { vague, colonne, id: 'meute' }), /est occupée/);
    }
  }
  assert.throws(() => poser(etat, { vague: NB_VAGUES + 1, colonne: 1, id: 'meute' }),
    /vague 5 hors de 1…4/);
  assert.throws(() => poser(etat, { vague: 1, colonne: NB_COLONNES + 1, id: 'meute' }),
    /colonne 10 hors de 1…9/);

  // Le seuil à partir duquel la grille borne avant le budget : 36 × 5 = 180
  // points, atteints par le budget au niveau 32.
  assert.equal(36 * UNITES.meute.points, 180);
  assert.equal(budgetDuNiveau(32), 180);
  assert.ok(budgetDuNiveau(33) > 36 * UNITES.meute.points);

  // Retirer libère bien la case.
  const allege = retirer(etat, { vague: 2, colonne: 3 });
  assert.equal(bilan(allege).emplacementsOccupes, 35);
  assert.doesNotThrow(() => poser(allege, { vague: 2, colonne: 3, id: 'guetteur' }));
});

// ---------------------------------------------------------------------------
// Changement de niveau — §5 du brief
// ---------------------------------------------------------------------------

test('§5 — un contexte qui bouge ne retire jamais rien en silence', () => {
  // ⚠⚠ CE TEST A CHANGÉ DE DÉCLENCHEUR AU LOT RECHERCHE, PAS D'INTENTION.
  // Il partait d'un niveau qui descend sous l'apparition d'une pièce ; RIEN NE
  // SE DÉ-RECHERCHE, un achat est définitif. Ce qui reste — et ce que la garde
  // tient toujours — c'est une composition dont une pièce n'est PLUS ouverte :
  // sauvegarde trafiquée, identifiant retiré des données. Le second cas, le
  // budget qui baisse avec le Centre de commandement, est inchangé.
  let etat = arsenalVide(15, ['meute', 'fendeur']);
  etat = poser(etat, { vague: 1, colonne: 1, id: 'meute' });
  etat = poser(etat, { vague: 1, colonne: 2, id: 'fendeur' });
  assert.ok(bilan(etat).valide);

  // Le Fendeur disparaît des acquises — et il est TOUJOURS LÀ sur la grille.
  const ampute = { ...etat, acquises: ['meute'] };
  const b = bilan(ampute);
  assert.equal(b.valide, false);
  assert.deepEqual(b.verrouillees.map((v) => v.id), ['fendeur']);
  assert.equal(b.emplacementsOccupes, 2, 'rien n\'a été retiré en silence');
  assert.equal(enVagues(ampute).flat().length, 2);

  // La purge, elle, est explicite — et ne retire que ce qu'il faut.
  const purge = purger(ampute);
  assert.deepEqual(enVagues(purge).flat().map((u) => u.id), ['meute']);
  assert.ok(bilan(purge).valide);

  // ⚠ ET BAISSER LE NIVEAU NE VERROUILLE PLUS RIEN : c'est le renversement du
  // lot, et il s'asserte ici plutôt que de se supposer.
  const bas = avecNiveau(etat, 10);
  assert.deepEqual(bilan(bas).verrouillees, [],
    'un niveau qui descend referme encore des pièces');

  // Dépassement de budget seul : au niveau 50 on remplit, au niveau 1 tout
  // dépasse. La purge ramène sous le budget sans rien casser.
  let riche = arsenalVide(50, ['meute']);
  for (let colonne = 1; colonne <= 9; colonne += 1) {
    riche = poser(riche, { vague: 1, colonne, id: 'meute' });
  }
  const pauvre = avecNiveau(riche, 1);
  const bp = bilan(pauvre);
  assert.equal(bp.depassementBudget, true);
  assert.equal(bp.pointsEngages, 45);
  assert.equal(bp.budgetPoints, 25);
  assert.equal(bp.verrouillees.length, 0, 'la Meute est acquise, elle ne peut pas être verrouillée');
  const nettoye = purger(pauvre);
  assert.ok(bilan(nettoye).valide);
  assert.equal(bilan(nettoye).pointsEngages, 25);
});

// ---------------------------------------------------------------------------
// T10 — non-régression du chemin par profil
// ---------------------------------------------------------------------------

test('T10 — montageDuBanc accepte encore un nom de profil', async () => {
  const { montageDuBanc, executerRaidComplet } = await import('../src/ui/banc.js');
  // Le chemin du lot 4B, intact : `genererAssaut` n'a pas été modifié.
  const parProfil = montageDuBanc({
    type: 'camp', niveau: 15, saveur: 'richeQuartz', graine: 1, assaut: 'infanterie',
  });
  assert.equal(parProfil.assaut.profil, 'infanterie');
  assert.ok(parProfil.vagues.flat().length > 0);
  assert.doesNotThrow(() => creerCombat(parProfil));

  // Et le chemin du lot 5A rend le même montage quand on lui passe les mêmes
  // vagues — c'est la preuve que l'Arsenal ne déforme rien.
  const etat = depuisVagues(parProfil.vagues, 15);
  const parArsenal = montageDuBanc({
    type: 'camp', niveau: 15, saveur: 'richeQuartz', graine: 1, vagues: enVagues(etat),
  });
  // L'Arsenal rend TOUJOURS quatre vagues — une vague vide garde son rang, et
  // celles de queue restent. `genererAssaut` n'en rend que les non vides. Les
  // deux montages ne diffèrent donc que par ces vagues vides de fin, qui ne
  // changent rien : vérifié, le raid se conclut au même tick dans les deux cas.
  assert.equal(parArsenal.vagues.length, 4);
  assert.deepEqual(parArsenal.vagues.slice(0, parProfil.vagues.length), parProfil.vagues);
  assert.deepEqual(parArsenal.vagues.slice(parProfil.vagues.length).flat(), []);
  assert.equal(parArsenal.assaut.pointsEngages, parProfil.assaut.pointsEngages);
  assert.equal(parArsenal.assaut.profil, null, 'une composition à la main n\'a pas de profil');
  assert.equal(resoudre(creerCombat(parArsenal)).tick,
    resoudre(creerCombat(parProfil)).tick, 'les vagues vides de queue ne changent rien');

  // executerRaidComplet, que les lots antérieurs conduisent, marche toujours.
  const r = executerRaidComplet({
    type: 'camp', niveau: 15, saveur: 'richeQuartz', graine: 1, assaut: 'infanterie',
  });
  // Lot CARTE : 305 au lieu de 315. Les obstacles ne se dispersent plus que dans
  // la bande de défense, et ce raid-ci s'y épuise dix ticks plus tôt.
  //
  // ⚠ LOT ARRÊT (04/09) : 335 au lieu de 305, et le sens de l'allongement est
  // celui de la règle. Une unité ne s'arrête plus pour une tourelle : elle
  // traverse la bande de défense en tirant, arrive plus loin, et c'est devant
  // les BÂTIMENTS qu'elle s'immobilise désormais. Le raid dure trente ticks de
  // plus et perd un survivant — sept avant, six après. La cause, elle, ne bouge
  // pas : il se termine toujours faute de combattants.
  assert.equal(r.nbTicks, 335);
  assert.equal(r.cause, 'attaquants');
});

// ---------------------------------------------------------------------------
// Pureté — §10 du brief
// ---------------------------------------------------------------------------

/**
 * Retire commentaires de ligne et de bloc avant un balayage de code.
 *
 * ⚠ Indispensable, et le lot 3C l'avait déjà établi pour la même raison : un
 * garde-fou qui lit la prose interdit d'ÉCRIRE le mot qu'il proscrit. Le lot 2A
 * s'y était pris deux fois — un participe passé anodin faisait tomber le
 * balayage de src/sim/, et il avait fallu tordre les commentaires plutôt que le
 * test. On dépouille donc, et chacun peut nommer ce qu'il n'emploie pas.
 */
function sansCommentaires(texte) {
  return texte.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
}

test('§10 — arsenal.js n\'importe ni page ni surface de dessin, et ne tire aucun hasard', async () => {
  const { readFileSync } = await import('node:fs');
  const { fileURLToPath } = await import('node:url');
  const { dirname, join } = await import('node:path');
  const racine = join(dirname(fileURLToPath(import.meta.url)), '..');
  const source = sansCommentaires(readFileSync(join(racine, 'src', 'ui', 'arsenal.js'), 'utf8'));

  for (const interdit of ['document', 'window', 'canvas', 'getContext', 'Math.random', 'Date.now']) {
    assert.ok(!source.includes(interdit), `arsenal.js emploie « ${interdit} »`);
  }
  // Il n'importe que des DONNÉES, jamais de rendu ni de DOM.
  const imports = [...source.matchAll(/from '([^']+)'/g)].map((m) => m[1]);
  assert.deepEqual(imports.sort(),
    ['../data/combat.js', '../data/niveaux.js', '../data/sites.js']);

  // Et l'état est sérialisable de bout en bout.
  let etat = arsenalVide(30);
  etat = poser(etat, { vague: 2, colonne: 4, id: 'busard' });
  const copie = JSON.parse(JSON.stringify(etat));
  assert.deepEqual(copie, etat);
  assert.deepEqual(enVagues(copie), enVagues(etat));

  // Aucun Math.random dans tout src/ — l'invariant du lot 1, reconduit.
  const modules = ['ui/arsenal.js', 'ui/banc.js', 'render/scene.js', 'render/projection.js'];
  for (const module of modules) {
    const texte = sansCommentaires(readFileSync(join(racine, 'src', module), 'utf8'));
    assert.ok(!texte.includes('Math.random'), `${module} emploie Math.random`);
  }
});

test('T18 — le bâtiment fixe le PLAFOND des pièces, il ne fixe pas leur niveau', () => {
  // ⚠⚠ ETHAN, LE 03/09 : « Claude confond monter le plafond des niveaux et
  // niveau unités. » La confusion était réelle et tenait en un mot : l'éditeur
  // portait UN champ `niveau` qui servait à la fois d'argument à
  // `budgetDuNiveau` — où il désigne le NIVEAU DU BÂTIMENT de commandement — et
  // de niveau écrit sur chaque pièce posée. Deux grandeurs, un nom.
  //
  // ⚠ ET LA RÈGLE ÉTAIT DÉJÀ DANS LA DONNÉE : `POINTS_ARMEE` dit « chaque
  // budget est adossé à son bâtiment, qui fixe aussi le niveau maximal des
  // unités de son côté ». Un PLAFOND, comme le Chantier en pose un sur les
  // bâtiments. Elle n'était appliquée nulle part.

  // FALSIFIABLE : le montage doit d'abord prouver que les deux grandeurs
  // peuvent différer. Tant qu'un seul nombre les portait, tout ce qui suit
  // était vrai sans rien garder.
  const dissocie = arsenalVide(20, null, 3);
  assert.equal(dissocie.niveau, 20, 'le niveau du bâtiment ne se retient plus');
  assert.equal(dissocie.niveauDesPieces, 3, 'le niveau des pièces ne se retient plus');
  assert.notEqual(dissocie.niveau, dissocie.niveauDesPieces);

  // Le budget suit le BÂTIMENT, jamais la pièce.
  assert.equal(bilan(dissocie).budgetPoints, budgetDuNiveau(20),
    'le budget s\'est mis à suivre le niveau des pièces');

  // Et la pièce posée porte SON niveau, pas celui du bâtiment.
  const pose = poser(dissocie, { vague: 1, colonne: 1, id: 'meute' });
  const vagues = enVagues(pose);
  assert.equal(vagues[0][0].niveau, 3, 'la pièce porte encore le niveau du bâtiment');

  // ⚠ LE DÉFAUT VAUT LE PLAFOND, DONC RIEN NE BOUGE POUR LES APPELANTS. Le banc
  // règle les deux d'un curseur, et c'est ce qui a caché la confusion.
  assert.equal(arsenalVide(12).niveauDesPieces, 12, 'le défaut ne vaut plus le plafond');
  assert.equal(defenseVide(12).niveauDesPieces, 12, 'le défaut ne vaut plus le plafond');

  // LE PLAFOND MORD, des deux côtés, et le message dit lequel est lequel.
  assert.throws(() => arsenalVide(5, null, 6), /fixe le PLAFOND/,
    'une pièce au-dessus du bâtiment passe encore en offense');
  assert.throws(() => defenseVide(5, [], null, 6), /fixe le PLAFOND/,
    'une pièce au-dessus du bâtiment passe encore en défense');
  // Et l'égalité est permise : le plafond est atteint, pas dépassé.
  assert.equal(arsenalVide(5, null, 5).niveauDesPieces, 5);
});
