// Le sol de la carte du monde — `src/render/terrain.js`, confronté au dépôt.
//
// ⚠⚠ CE FICHIER A ÉTÉ RÉÉCRIT EN ENTIER AU LOT SOL-SATELLITE (05/09), ET IL FAUT
// SAVOIR CE QU'IL NE MESURE PLUS. Il portait treize tests sur un module qui
// RENDAIT DES PIXELS : il décodait l'atlas indexé livré, refaisait la somme
// pondérée, vérifiait que les cinq teintes de sortie occupaient 20 % de la
// surface chacune, que le plancher anti-noir ne mordait pas, que la formule
// battait la composition alpha ordinaire à l'écart-type. Le sol n'est plus
// accumulé ni quantifié : ces treize-là n'ont plus d'objet, et ce ne sont pas des
// assertions assouplies, ce sont des assertions dont le sujet a disparu.
//
// ⚠ CE QUI SURVIT, EN REVANCHE, SURVIT MOT POUR MOT : l'indépendance des dalles,
// le fait qu'aucun cran n'agrandisse la source, et la distribution du hachage —
// c'est le défaut des « bits épuisés » qui faisait basculer toutes les tuiles du
// même côté, et il se serait commis à l'identique ici.
//
// ⚠⚠ ET CE FICHIER NE DÉCODE PLUS D'IMAGE. Les huit planches sont en WebP, que
// Node ne sait pas lire ; ce que la suite peut encore mesurer sur elles vit dans
// `art/sprites/sol/sol-empreintes.json`, écrit par `tools/sols.py`. Même motif
// que `bord-empreintes.json` depuis le lot MURS et que `fond-empreintes.json`
// depuis MUR-PEINT.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  blocsDeLaDalle, descriptionDuBloc, echelleDuCran, geometrieDuCran, profilDuBloc,
  COTE_SOURCE, FONDU_SOURCE, PAS_SOURCE, PART_INTACTE, NOMS_DU_SOL, SEL_BLOC,
} from '../src/render/terrain.js';
import { TERRAIN_CARTE, ZOOM_CARTE, PIXELS_SOURCE_PAR_CASE } from '../src/data/sites.js';
import { SEL_VARIANTE } from '../src/render/variante.js';
import { SEL_FOND } from '../src/render/fond.js';
import { SEL_RANGEE, SEL_COLONNE } from '../src/sim/poi.js';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');
const DOSSIER_SOL = join(RACINE, 'art', 'sprites', 'sol');
const MANIFESTE = JSON.parse(readFileSync(join(DOSSIER_SOL, 'sol-empreintes.json'), 'utf8'));

const lire = (...bouts) => readFileSync(join(RACINE, ...bouts), 'utf8');

/** La source sans ses commentaires — une garde ne lit jamais sa propre prose. */
function sansCommentaires(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

/**
 * Le poids de chaque pixel d'une dalle, sommé sur tous les blocs qui la
 * touchent. C'est la reconstruction de ce que `ui/monde.js` compose au canevas.
 */
function poidsDeLaDalle({ graine, cran, x0, y0, cote }) {
  const { taille, fondu } = geometrieDuCran(cran);
  const profil = profilDuBloc(taille, fondu);
  const somme = new Float64Array(cote * cote);
  const pleins = new Int32Array(cote * cote);
  for (const b of blocsDeLaDalle({ graine, cran, x0, y0, cote })) {
    for (let j = 0; j < taille; j += 1) {
      const y = b.y + j;
      if (y < 0 || y >= cote) continue;
      for (let i = 0; i < taille; i += 1) {
        const x = b.x + i;
        if (x < 0 || x >= cote) continue;
        const w = profil[j] * profil[i];
        somme[y * cote + x] += w;
        if (w === 1) pleins[y * cote + x] += 1;
      }
    }
  }
  return { somme, pleins };
}

// ---------------------------------------------------------------------------
// SOL T1 — la table, l'outil, les fichiers, le manifeste, le build et la page
// ---------------------------------------------------------------------------

test('SOL T1 — les huit planches ne peuvent pas diverger entre six endroits', () => {
  // ⚠⚠ SIX ÉCRITURES DU MÊME HUIT, ET AUCUNE N'EST LA SOURCE DES CINQ AUTRES.
  // La table du module nomme les dessins, l'outil les produit, le dossier les
  // porte, le manifeste les décrit, le build les inline, la page les déclare.
  // Chacune est indispensable là où elle est — un module pur ne lit pas un
  // dossier, un build ne lit pas un module ES — donc la seule chose à faire est
  // de les CONFRONTER. C'est la garde née de BÂTIMENTS-1024, appliquée ici.
  assert.equal(NOMS_DU_SOL.length, 8, 'huit planches, pas une de plus');

  const surLeDisque = readdirSync(DOSSIER_SOL)
    .filter((n) => n.endsWith('.webp')).map((n) => n.replace(/\.webp$/, '')).sort();
  assert.deepEqual(surLeDisque, [...NOMS_DU_SOL].sort(), 'le dossier et la table divergent');
  assert.deepEqual(Object.keys(MANIFESTE.sols).sort(), [...NOMS_DU_SOL].sort(),
    'le manifeste et la table divergent');

  const outil = lire('tools', 'sols.py');
  assert.match(outil, /PLANCHES = \[f'sol_carte_\{i\}\.png' for i in range\(1, 9\)\]/,
    'tools/sols.py ne dérive plus ses huit planches du même patron que la table');

  const build = lire('tools', 'build.js');
  const page = lire('src', 'index.src.html');
  for (const nom of NOMS_DU_SOL) {
    const marqueur = `%${nom.toUpperCase()}%`;
    assert.ok(build.includes(`marqueur: '${marqueur}'`), `${marqueur} n'est pas inliné`);
    assert.ok(build.includes(`'${nom}.webp'`), `${nom}.webp n'est pas dans la table du build`);
    assert.ok(page.includes(`src="${marqueur}"`), `${marqueur} n'est pas posé dans la page`);
  }
  // ⚠ ET L'INVERSE : pas un marqueur de sol de plus que de planches. Un
  // neuvième inliné sans dessin qui le pose pèserait 200 Kio pour rien.
  assert.equal((build.match(/%SOL_CARTE_\d+%/g) ?? []).length, 8, 'le build inline autre chose');
  assert.equal((page.match(/%SOL_CARTE_\d+%/g) ?? []).length, 8, 'la page déclare autre chose');
  for (let i = 1; i <= 8; i += 1) {
    assert.ok(page.includes(`<img id="sol-${i}"`), `la balise sol-${i} manque`);
  }
});

// ---------------------------------------------------------------------------
// SOL T2 — le côté écrit dans le module est celui des fichiers
// ---------------------------------------------------------------------------

test('SOL T2 — `COTE_SOURCE` est mesuré sur les fichiers, pas affirmé', () => {
  // `render/` est pur : il ne lit aucun fichier, et `naturalWidth` n'existe
  // qu'une fois l'image décodée par un navigateur. La constante est donc écrite,
  // et c'est ICI qu'elle se confronte — au dépôt, pas chez le joueur.
  for (const nom of NOMS_DU_SOL) {
    const e = MANIFESTE.sols[nom];
    assert.equal(e.largeur, COTE_SOURCE, `${nom} : largeur ${e.largeur}`);
    assert.equal(e.hauteur, COTE_SOURCE, `${nom} : hauteur ${e.hauteur}`);
  }
  // ⚠ CARRÉES, ET C'EST CE QUI AUTORISE LES QUARTS DE TOUR. Une planche
  // rectangulaire changerait d'encombrement en tournant, et le pavage laisserait
  // des trous une fois sur deux.
  assert.equal(FONDU_SOURCE, TERRAIN_CARTE.fonduSourcePx, 'le fondu ne vient plus de la donnée');
  assert.equal(PAS_SOURCE, COTE_SOURCE - FONDU_SOURCE);
  assert.ok(FONDU_SOURCE * 2 < COTE_SOURCE,
    'le fondu mange plus que la moitié du bloc : il ne resterait aucune zone intacte');
});

// ---------------------------------------------------------------------------
// SOL T3 — la partition de l'unité, sur une dalle entière et aux quatre crans
// ---------------------------------------------------------------------------

test('SOL T3 — la somme des poids vaut EXACTEMENT un, partout et à tous les crans', () => {
  // ⚠⚠ C'EST L'INVARIANT DU LOT. `ui/monde.js` compose les blocs en `lighter`,
  // qui ADDITIONNE : la dalle finit avec `Σ w·v` en couleur et `Σ w` en alpha, et
  // rien ne divise après coup. Si `Σ w` s'écartait de un, la carte s'éclaircirait
  // ou s'assombrirait dans les bandes de fondu — c'est-à-dire qu'elle
  // DESSINERAIT ses coutures au lieu de les effacer.
  for (const cran of ZOOM_CARTE.crans) {
    const cote = 256;
    const { somme } = poidsDeLaDalle({ graine: 12345, cran, x0: 3 * cote, y0: 7 * cote, cote });
    let min = Infinity;
    let max = -Infinity;
    for (const v of somme) {
      if (v < min) min = v;
      if (v > max) max = v;
    }
    assert.ok(Math.abs(min - 1) < 1e-12, `cran ${cran} : poids minimum ${min}`);
    assert.ok(Math.abs(max - 1) < 1e-12, `cran ${cran} : poids maximum ${max}`);
  }
});

test('SOL T3 ter — et l\'exactitude s\'arrête à l\'alpha 8 bits, mesuré', () => {
  // ⚠⚠ `Σw = 1` EST EXACT EN FLOTTANT ; LE MASQUE, LUI, EST UN CANEVAS. `ui/monde.js`
  // écrit `round(w × 255)` dans le canal alpha, et deux arrondis qui se
  // complètent ne somment pas forcément à 255. C'est la seule imprécision du
  // pavage, et elle se mesure plutôt que de se supposer : la déclarer bornée est
  // ce qui distingue « exact » d'« assez exact ».
  for (const cran of ZOOM_CARTE.crans) {
    const { taille, fondu, pas } = geometrieDuCran(cran);
    const p = profilDuBloc(taille, fondu);
    // Dans une bande, deux blocs se croisent.
    let bande = 0;
    for (let i = 0; i < fondu; i += 1) {
      bande = Math.max(bande, Math.abs(Math.round(p[i] * 255) + Math.round(p[i + pas] * 255) - 255));
    }
    assert.equal(bande, 0, `cran ${cran} : la bande de fondu s'écarte de ${bande}/255`);
    // Aux coins, quatre. Le produit de deux profils s'arrondit quatre fois.
    let coin = 0;
    for (let j = 0; j < fondu; j += 1) {
      for (let i = 0; i < fondu; i += 1) {
        const somme = Math.round(p[j] * p[i] * 255) + Math.round(p[j] * p[i + pas] * 255)
          + Math.round(p[j + pas] * p[i] * 255) + Math.round(p[j + pas] * p[i + pas] * 255);
        coin = Math.max(coin, Math.abs(somme - 255));
      }
    }
    assert.ok(coin <= 1, `cran ${cran} : les coins s'écartent de ${coin}/255`);
  }
});

test('SOL T3 bis — la complémentarité tient au PAS, et la sonde le prouve', () => {
  // ⚠ SANS CETTE SONDE, T3 POURRAIT ÊTRE VRAI SANS RIEN GARDER. La propriété
  // n'est pas « le profil monte doucement » : c'est que le profil MONTANT d'un
  // bloc et le profil DESCENDANT de son voisin, décalés d'exactement `pas`,
  // somment à un. On le vérifie, puis on décale d'un pixel de plus et on exige
  // que ça CESSE d'être vrai.
  for (const cran of ZOOM_CARTE.crans) {
    const { taille, fondu, pas } = geometrieDuCran(cran);
    const p = profilDuBloc(taille, fondu);
    for (let i = 0; i < fondu; i += 1) {
      assert.ok(Math.abs(p[i] + p[i + pas] - 1) < 1e-12,
        `cran ${cran} : le profil n'est pas complémentaire au pixel ${i}`);
    }
    // Le même profil décalé d'un pixel : la somme s'écarte, et de beaucoup.
    let pire = 0;
    for (let i = 0; i < fondu - 1; i += 1) {
      pire = Math.max(pire, Math.abs(p[i] + p[i + pas + 1] - 1));
    }
    assert.ok(pire > 0.01,
      `cran ${cran} : un pas faux d'un pixel ne se voit pas (écart ${pire})`);
  }
});

// ---------------------------------------------------------------------------
// SOL T4 — la part de surface qui est le pixel source
// ---------------------------------------------------------------------------

test('SOL T4 — 78,6 % du sol est le pixel source, et ça se compte sur le pavage', () => {
  // ⚠⚠ C'EST LA MESURE DE « LE MOINS DE TRAITEMENT POSSIBLE ». On compte les
  // pixels qu'UN SEUL bloc couvre avec le poids plein : là, la dalle reçoit la
  // planche telle quelle. Le reste est la bande de fondu, où deux dessins — ou
  // quatre aux coins — se croisent.
  //
  // ⚠ ON MESURE SUR UNE PÉRIODE ENTIÈRE DU PAVAGE, PAS SUR UNE DALLE RONDE. Le
  // pas ne divise aucun côté de dalle : une fenêtre de 512 ou de 1 536 tombe au
  // milieu d'une période et la mesure penche de neuf points. Premier jet mesuré
  // 0,6944 pour 0,7856 attendus, et c'était le montage qui avait tort.
  for (const cran of ZOOM_CARTE.crans) {
    const { pas } = geometrieDuCran(cran);
    const { pleins } = poidsDeLaDalle({ graine: 9, cran, x0: 4 * pas, y0: 3 * pas, cote: pas });
    let intacts = 0;
    for (const p of pleins) {
      assert.ok(p <= 1, 'deux blocs à poids plein sur le même pixel');
      if (p === 1) intacts += 1;
    }
    const part = intacts / (pas * pas);
    assert.ok(Math.abs(part - PART_INTACTE) < 0.02,
      `cran ${cran} : part intacte ${part.toFixed(4)} contre ${PART_INTACTE.toFixed(4)}`);
    assert.ok(part > 0.75, `cran ${cran} : plus que ${(part * 100).toFixed(1)} % de source`);
  }
});

// ---------------------------------------------------------------------------
// SOL T5 — l'indépendance des dalles
// ---------------------------------------------------------------------------

test('SOL T5 — une zone rendue en une dalle est identique à la même rendue en quatre', () => {
  // ⚠⚠ C'EST L'INVARIANT QUI CASSERAIT EN SILENCE. Une couture ne fait pas
  // tomber un test : elle se voit six semaines plus tard sur un téléphone. On
  // compare donc ce que le pavage POSE — dessin, orientation, position ABSOLUE —
  // vu d'un découpage et de l'autre.
  const cran = 64;
  const grand = 512;
  const petit = 256;
  const cle = (b, dx, dy) => `${b.sol}/${b.rotation}/${b.miroir}@${b.x + dx},${b.y + dy}`;

  const enUn = new Set(
    blocsDeLaDalle({ graine: 4242, cran, x0: 1024, y0: 2048, cote: grand })
      .map((b) => cle(b, 1024, 2048)),
  );
  const enQuatre = new Set();
  for (let j = 0; j < 2; j += 1) {
    for (let i = 0; i < 2; i += 1) {
      const x0 = 1024 + i * petit;
      const y0 = 2048 + j * petit;
      for (const b of blocsDeLaDalle({ graine: 4242, cran, x0, y0, cote: petit })) {
        enQuatre.add(cle(b, x0, y0));
      }
    }
  }
  // Les quatre petites dalles voient exactement les mêmes blocs, aux mêmes
  // positions absolues. Elles peuvent en voir DE PLUS — un bloc qui déborde d'un
  // bord de la grande —, jamais d'autres.
  for (const c of enUn) assert.ok(enQuatre.has(c), `le découpage en quatre a perdu ${c}`);
  assert.ok(enQuatre.size >= enUn.size, 'montage cassé');
});

test('SOL T5 bis — le coin de la dalle n\'entre dans aucun hachage', () => {
  // Le même bloc, demandé depuis deux dalles différentes, doit porter le même
  // dessin : c'est ce que « semé par la position absolue » veut dire.
  const source = sansCommentaires(lire('src', 'render', 'terrain.js'));
  assert.ok(!/hachageBrut\([^)]*x0/.test(source) && !/hachageBrut\([^)]*y0/.test(source),
    'le coin de la dalle est passé au hachage : les dalles cessent d\'être indépendantes');
});

// ---------------------------------------------------------------------------
// SOL T6 — l'échelle, et le 1:1 au cran le plus serré
// ---------------------------------------------------------------------------

test('SOL T6 — aucun cran n\'agrandit la source, et le plus serré tombe au 1:1', () => {
  // ⚠⚠ C'EST L'ACQUIS DU « GROS CARRÉ MOCHE » DU 30/08, et il survit au
  // changement de sol. Un pavage qui agrandit sa source double son grain, et le
  // grain se lit alors en carrés alignés sur les axes.
  for (const cran of ZOOM_CARTE.crans) {
    assert.ok(echelleDuCran(cran) <= 1, `le cran ${cran} agrandit la source`);
  }
  const plusSerre = Math.max(...ZOOM_CARTE.crans);
  assert.equal(echelleDuCran(plusSerre), 1, 'le cran le plus serré ne tombe plus au 1:1');
  assert.equal(PIXELS_SOURCE_PAR_CASE, plusSerre,
    'l\'échelle source et le cran le plus serré ont divergé : le sol serait flou au maximum du zoom');
  assert.throws(() => echelleDuCran(48), RangeError, 'un cran hors table ne lève plus');
});

test('SOL T7 — la géométrie est ENTIÈRE à tous les crans', () => {
  // ⚠⚠ SANS ÇA, LE FONDU N'EST PLUS EXACT. Deux blocs voisins partagent leur
  // bande ; si le pas était fractionnaire, leurs profils se décaleraient d'une
  // fraction de pixel et `Σw` cesserait de valoir un sur la colonne du raccord —
  // un liseré d'un pixel sur toute la longueur de chaque couture.
  for (const cran of ZOOM_CARTE.crans) {
    const g = geometrieDuCran(cran);
    for (const [nom, v] of Object.entries({ taille: g.taille, fondu: g.fondu, pas: g.pas })) {
      assert.ok(Number.isInteger(v), `cran ${cran} : ${nom} vaut ${v}`);
    }
    assert.equal(g.pas, g.taille - g.fondu, `cran ${cran} : le pas n'est plus le complément`);
    assert.ok(g.fondu >= 1 && g.fondu * 2 <= g.taille, `cran ${cran} : fondu ${g.fondu}`);
    // ⚠ ET L'ÉCART À L'ÉCHELLE NOMINALE RESTE SOUS LE DEMI-PIXEL. C'est ce que
    // l'arrondi coûte, et il est écrit pour qu'on sache qu'il est mesuré.
    assert.ok(Math.abs(g.taille - COTE_SOURCE * g.echelle) <= 0.5,
      `cran ${cran} : la taille arrondie s'écarte de plus d'un demi-pixel`);
  }
});

// ---------------------------------------------------------------------------
// SOL T8 — le tirage
// ---------------------------------------------------------------------------

test('SOL T8 — le tirage est stable, et il se répartit sur les huit dessins', () => {
  // ⚠⚠ LE TEST QUI COMPTE ICI EST CELUI DE LA DISTRIBUTION, et il est écrit pour
  // le défaut des « bits épuisés » : un champ lu dans les trois bits de tête d'un
  // mot déjà entamé est toujours minuscule, donc TOUTES les tuiles basculent du
  // même côté. Ça s'est vu à l'œil en une seconde pendant la maquette, et aucune
  // assertion de forme ne l'aurait attrapé.
  const a = descriptionDuBloc(77, 3, 5);
  assert.deepEqual(descriptionDuBloc(77, 3, 5), a, 'le tirage n\'est pas stable');
  assert.notDeepEqual(descriptionDuBloc(78, 3, 5), a, 'la graine ne change plus rien');

  const parSol = new Array(8).fill(0);
  const parRotation = new Array(4).fill(0);
  let miroirs = 0;
  let n = 0;
  for (let by = 0; by < 120; by += 1) {
    for (let bx = 0; bx < 120; bx += 1) {
      const d = descriptionDuBloc(31, by, bx);
      parSol[d.sol] += 1;
      parRotation[d.rotation] += 1;
      if (d.miroir) miroirs += 1;
      n += 1;
    }
  }
  for (let i = 0; i < 8; i += 1) {
    assert.ok(Math.abs(parSol[i] / n - 1 / 8) < 0.02, `le dessin ${i} sort ${parSol[i]} fois sur ${n}`);
  }
  for (let r = 0; r < 4; r += 1) {
    assert.ok(Math.abs(parRotation[r] / n - 1 / 4) < 0.02, `la rotation ${r} sort ${parRotation[r]} fois`);
  }
  assert.ok(Math.abs(miroirs / n - 0.5) < 0.02, `${miroirs} miroirs sur ${n}`);
  // ⚠ ET HUIT EST UNE PUISSANCE DE DEUX, DONC LE MODULO NE PENCHE PAS. Le jour
  // où une neuvième planche arriverait, ce test-ci resterait vert et le biais
  // serait réel : la garde est donc sur le NOMBRE, pas seulement sur la mesure.
  assert.equal(NOMS_DU_SOL.length & (NOMS_DU_SOL.length - 1), 0,
    'le nombre de planches n\'est plus une puissance de deux : le tirage penche');
});

test('SOL T9 — le sel du pavage n\'est partagé avec personne', () => {
  // ⚠ DEUX TIRAGES SANS RAPPORT QUI PARTAGENT UN SEL FINISSENT PAR SE CORRÉLER,
  // et personne ne s'en aperçoit. `SEL_DECALAGE` et `SEL_FIGURE` valaient 2 et 3
  // et sont partis avec la moulinette — ce sont les sels de `sim/poi.js`, qu'on
  // ne reprend donc pas.
  const autres = { SEL_VARIANTE, SEL_FOND, SEL_RANGEE, SEL_COLONNE };
  for (const [nom, sel] of Object.entries(autres)) {
    assert.notEqual(SEL_BLOC, sel, `le sel du pavage est aussi celui de ${nom}`);
  }
  // ⚠ 0 ET 1 SONT AU PEUPLEMENT, et ils ne s'importent pas d'ici — ce module
  // n'exporte pas ses sels. On les nomme donc de face plutôt que de faire
  // semblant de les lire.
  assert.ok(SEL_BLOC !== 0 && SEL_BLOC !== 1, 'le sel du pavage est celui du peuplement');
});

// ---------------------------------------------------------------------------
// SOL T10 — la moulinette a disparu, et rien ne la rallume
// ---------------------------------------------------------------------------

test('SOL T10 — plus rien ne quantifie, n\'accumule, ni ne repeint le sol', () => {
  const partis = [
    'creerAtlas', 'rendreDalle', 'indicesDeTeinte', 'masqueDeLaTuile',
    'orientationDeLaTuile', 'descriptionDuNoeud', 'partOuvrageDeLaRangee',
    'teinteDeLaValeur', 'rangeeDuPixelSource', 'NB_TEINTES',
    'seuilsDeTeinte', 'seuilOuvrage', 'pasSourcePx', 'decalageFraction',
    'coteTuile', 'tuilesParCase',
  ];
  for (const dossier of ['data', 'sim', 'render', 'ui']) {
    for (const fichier of readdirSync(join(RACINE, 'src', dossier))) {
      if (!fichier.endsWith('.js')) continue;
      const source = sansCommentaires(lire('src', dossier, fichier));
      for (const nom of partis) {
        assert.ok(!new RegExp(`(?<![\\p{L}\\p{N}_])${nom}(?![\\p{L}\\p{N}_])`, 'u').test(source),
          `src/${dossier}/${fichier} nomme encore ${nom}`);
      }
    }
  }
  // ⚠ LA PAGE AUSSI : le marqueur de l'atlas de fond de carte et la balise qui le
  // portait sont partis, et la variable CSS avec.
  const page = lire('src', 'index.src.html');
  assert.ok(!page.includes('%ATLAS_TERRAIN%'), 'le marqueur de l\'atlas de fond de carte est revenu');
  assert.ok(!page.includes('id="monde-atlas"'), 'la balise monde-atlas est revenue');
  // ⚠ ON RETIRE AUSSI LES COMMENTAIRES HTML : le paragraphe qui explique la
  // disparition de `--atlas-sol` la NOMME, et une garde qui lit sa propre prose
  // ne garde rien. Cinquième fois du dépôt — après `viewport-fit=cover`,
  // `MENTION_SATURE`, `variante.js`, `render/contour.js` et le calque des traits.
  const feuille = page.replace(/<!--[\s\S]*?-->/g, '');
  assert.ok(!feuille.includes('--atlas-sol'), '--atlas-sol est revenue dans la feuille');
  assert.ok(feuille.includes('--atlas-unite'),
    'montage : le filtre des commentaires a mangé la feuille entière');
  // ⚠ ET `%ATLAS_TERRAIN_BASE%` RESTE : c'est l'atlas des SPRITES de terrain —
  // champs, obstacles —, qui n'a jamais eu de rapport avec le fond de carte
  // malgré son nom court voisin. Le confondre serait l'accident des homonymes.
  assert.ok(page.includes('%ATLAS_TERRAIN_BASE%'),
    'l\'atlas des sprites de terrain est parti avec celui du fond de carte');
});

// ---------------------------------------------------------------------------
// SOL T11 — l'alignement des moyennes, lu dans le manifeste
// ---------------------------------------------------------------------------

test('SOL T11 — les huit planches sont ramenées à la même clarté', () => {
  // ⚠⚠ C'EST LE SEUL TRAITEMENT DU LOT, ET IL SE MESURE ICI. Les planches
  // arrivent de 148,7 à 162,2 de luminance moyenne — 13,5 sur 255, soit 5,4 % —,
  // et le sol se pave par blocs d'une planche entière : cet écart-là se lit comme
  // des taches. `tools/sols.py` ajoute une constante par canal, et rien d'autre.
  //
  // ⚠ NODE N'A PAS DE DÉCODEUR WEBP : ce test lit la moyenne que l'outil a
  // MESURÉE sur la planche alignée, pas une intention.
  const reference = MANIFESTE.reference;
  for (const nom of NOMS_DU_SOL) {
    const m = MANIFESTE.sols[nom].moyenne;
    for (let c = 0; c < 3; c += 1) {
      assert.ok(Math.abs(m[c] - reference[c]) < 1,
        `${nom} : canal ${c} à ${m[c]} contre ${reference[c]} attendu`);
    }
  }
  // ⚠ ET LA SONDE QUI PROUVE QUE LA MESURE MORD : les corrections ne sont pas
  // toutes nulles. Une chaîne qui cesserait d'aligner les rendrait nulles et ce
  // test-ci resterait vert sur des planches divergentes.
  const pire = Math.max(...NOMS_DU_SOL.map(
    (n) => Math.max(...MANIFESTE.sols[n].correction.map(Math.abs)),
  ));
  assert.ok(pire > 8, `la plus forte correction ne vaut que ${pire} : l'alignement ne fait plus rien`);

  // ⚠ ET LA QUALITÉ EST LA MÊME POUR LES HUIT — descendre celle d'une seule
  // planche pour gagner des octets serait rogner, ce que CLAUDE.md §5 refuse.
  const qualites = new Set(NOMS_DU_SOL.map((n) => MANIFESTE.sols[n].qualite));
  assert.deepEqual([...qualites], [75], 'les huit planches n\'ont plus la même qualité');
});

// ---------------------------------------------------------------------------
// SOL T12 — ce que le module refuse
// ---------------------------------------------------------------------------

test('SOL T12 — les entrées absurdes LÈVENT, elles ne se replient pas', () => {
  assert.throws(() => blocsDeLaDalle({ graine: 1, cran: 100, x0: 0, y0: 0, cote: 512 }), RangeError);
  assert.throws(() => blocsDeLaDalle({ graine: 1, cran: 64, x0: 0.5, y0: 0, cote: 512 }), RangeError);
  assert.throws(() => blocsDeLaDalle({ graine: 1, cran: 64, x0: 0, y0: 0, cote: 0 }), RangeError);
  assert.throws(() => profilDuBloc(10, 6), RangeError, 'un fondu plus large que la moitié passe');
  assert.throws(() => profilDuBloc(0, 0), RangeError);
  // ⚠ UNE DALLE VOIT AU MOINS UN BLOC, TOUJOURS. Zéro bloc rendrait une dalle
  // transparente, donc un carré du fond du canevas au milieu de la carte.
  for (const cran of ZOOM_CARTE.crans) {
    const blocs = blocsDeLaDalle({ graine: 5, cran, x0: 0, y0: 0, cote: TERRAIN_CARTE.dalleCotePx });
    assert.ok(blocs.length >= 1, `cran ${cran} : aucune planche ne couvre la dalle`);
    for (const b of blocs) {
      assert.ok(Number.isInteger(b.x) && Number.isInteger(b.y), 'une position de bloc est fractionnaire');
      assert.ok(b.sol >= 0 && b.sol < 8, `dessin hors table : ${b.sol}`);
    }
  }
});
