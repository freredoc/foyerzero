// Lot ÉTAT-EN-RAID — deux défauts vus par Ethan sur une partie réelle le 08/09,
// après le lot BÂTIMENTS-QUATRE-ÉTATS : « les bâtiments d'un raid restent tout
// neufs quels que soient leurs PV », et « un bâtiment détruit laisse la ruine
// générique du camp au lieu de sa propre planche ».
//
// ⚠⚠ LES DEUX DÉFAUTS ÉTAIENT DU CÂBLAGE, PAS DU DESSIN. Les quarante planches
// abîmées et les vingt planches détruites étaient déjà dans l'atlas, payées en
// octets depuis la veille ; personne ne les demandait. Ce fichier garde la
// DEMANDE — que l'état parte de l'entité de combat et arrive au nom de sprite —
// et non la règle des seuils, qui vit dans `data/base.js` et y est déjà gardée.
//
// ⚠ ET IL GARDE AUSSI CE QUI NE DOIT PAS BOUGER EN CHEMIN : une unité et une
// structure n'ont pas d'états de dégâts, et leur passer le champ ferait un champ
// qu'on croit lu.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { listeAffichage, couchesDeLaRuine } from '../src/render/scene.js';
import { calculerProjection } from '../src/render/projection.js';
import { MUR_CASES } from '../src/render/fond.js';
import { creerCombat } from '../src/sim/combat.js';
import { RESTE_APRES_DESTRUCTION } from '../src/data/sites.js';
import { ETATS_BATIMENT, SUFFIXE_ETAT_BATIMENT } from '../src/data/base.js';
import { ATLAS } from '../src/data/atlas.js';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Un site de combat avec les bâtiments demandés, un mur et une escouade.
 *
 * ⚠ LE MONTAGE PASSE PAR `creerCombat`, PAS PAR UN OBJET À LA MAIN. Les entités
 * de combat portent `pvMilli` et `pvMaxMilli` parce que le moteur les y met ;
 * un faux objet écrit ici mesurerait ce que le test croit du moteur.
 */
function montage(batiments = [{ id: 'souche', rangee: 18, colonne: 5 }]) {
  const etat = creerCombat({
    niveau: 1,
    saveur: null,
    obstacles: [],
    batiments,
    defenseurs: [{ id: 'merlon', rangee: 10, colonne: 3 }],
    vagues: [[{ id: 'meute', colonne: 1 }]],
    modulesDebloques: {
      ouvrage: { offense: [], defense: [] }, joueur: { offense: [], defense: [] },
    },
  });
  const proj = calculerProjection(1080, 4000, MUR_CASES);
  const noms = (liste) => liste.filter((p) => p.forme === 'sprite').map((p) => p.nom);
  const rendre = (tombees = null) => noms(listeAffichage(etat, proj, null, 0, null, 0, tombees));
  const parId = (id) => etat.entites.find((e) => e.id === id && e.camp === 'defense');
  return { etat, proj, noms, rendre, parId };
}

/** Le nom de bâtiment rendu pour ce couple de PV — un seul bâtiment au montage. */
function nomPourPv(pvMilli, pvMaxMilli = 1000) {
  const m = montage();
  const souche = m.parId('souche');
  // ⚠⚠ LE `pvMax` EST FIXÉ À 1 000, ET C'EST CE QUI REND LES SEUILS EXACTS. La
  // Souche en a 5 500 000 : « la moitié moins un » y serait un rang de mesure
  // plus loin que la frontière qu'on veut toucher. Mille millièmes donne des
  // bornes entières — 1000, 999, 500, 499, 1, 0 —, c'est-à-dire très exactement
  // les six compositions que le brief demande.
  souche.pvMaxMilli = pvMaxMilli;
  souche.pvMilli = pvMilli;
  return m.rendre().filter((n) => n.startsWith('bat_'));
}

// ---------------------------------------------------------------------------
// ER T1 — un bâtiment entamé compose sur sa planche abîmée
// ---------------------------------------------------------------------------

test('ER T1 — un bâtiment à la moitié de ses PV rend `_abime`, pas le nom nu', () => {
  // ⚠⚠ CE TEST ÉCHOUAIT AVANT LE CORRECTIF, ET C'EST SA RAISON D'ÊTRE. La boucle
  // des entités visibles de `scene.js` composait le descripteur sans champ
  // `etat` ; `couchesDuBatiment` retombait donc sur son défaut `intact` — un
  // défaut JUSTE, qui sert les montages composant un bâtiment à la main — et
  // rendait `bat_o_souche` quels que soient les PV. Mesuré avant le patch : le
  // nom nu, aux six valeurs de PV de T2.
  //
  // ⚠ LA PORTE MESURÉE EST L'APPELANT, PAS LA RÈGLE. `etatDuBatiment` et ses
  // seuils sont gardés dans `batiments-quatre-etats.test.js` ; ce qui manquait
  // était que quelqu'un les APPELLE depuis le chemin du combat.
  assert.deepEqual(nomPourPv(500), ['bat_o_souche_abime']);

  // Et à pleins PV, le nom nu — sinon le test ne mesurerait qu'un suffixe collé
  // partout, ce qui passerait aussi bien.
  assert.deepEqual(nomPourPv(1000), ['bat_o_souche']);
});

// ---------------------------------------------------------------------------
// ER T2 — les quatre états traversent le rendu, au PV près
// ---------------------------------------------------------------------------

test('ER T2 — six PV, quatre suffixes, mesurés dans le rendu et pas dans la donnée', () => {
  // ⚠⚠ LA RÈGLE EST DÉJÀ TESTÉE AILLEURS ; CE QUI MANQUE EST QU'ELLE TRAVERSE.
  // `B4 T3` balaie `etatDuBatiment` au PV près sur 201 valeurs. Ici on ne
  // remesure pas les seuils : on vérifie que les six PV qui les encadrent
  // ressortent en SIX NOMS DE SPRITE, ce qui est la seule chose que le joueur
  // voit. Une règle juste dont personne n'appelle la fonction est exactement le
  // défaut du 08/09.
  const attendus = [
    [1000, 'bat_o_souche'], // pvMax : intact, et l'intact n'a pas de suffixe
    [999, 'bat_o_souche_abime'], // un PV en moins, et le dessin le dit
    [500, 'bat_o_souche_abime'], // la moitié APPARTIENT à `abime`
    [499, 'bat_o_souche_tres_abime'], // la moitié moins un bascule
    [1, 'bat_o_souche_tres_abime'], // un PV tient encore
    [0, 'bat_o_souche_detruit'], // zéro, et seulement zéro
  ];
  for (const [pv, nom] of attendus) {
    assert.deepEqual(nomPourPv(pv), [nom], `${pv} millièmes de PV ne rend pas ${nom}`);
  }

  // ⚠ LES QUATRE ÉTATS SONT COUVERTS, ET LE COMPTE LE DIT. Un montage qui
  // n'atteindrait que trois suffixes laisserait une planche sans lecteur sans
  // que rien ne rougisse.
  const rendus = new Set(attendus.map(([pv]) => nomPourPv(pv)[0]));
  assert.equal(rendus.size, ETATS_BATIMENT.length,
    `${rendus.size} noms distincts pour ${ETATS_BATIMENT.length} états`);
});

// ---------------------------------------------------------------------------
// ER T3 — un bâtiment détruit compose SA planche, pas le tas de gravats commun
// ---------------------------------------------------------------------------

test('ER T3 — deux bâtiments tombés du même camp rendent deux noms différents', () => {
  // ⚠⚠ C'EST LE DÉFAUT D'ETHAN, NOMMÉ. `RESTE_APRES_DESTRUCTION.batiment` valait
  // `'ruine'` : la Souche et le Nœud laissaient tous deux `ruine_o`, le même tas
  // de gravats. Avec la ruine générique, ce test rend DEUX FOIS LE MÊME NOM —
  // c'est ce qui le rend falsifiable, et `EFF T12` fait le va-et-vient.
  const m = montage([
    { id: 'souche', rangee: 18, colonne: 5 },
    { id: 'noeud', rangee: 17, colonne: 7 },
  ]);
  const souche = m.parId('souche');
  const noeud = m.parId('noeud');
  assert.ok(souche && noeud, 'le montage n\'a pas les deux bâtiments');

  const apres = m.rendre(new Set([souche.indice, noeud.indice]))
    .filter((n) => n.startsWith('bat_') || n.startsWith('ruine_'));
  assert.deepEqual(apres.slice().sort(),
    ['bat_o_noeud_detruit', 'bat_o_souche_detruit']);
  assert.equal(new Set(apres).size, 2, 'les deux bâtiments laissent le même dessin');

  // ⚠⚠ ET L'EFFONDREMENT NE LIT PAS LES PV, IL FORCE `detruit`. Les deux pièces
  // sont à PLEINS PV ici — `ordreDeLEffondrement` ne prend que les survivantes
  // du camp de la défense —, donc un rendu qui calculerait l'état depuis
  // `pvMilli` les dessinerait INTACTES au milieu de leur propre écroulement.
  assert.equal(souche.pvMilli, souche.pvMaxMilli);
  assert.equal(noeud.pvMilli, noeud.pvMaxMilli);
});

// ---------------------------------------------------------------------------
// ER T4 — `ruine_j` et `ruine_o` ne retournent pas dormir
// ---------------------------------------------------------------------------

test('ER T4 — les deux ruines restent atteignables, et la carte n\'en dépendait pas', () => {
  // ⚠⚠ LE BRIEF DIT « une base rasée les pose encore ». C'EST FAUX, ET LA
  // LECTURE LE MONTRE. Une base rasée est RETIRÉE de la carte par
  // `sitesDeLaFenetre` — `.filter` sur `casesRasees` —, et ce qui se dessine à sa
  // place est `dessinerRuineDUneCase` de `render/embleme.js`, qui va chercher
  // `spriteDeLaRuine` dans la famille **`embleme`**. Les deux planches de la
  // famille `batiment` n'y sont pour rien. Leur unique lecteur de production
  // était la ligne même que ce lot vient de changer.
  const monde = readFileSync(join(RACINE, 'src', 'ui', 'monde.js'), 'utf8');
  assert.match(monde, /dessinerRuineDUneCase/, 'la carte ne dessine plus de ruine de case');
  assert.equal(monde.includes('couchesDeLaRuine'), false,
    'la carte passe par `couchesDeLaRuine` : la lecture de ce test est périmée');

  // ⚠⚠ ELLES RESTENT DONC, ET LE CHEMIN RESTE OUVERT — c'est ce que le brief
  // demande vraiment. `RESTE_APRES_DESTRUCTION.defense`, qu'Ethan a parké « en
  // attente d'un coup d'œil », les remet à l'écran en changeant UN MOT ; `EFF
  // T12` mesure le va-et-vient. Les renvoyer dormir aurait été `ui_pause` une
  // quatrième fois, et cette fois de notre main.
  assert.deepEqual(couchesDeLaRuine('ouvrage'), [{ famille: 'batiment', nom: 'ruine_o' }]);
  assert.deepEqual(couchesDeLaRuine('joueur'), [{ famille: 'batiment', nom: 'ruine_j' }]);
  for (const c of ['j', 'o']) {
    assert.ok(ATLAS.batiment.noms.includes(`ruine_${c}`), `ruine_${c} a quitté l'atlas`);
  }
});

// ---------------------------------------------------------------------------
// ER T5 — les unités et les structures ne reçoivent pas d'état
// ---------------------------------------------------------------------------

test('ER T5 — une unité et une structure entamées rendent le même nom qu\'intactes', () => {
  // ⚠⚠ UN CHAMP PASSÉ PARTOUT EST UN CHAMP QU'ON CROIT LU. `couchesDeLEntite`
  // sert trois genres ; seuls les bâtiments ont des planches d'états. Passer
  // `etat` aux trois ferait un champ ignoré partout sauf à un endroit — et le
  // jour où quelqu'un lui donnerait un sens pour les unités, il croirait le
  // brancher alors qu'il le changerait.
  const m = montage();
  const merlon = m.parId('merlon');
  const meute = m.etat.entites.find((e) => e.genre === 'unite');
  assert.ok(merlon && meute, 'le montage n\'a pas la structure et l\'unité attendues');

  const intact = m.rendre().filter((n) => !n.startsWith('bat_'));
  merlon.pvMilli = Math.floor(merlon.pvMaxMilli / 3);
  meute.pvMilli = Math.floor(meute.pvMaxMilli / 3);
  const entame = m.rendre().filter((n) => !n.startsWith('bat_'));

  assert.deepEqual(entame, intact,
    'un genre sans états a changé de sprite avec ses PV');
  // ⚠ ET LA LISTE N'EST PAS VIDE, sinon l'égalité ci-dessus ne dirait rien.
  assert.ok(intact.length >= 2, `${intact.length} sprite(s) hors bâtiments : rien n'est mesuré`);
  for (const n of intact) {
    assert.equal(/_(abime|tres_abime|detruit)$/.test(n), false,
      `${n} porte un suffixe d'état alors que son genre n'en a pas`);
  }
});

// ---------------------------------------------------------------------------
// ER T6 — la table reste la seule vérité
// ---------------------------------------------------------------------------

test('ER T6 — aucun suffixe d\'état en dur, et le dessin suit la table dans les deux sens', () => {
  // ⚠⚠ LE MOTIF CHERCHE LE SUFFIXE, PAS LE NOM D'ÉTAT, ET LA DIFFÉRENCE EST LA
  // RÈGLE. `'detruit'` est du vocabulaire de JEU — un membre d'`ETATS_BATIMENT`,
  // que `scene.js` a le droit de nommer pour dire « cette pièce s'écroule » ;
  // `'_detruit'` est une décision de NOMMAGE DE FICHIER, qui appartient à
  // `SUFFIXE_ETAT_BATIMENT` seule. Écrire le second ici ferait une table de plus,
  // qui cesserait d'être vraie au premier renommage de planche.
  const MOTIF = /['"`]_(?:abime|tres_abime|detruit)/g;
  // ⚠ FALSIFIABLE DES DEUX CÔTÉS : le motif attrape l'appât, et laisse passer le
  // nom d'état légitime.
  assert.equal("const s = '_tres_abime';".match(MOTIF)?.length, 1, 'l\'appât passe');
  assert.equal("const e = 'detruit';".match(MOTIF), null,
    'le motif attrape le nom d\'état : il mesure autre chose que le suffixe');

  const fautifs = {};
  for (const dossier of ['render', 'sim']) {
    const base = join(RACINE, 'src', dossier);
    for (const f of readdirSync(base).filter((n) => n.endsWith('.js'))) {
      const source = readFileSync(join(base, f), 'utf8')
        // Les commentaires racontent, et ils ont le droit de citer un suffixe.
        .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
      const n = (source.match(MOTIF) ?? []).length;
      if (n > 0) fautifs[`src/${dossier}/${f}`] = n;
    }
  }
  assert.deepEqual(fautifs, {}, 'un suffixe d\'état est écrit en dur hors de sa table');
  // Et la table porte bien les quatre, dont l'intact à vide.
  assert.deepEqual(Object.keys(SUFFIXE_ETAT_BATIMENT).sort(), [...ETATS_BATIMENT].sort());

  // ⚠⚠ ET LE DESSIN SUIT LA TABLE À CHAUD, DANS LES DEUX SENS — même montage que
  // `EFF T12`, étendu au reste neuf. Sans le va-et-vient, le test ne prouverait
  // qu'une porte qui s'ouvre, et une valeur câblée en dur passerait dans un sens.
  const m = montage();
  const souche = m.parId('souche');
  const tombees = new Set([souche.indice]);
  const dOrigine = { ...RESTE_APRES_DESTRUCTION };
  try {
    const reste = () => m.rendre(tombees)
      .filter((n) => n.startsWith('bat_') || n.startsWith('ruine_'));
    assert.deepEqual(reste(), ['bat_o_souche_detruit'], 'le réglage du jour a changé');
    RESTE_APRES_DESTRUCTION.batiment = 'ruine';
    assert.deepEqual(reste(), ['ruine_o'], 'revenir à `ruine` ne répond pas');
    RESTE_APRES_DESTRUCTION.batiment = 'rien';
    assert.deepEqual(reste(), [], '`rien` laisse un dessin derrière lui');
    RESTE_APRES_DESTRUCTION.batiment = 'planche';
    assert.deepEqual(reste(), ['bat_o_souche_detruit']);
  } finally {
    for (const k of Object.keys(RESTE_APRES_DESTRUCTION)) delete RESTE_APRES_DESTRUCTION[k];
    Object.assign(RESTE_APRES_DESTRUCTION, dOrigine);
  }
  assert.deepEqual({ ...RESTE_APRES_DESTRUCTION },
    { batiment: 'planche', defense: 'rien', unite: 'rien' });
});
