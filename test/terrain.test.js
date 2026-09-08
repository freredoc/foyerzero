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
  FAMILLES, SEL_FAMILLE, partOuvrageDeLaRangee, partDeTeinteDeLaRangee,
  partsCumulees, bruitDeFamille, rangeeDuBloc, familleDuBloc, arretsDeTeinte,
  COUDES_DE_TEINTE, DELTA_TEINTE,
} from '../src/render/terrain.js';
import { TERRAIN_CARTE, ZOOM_CARTE, PIXELS_SOURCE_PAR_CASE } from '../src/data/sites.js';
import { SEL_VARIANTE } from '../src/render/variante.js';
import { hachageBrut } from '../src/sim/peuplement.js';
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

test('SOL T1 — les vingt-deux planches ne peuvent pas diverger entre six endroits', () => {
  // ⚠⚠ SIX ÉCRITURES DE LA MÊME LISTE, ET AUCUNE N'EST LA SOURCE DES CINQ
  // AUTRES. La table du module nomme les dessins, l'outil les produit, le
  // dossier les porte, le manifeste les décrit, le build les inline, la page les
  // déclare. Chacune est indispensable là où elle est — un module pur ne lit pas
  // un dossier, un build ne lit pas un module ES — donc la seule chose à faire
  // est de les CONFRONTER. C'est la garde née de BÂTIMENTS-1024, appliquée ici.
  //
  // ⚠⚠ ELLES SONT VINGT-DEUX DEPUIS LE LOT SOL-OUVRAGE, EN QUATRE FAMILLES, et
  // ce test-ci a gagné le SEPTIÈME endroit qu'il doit tenir d'accord : la
  // découpe en familles, qui décide de ce qu'un bloc peut tirer. Le compte seul
  // ne suffirait plus — vingt-deux dessins mal répartis passeraient.
  assert.equal(NOMS_DU_SOL.length, 22, 'vingt-deux planches, pas une de plus');
  assert.deepEqual(FAMILLES.map((f) => f.nom), ['ocre', 'naturel', 'hybride', 'artificiel'],
    'les quatre familles ont changé de nom ou d\'ordre');
  assert.deepEqual(FAMILLES.map((f) => f.noms.length), [8, 7, 3, 4],
    'la découpe en familles a changé');
  // ⚠ ET L'OCRE EST EN TÊTE, ce qui n'est pas cosmétique : ses huit planches
  // gardent les rangs 0 à 7, donc `h % 8` vaut `h & 7` et le bas de la carte
  // tire les mêmes dessins qu'avant le lot. La déplacer rebattrait le désert.
  assert.deepEqual(NOMS_DU_SOL.slice(0, 8),
    Array.from({ length: 8 }, (_, i) => `sol_carte_${i + 1}`),
    'les huit ocres ne sont plus en tête de NOMS_DU_SOL');

  const surLeDisque = readdirSync(DOSSIER_SOL)
    .filter((n) => n.endsWith('.webp')).map((n) => n.replace(/\.webp$/, '')).sort();
  assert.deepEqual(surLeDisque, [...NOMS_DU_SOL].sort(), 'le dossier et la table divergent');
  assert.deepEqual(Object.keys(MANIFESTE.sols).sort(), [...NOMS_DU_SOL].sort(),
    'le manifeste et la table divergent');
  // ⚠ ET LE MANIFESTE DIT LA FAMILLE DE CHAQUE PLANCHE, pas seulement son nom :
  // c'est ce qui attrape un dessin rangé dans la mauvaise famille des deux côtés.
  for (const famille of FAMILLES) {
    for (const nom of famille.noms) {
      assert.equal(MANIFESTE.sols[nom].famille, famille.nom,
        `${nom} : le manifeste le range en « ${MANIFESTE.sols[nom].famille} »`);
    }
  }
  assert.deepEqual(MANIFESTE.familles, FAMILLES.map((f) => f.nom),
    'le manifeste et le module ne rangent pas les familles dans le même ordre');

  // ⚠ L'OUTIL PORTE LA MÊME DÉCOUPE, et on la lit dans sa table plutôt que dans
  // un patron : `tools/sols.py` a cessé de dériver ses planches d'un seul
  // `range(1, 9)` le jour où il y a eu quatre familles.
  const outil = lire('tools', 'sols.py');
  for (const famille of FAMILLES) {
    assert.ok(outil.includes(`('${famille.nom}', [f'`),
      `tools/sols.py ne porte plus la famille « ${famille.nom} »`);
  }

  const build = lire('tools', 'build.js');
  const page = lire('src', 'index.src.html');
  for (const nom of NOMS_DU_SOL) {
    const marqueur = `%${nom.toUpperCase()}%`;
    assert.ok(build.includes(`marqueur: '${marqueur}'`), `${marqueur} n'est pas inliné`);
    assert.ok(build.includes(`'${nom}.webp'`), `${nom}.webp n'est pas dans la table du build`);
    assert.ok(page.includes(`src="${marqueur}"`), `${marqueur} n'est pas posé dans la page`);
  }
  // ⚠ ET L'INVERSE : pas un marqueur de sol de plus que de planches. Un
  // vingt-troisième inliné sans dessin qui le pose pèserait 100 Kio pour rien.
  const marqueursSol = /%SOL_(?:CARTE|OUVRAGE)_[A-Z0-9_]+%/g;
  assert.equal((build.match(marqueursSol) ?? []).length, 22, 'le build inline autre chose');
  assert.equal((page.match(marqueursSol) ?? []).length, 22, 'la page déclare autre chose');
  for (let i = 1; i <= 22; i += 1) {
    assert.ok(page.includes(`<img id="sol-${i}"`), `la balise sol-${i} manque`);
  }
  assert.ok(!page.includes('<img id="sol-23"'), 'une vingt-troisième balise de sol est apparue');
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
    //
    // ⚠⚠ ET L'ÉCART N'EST PLUS TOUJOURS NUL DEPUIS LE LOT SOL-OUVRAGE — IL EST
    // RÉANCRÉ, PAS ASSOUPLI. Ce test exigeait ZÉRO partout, et c'était vrai du
    // fondu de 128 : ses quatre valeurs par cran étaient toutes PAIRES. Le fondu
    // suit maintenant le côté et vaut 72, donc **9 au cran le plus large, qui est
    // impair** — et un fondu impair a un pixel MILIEU, où le profil vaut
    // `sin²(π/4) = 0,5` exactement, donc `0,5 × 255 = 127,5` : les deux arrondis
    // montent à 128 et somment à 256.
    //
    // C'est le seul cas, il est déterministe, et on l'exige tel quel plutôt que
    // de borner à « au plus 1 » : la propriété est **zéro si le fondu est pair,
    // un au seul pixel du milieu s'il est impair**, ce qui est plus fort que ce
    // que ce test demandait avant. Mesuré : cran 32 fondu 9 → 1 au pixel 4 ;
    // crans 64, 128 et 256 fondus 18, 36 et 72 → 0 partout.
    let bande = 0;
    let ouBande = -1;
    for (let i = 0; i < fondu; i += 1) {
      const ecart = Math.abs(Math.round(p[i] * 255) + Math.round(p[i + pas] * 255) - 255);
      if (ecart > bande) { bande = ecart; ouBande = i; }
    }
    if (fondu % 2 === 0) {
      assert.equal(bande, 0, `cran ${cran} : fondu PAIR, la bande s'écarte de ${bande}/255`);
    } else {
      assert.equal(bande, 1, `cran ${cran} : fondu IMPAIR, la bande s'écarte de ${bande}/255`);
      assert.equal(ouBande, (fondu - 1) / 2,
        `cran ${cran} : l'écart tombe au pixel ${ouBande}, pas au milieu`);
      // ⚠ ET L'ÉCART VA VERS LE BAS, PAS VERS LE HAUT — le profil est SYMÉTRIQUE,
      // donc `p[milieu]` et son vis-à-vis à `pas` valent la MÊME chose, une
      // demie, et non `a` et `1 − a`. En flottant `sin²(π/4)` rend
      // 0,4999999999999999 : les deux arrondis descendent à 127 et somment à
      // **254**. C'est mesuré dans ce sens-là, pour qu'un jour où ils monteraient
      // à 256 ce test le dise au lieu de l'absorber.
      assert.ok(Math.abs(p[ouBande] - 0.5) < 1e-12,
        `cran ${cran} : le pixel du milieu vaut ${p[ouBande]}, une demie attendue`);
      assert.equal(Math.round(p[ouBande] * 255) + Math.round(p[ouBande + pas] * 255), 254,
        `cran ${cran} : l'écart du milieu ne va pas vers le bas`);
    }
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

test('SOL T8 — le tirage est stable, et il se répartit DANS chaque famille', () => {
  // ⚠⚠ LE TEST QUI COMPTE ICI EST CELUI DE LA DISTRIBUTION, et il est écrit pour
  // le défaut des « bits épuisés » : un champ lu dans les trois bits de tête d'un
  // mot déjà entamé est toujours minuscule, donc TOUTES les tuiles basculent du
  // même côté. Ça s'est vu à l'œil en une seconde pendant la maquette, et aucune
  // assertion de forme ne l'aurait attrapé.
  //
  // ⚠⚠ ET IL SE MESURE PAR FAMILLE DEPUIS LE LOT SOL-OUVRAGE. Il comptait les
  // huit dessins sur un balayage de blocs ; un balayage traverse maintenant les
  // quatre étages de la carte, donc les vingt-deux dessins n'y sont pas
  // équiprobables — et ils ne DOIVENT pas l'être. Ce qu'on garde est plus
  // précis : dans une bande de rangées où une famille est SEULE, ses dessins à
  // elle se répartissent également.
  const a = descriptionDuBloc(77, 3, 5);
  assert.deepEqual(descriptionDuBloc(77, 3, 5), a, 'le tirage n\'est pas stable');
  assert.notDeepEqual(descriptionDuBloc(78, 3, 5), a, 'la graine ne change plus rien');

  // Deux bandes où une seule famille peut sortir : le haut de la carte est
  // artificiel pur, le bas est ocre pur. On les DÉDUIT plutôt que de les écrire.
  const bandePure = (rang) => {
    const blocs = [];
    for (let by = -4; by < 500; by += 1) {
      const r = rangeeDuBloc(by);
      if (r < 1 || r > 300) continue;
      const { c1, c2, c3 } = partsCumulees(partOuvrageDeLaRangee(r));
      const seule = (rang === 3 && c3 === 1) || (rang === 0 && c1 === 0);
      if (seule) blocs.push(by);
    }
    return blocs;
  };
  for (const rang of [0, 3]) {
    const lignes = bandePure(rang);
    assert.ok(lignes.length >= 8,
      `la famille ${FAMILLES[rang].nom} n'a que ${lignes.length} rangées de blocs à elle`);
    const taille = FAMILLES[rang].noms.length;
    const debut = NOMS_DU_SOL.indexOf(FAMILLES[rang].noms[0]);
    const parSol = new Array(taille).fill(0);
    let n = 0;
    for (const by of lignes) {
      for (let bx = 0; bx < 400; bx += 1) {
        const d = descriptionDuBloc(31, by, bx);
        assert.equal(d.famille, rang,
          `bloc (${by}, ${bx}) : famille ${d.famille} dans une bande de ${rang}`);
        parSol[d.sol - debut] += 1;
        n += 1;
      }
    }
    for (let i = 0; i < taille; i += 1) {
      assert.ok(Math.abs(parSol[i] / n - 1 / taille) < 0.02,
        `${FAMILLES[rang].noms[i]} sort ${parSol[i]} fois sur ${n}, ${(n / taille).toFixed(0)} attendues`);
    }
  }

  // La rotation et le miroir, eux, ne dépendent d'aucune famille : ils se
  // mesurent sur le balayage entier.
  const parRotation = new Array(4).fill(0);
  let miroirs = 0;
  let n = 0;
  for (let by = 0; by < 120; by += 1) {
    for (let bx = 0; bx < 120; bx += 1) {
      const d = descriptionDuBloc(31, by, bx);
      parRotation[d.rotation] += 1;
      if (d.miroir) miroirs += 1;
      n += 1;
    }
  }
  for (let r = 0; r < 4; r += 1) {
    assert.ok(Math.abs(parRotation[r] / n - 1 / 4) < 0.02, `la rotation ${r} sort ${parRotation[r]} fois`);
  }
  assert.ok(Math.abs(miroirs / n - 0.5) < 0.02, `${miroirs} miroirs sur ${n}`);

  // ⚠⚠ ET LE BIAIS DE MODULO EXISTE MAINTENANT, IL EST DÉCLARÉ. Ce test exigeait
  // que le nombre de planches soit une PUISSANCE DE DEUX, « le jour où une
  // neuvième arriverait, le biais serait réel ». Ce jour est celui du lot
  // SOL-OUVRAGE : sept, trois et quatre ne divisent pas 2³², donc `h % n` penche
  // vers les petits restes. Le biais relatif vaut `n / 2³²` — **moins de 2⁻²⁹**
  // pour sept, un dessin sur cinq cents millions de blocs — et il est accepté,
  // comme `sim/poi.js` accepte le sien. L'assertion change donc de sens : elle
  // BORNE le biais au lieu d'exiger qu'il soit nul.
  //
  // ⚠ ET IL SE CALCULE EXACTEMENT, PAS EN ORDRE DE GRANDEUR. Le reste de
  // `2³² mod n` dit combien de restes reçoivent un tirage de plus : il vaut 4
  // pour sept, 1 pour trois, et **ZÉRO pour huit et quatre**, qui divisent 2³².
  // La majoration grossière `n / 2³²` aurait rangé l'ocre parmi les biaisées
  // alors qu'elle est exacte.
  for (const famille of FAMILLES) {
    const n2 = famille.noms.length;
    const biais = (2 ** 32 % n2) / 2 ** 32;
    assert.ok(biais < 2 ** -29,
      `la famille ${famille.nom} porte ${n2} dessins : biais de modulo ${biais}`);
  }
  assert.equal(2 ** 32 % FAMILLES[0].noms.length, 0, 'l\'ocre n\'est plus exacte');
  assert.equal(2 ** 32 % FAMILLES[3].noms.length, 0, 'l\'artificiel n\'est plus exact');
  assert.ok(2 ** 32 % FAMILLES[1].noms.length > 0,
    'sept diviserait 2³² : la borne ci-dessus ne garderait plus rien');
  // ⚠ ET L'OCRE RESTE EXACTE : huit divise 2³², donc `h % 8` vaut `h & 7`, donc
  // le bas de la carte tire exactement le dessin qu'il tirait avant le lot.
  assert.equal(FAMILLES[0].noms.length & (FAMILLES[0].noms.length - 1), 0,
    'la famille ocre n\'a plus un effectif en puissance de deux : le désert se rebat');
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
  // ⚠⚠ `partOuvrageDeLaRangee` A QUITTÉ CETTE LISTE AU LOT SOL-OUVRAGE, ET C'EST
  // UN RETOURNEMENT ASSUMÉ, PAS UN TROU. Elle y était depuis le 05/09 parce
  // qu'Ethan avait demandé « pas de fond ouvrage pour le moment » — avec la note
  // « à rouvrir » écrite le même jour dans `data/sites.js`. Ce lot la rouvre, et
  // ce n'est PAS la fonction d'alors : celle-là valait
  // `(niveauDeLaRangee(r) − 1) / (plafond − 1)`, la rampe du NIVEAU de site, et
  // faisait basculer le sol dès la deuxième rangée. La liste garde les quinze
  // autres noms, qui décrivent tous la moulinette à quantification — celle-là
  // reste morte.
  const partis = [
    'creerAtlas', 'rendreDalle', 'indicesDeTeinte', 'masqueDeLaTuile',
    'orientationDeLaTuile', 'descriptionDuNoeud',
    'teinteDeLaValeur', 'rangeeDuPixelSource', 'NB_TEINTES',
    'seuilsDeTeinte', 'seuilOuvrage', 'pasSourcePx', 'decalageFraction',
    'coteTuile', 'tuilesParCase',
  ];
  assert.equal(partis.length, 15, 'la liste des noms morts a changé de taille');
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
  assert.deepEqual([...qualites], [75], 'les vingt-deux planches n\'ont plus la même qualité');
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
      assert.ok(b.sol >= 0 && b.sol < NOMS_DU_SOL.length, `dessin hors table : ${b.sol}`);
    }
  }
});

// ===========================================================================
// SOL-OUVRAGE — la bascule du sol, 08/09
// ===========================================================================
//
// ⚠⚠ DEUX AXES SÉPARÉS, ET LES TESTS QUI SUIVENT LES GARDENT SÉPARÉMENT. La
// COULEUR du sol ne dépend que de la RANGÉE, le MOTIF ne dépend que du BLOC :
// c'est ce qui fait qu'aucune frontière de couleur ne peut apparaître, et c'est
// ce qu'il faut pouvoir casser indépendamment pour que ces gardes valent.

test('SOU T1 — les trois parts sont croissantes et ordonnées, sur toute la plage', () => {
  // ⚠⚠ C'EST LA PROPRIÉTÉ QUI GARANTIT QU'UN BLOC NE REDEVIENT JAMAIS PLUS
  // NATUREL QUAND ON MONTE. À bruit `u` fixé, faire croître `p` ne peut que faire
  // franchir des seuils vers l'artificiel : il faut donc que `c1`, `c2` et `c3`
  // croissent TOUTES, et qu'elles restent ordonnées `c1 ≥ c2 ≥ c3`. Si `c2`
  // dépassait `c1` quelque part, un bloc y serait hybride sans être non-ocre —
  // c'est-à-dire que la branche `u < c1` deviendrait morte sur cette plage.
  let precedent = { c1: -1, c2: -1, c3: -1 };
  for (let i = 0; i <= 1000; i += 1) {
    const p = i / 1000;
    const c = partsCumulees(p);
    for (const k of ['c1', 'c2', 'c3']) {
      assert.ok(c[k] >= precedent[k] - 1e-12, `${k} décroît à p = ${p}`);
      assert.ok(c[k] >= 0 && c[k] <= 1, `${k} sort de [0, 1] à p = ${p} : ${c[k]}`);
    }
    assert.ok(c.c1 >= c.c2 - 1e-12, `c1 < c2 à p = ${p}`);
    assert.ok(c.c2 >= c.c3 - 1e-12, `c2 < c3 à p = ${p}`);
    precedent = c;
  }
  // ⚠ ET LE MONTAGE MESURE QUELQUE CHOSE : les trois parts doivent réellement
  // parcourir leur plage, sinon « croissante » serait vrai d'une constante.
  assert.equal(partsCumulees(0).c1, 0, 'c1 ne part pas de zéro');
  assert.equal(partsCumulees(1).c3, 1, 'c3 n\'atteint pas un');
  assert.ok(partsCumulees(0.5).c1 > 0.5 && partsCumulees(0.5).c3 === 0,
    'les trois parts ne se séparent pas au milieu de la plage');
});

test('SOU T2 — le bas de la carte est INTACT : ocre pur, teinte nulle', () => {
  // ⚠⚠ « LE SOL D'AUJOURD'HUI, INTACT » EST UNE PROMESSE À DEUX MOITIÉS, et les
  // deux se mesurent ici. Le MOTIF : tout bloc qui touche une rangée du dernier
  // étage est ocre. La COULEUR : la teinte y vaut exactement zéro, donc les deux
  // dégradés de `ui/monde.js` sont noirs, donc `difference` et `lighter` y sont
  // l'identité. L'une sans l'autre laisserait le désert violacé, ou l'Ouvrage
  // ocre au milieu du désert.
  const pivot = TERRAIN_CARTE.ouvrage.rangeePivot;
  for (let r = pivot; r <= 300; r += 1) {
    assert.equal(partDeTeinteDeLaRangee(r), 0, `la teinte n'est pas nulle en rangée ${r}`);
    assert.equal(partOuvrageDeLaRangee(r), 0, `l'Ouvrage mord sur la rangée ${r}`);
  }
  // Tout bloc qui TOUCHE une rangée ≥ pivot, sur deux cents graines.
  const derniere = (by) => (by * PAS_SOURCE + COTE_SOURCE) / PIXELS_SOURCE_PAR_CASE + 1;
  const premiere = (by) => (by * PAS_SOURCE) / PIXELS_SOURCE_PAR_CASE + 1;
  const lignes = [];
  for (let by = 0; by < 200; by += 1) {
    if (derniere(by) >= pivot && premiere(by) <= 300) lignes.push(by);
  }
  assert.ok(lignes.length >= 20, `seulement ${lignes.length} rangées de blocs touchent le bas`);
  let vus = 0;
  for (let graine = 1; graine <= 200; graine += 1) {
    for (const by of lignes) {
      for (let bx = -1; bx <= 13; bx += 1) {
        // ⚠ ON N'EXIGE L'OCRE QUE DES BLOCS ENTIÈREMENT SOUS LE PIVOT : un bloc
        // à cheval déborde par le haut, et sa famille est décidée par son
        // CENTRE, qui peut être au-dessus. Ce qui compte pour « le bas est
        // intact » est qu'aucun bloc ne descende sous le pivot en étant violet.
        if (premiere(by) < pivot) continue;
        assert.equal(familleDuBloc(graine, by, bx), 0,
          `graine ${graine}, bloc (${by}, ${bx}) : famille non ocre sous la rangée ${pivot}`);
        vus += 1;
      }
    }
  }
  assert.ok(vus > 10000, `seulement ${vus} blocs mesurés`);
});

test('SOU T3 — les cinquante rangées du haut sont de l\'Ouvrage intact', () => {
  // ⚠⚠ LA CONDITION D'ETHAN, MOT POUR MOT : « il faut que la transition soit
  // finie pour qu'au moins les cinquante rangées du haut soient que des motifs
  // ouvrages intacts ». « Intact » se lit ARTIFICIEL — les dalles techniques
  // propres, pas le naturel violet ni l'hybride.
  //
  // ⚠⚠ ET C'EST LA PREMIÈRE RANGÉE TOUCHÉE QUI COMPTE, PAS LE CENTRE. Un bloc
  // dont le centre est en rangée 76 déborde de plus d'une rangée vers le haut :
  // mesurer sur le centre déclarerait pures des rangées qu'un bloc hybride
  // effleure. Le test énumère donc tout bloc dont la PREMIÈRE rangée est ≤ 50.
  const premiere = (by) => (by * PAS_SOURCE) / PIXELS_SOURCE_PAR_CASE + 1;
  const lignes = [];
  for (let by = -3; by < 60; by += 1) {
    const p = premiere(by);
    const d = (by * PAS_SOURCE + COTE_SOURCE) / PIXELS_SOURCE_PAR_CASE + 1;
    if (p <= 50 && d >= 1) lignes.push(by);
  }
  assert.ok(lignes.length >= 15, `seulement ${lignes.length} rangées de blocs mordent sur le haut`);
  let vus = 0;
  for (let graine = 1; graine <= 200; graine += 1) {
    for (const by of lignes) {
      // Toutes les colonnes de la carte, plus un bloc de marge de chaque côté.
      for (let bx = -1; bx <= 13; bx += 1) {
        assert.equal(familleDuBloc(graine, by, bx), 3,
          `graine ${graine}, bloc (${by}, ${bx}) : famille ${familleDuBloc(graine, by, bx)} `
          + `sur la rangée ${premiere(by).toFixed(2)}`);
        vus += 1;
      }
    }
  }
  assert.ok(vus > 10000, `seulement ${vus} blocs mesurés`);

  // ⚠ ET LA BORNE RÉELLE SE MESURE, elle ne se recopie pas du brief : c'est la
  // première rangée touchée par le bloc NON artificiel le plus haut. Elle dépend
  // de `COTE_SOURCE`, donc elle bougera le jour où le côté changera — d'où la
  // mesure ici plutôt qu'un nombre écrit.
  let pire = Infinity;
  for (let graine = 1; graine <= 200; graine += 1) {
    for (let by = -3; by < 80; by += 1) {
      const d = (by * PAS_SOURCE + COTE_SOURCE) / PIXELS_SOURCE_PAR_CASE + 1;
      if (d < 1) continue;
      for (let bx = -1; bx <= 13; bx += 1) {
        if (familleDuBloc(graine, by, bx) !== 3) pire = Math.min(pire, premiere(by));
      }
    }
  }
  assert.ok(pire > 50, `l'Ouvrage pur ne va que jusqu'à la rangée ${pire.toFixed(2)}, 50 exigées`);
  assert.ok(pire < 120, `montage : la mesure rend ${pire}, ce qui ne peut pas être la borne`);
});

test('SOU T4 — la famille d\'un bloc ne dépend PAS du cran de zoom', () => {
  // ⚠⚠ C'EST CE QUI FAIT QUE LA CARTE DES FAMILLES NE GLISSE PAS SOUS LE DOIGT
  // QUI PINCE. La rangée d'un bloc se calcule en pixels SOURCE ; passer par le
  // `pas` de `geometrieDuCran` — arrondi au cran — ferait changer une plaque de
  // famille d'un cran à l'autre, ce qui se lit comme un scintillement et
  // qu'aucun test de pixel ne verrait.
  for (let graine = 1; graine <= 20; graine += 1) {
    for (let by = -5; by < 60; by += 3) {
      for (let bx = -2; bx <= 12; bx += 3) {
        const attendu = familleDuBloc(graine, by, bx);
        for (const cran of ZOOM_CARTE.crans) {
          // On repasse par le vrai chemin de rendu : c'est lui qui doit être
          // stable, pas seulement la fonction pure.
          const { pas } = geometrieDuCran(cran);
          const blocs = blocsDeLaDalle({
            graine, cran, x0: bx * pas, y0: by * pas, cote: 8,
          });
          const ici = blocs.find((b) => b.x === 0 && b.y === 0);
          assert.ok(ici !== undefined, `cran ${cran} : le bloc (${by}, ${bx}) n'est pas rendu`);
          // ⚠ ON RETROUVE LA FAMILLE PAR LE DESSIN, pas par un champ que le rendu
          // porterait pour le seul confort du test : c'est la chaîne ENTIÈRE —
          // rangée, bruit, parts, rang dans la famille — qui doit être stable, et
          // c'est le nom du dessin qui la referme.
          const rang = FAMILLES.findIndex((f) => f.noms.includes(NOMS_DU_SOL[ici.sol]));
          assert.equal(rang, attendu,
            `bloc (${by}, ${bx}) : dessin ${NOMS_DU_SOL[ici.sol]} au cran ${cran}, `
            + `famille ${attendu} attendue`);
        }
      }
    }
  }
});

test('SOU T4 bis — la rangée annoncée est celle où le bloc TOMBE vraiment', () => {
  // ⚠⚠ CETTE GARDE A ÉTÉ ÉCRITE APRÈS UNE FALSIFICATION QUI NE MORDAIT PAS.
  // Décaler la formule de `rangeeDuBloc` — `PAS_SOURCE − 3` au lieu de
  // `PAS_SOURCE` — laissait la suite ENTIÈREMENT VERTE : `SOU T4` compare les
  // quatre crans entre eux, donc une formule fausse DE LA MÊME FAÇON partout y
  // reste stable, et `SOU T2`/`SOU T3` avaient trop de marge pour le voir. Rien
  // ne reliait la rangée ANNONCÉE à la position RÉELLE du bloc.
  //
  // ⚠ AU CRAN LE PLUS SERRÉ, L'ÉCHELLE VAUT UN : la géométrie d'écran EST la
  // géométrie source, donc l'égalité doit être EXACTE. C'est le seul cran où
  // rien n'est arrondi, et c'est celui qui ancre la formule.
  const serre = Math.max(...ZOOM_CARTE.crans);
  const g = geometrieDuCran(serre);
  assert.equal(g.taille, COTE_SOURCE, 'montage : le cran le plus serré n\'est plus au 1:1');
  for (let by = -5; by <= 60; by += 1) {
    const reelle = (by * g.pas + g.taille / 2) / serre + 1;
    assert.ok(Math.abs(rangeeDuBloc(by) - reelle) < 1e-9,
      `bloc ${by} : rangée annoncée ${rangeeDuBloc(by)}, réelle ${reelle}`);
  }

  // ⚠⚠ ET AUX AUTRES CRANS, L'ÉCART EST BORNÉ PAR LA DÉRIVE D'ARRONDI, QUI EST
  // CONNUE. `geometrieDuCran` arrondit le pas, donc la position physique d'un
  // bloc s'écarte d'au plus 0,18 % de sa position nominale au cran le plus
  // large — le module le déclare depuis SOL-SATELLITE en disant que ce 0,18 %
  // n'avait aucun lecteur. Il en a un depuis le lot SOL-OUVRAGE : le bord d'une
  // plaque bouge d'environ un quart de rangée au milieu de la carte quand on
  // pince. On BORNE cette dérive au lieu de la nier.
  for (const cran of ZOOM_CARTE.crans) {
    const gc = geometrieDuCran(cran);
    for (let by = -5; by <= 60; by += 1) {
      const reelle = (by * gc.pas + gc.taille / 2) / cran + 1;
      const derive = Math.abs(rangeeDuBloc(by) - reelle);
      const borne = Math.abs(by) * 0.0018 * (PAS_SOURCE / PIXELS_SOURCE_PAR_CASE) + 0.01;
      assert.ok(derive <= borne,
        `cran ${cran}, bloc ${by} : dérive de ${derive.toFixed(4)} rangée pour ${borne.toFixed(4)} tolérée`);
    }
  }
});

test('SOU T5 — le bruit de famille est LISSÉ, pas indépendant par bloc', () => {
  // ⚠⚠ UN TIRAGE PAR BLOC DONNERAIT DU POIVRE ET SEL, et c'est la seule chose
  // qui distingue ce bruit-ci d'un `hachageBrut` nu. On le mesure par la
  // CORRÉLATION entre voisins : deux blocs de la même maille lisent les mêmes
  // nœuds, donc leurs bruits sont proches ; deux blocs éloignés, non.
  const ecart = (d) => {
    let somme = 0;
    let n = 0;
    for (let by = 0; by < 60; by += 1) {
      for (let bx = 0; bx < 60; bx += 1) {
        somme += Math.abs(bruitDeFamille(7, by, bx) - bruitDeFamille(7, by, bx + d));
        n += 1;
      }
    }
    return somme / n;
  };
  const voisin = ecart(1);
  const loin = ecart(37);
  // ⚠ LES DEUX SEUILS SONT MESURÉS, PAS DEVINÉS. Un bruit de valeur interpolé
  // n'est PAS uniforme : sa moyenne se concentre autour d'une demie, et deux
  // valeurs décorrélées s'y écartent de **0,240** en moyenne, non de 1/3.
  // Relevé : distance 1 → 0,1385 · 2 → 0,2076 · 3 → 0,2393 · 37 → 0,2397. Le
  // plateau est atteint dès trois blocs, ce qui EST la taille de plaque voulue.
  assert.ok(loin > 0.20, `des blocs éloignés ne s'écartent que de ${loin.toFixed(3)} : le bruit est plat`);
  assert.ok(voisin < 0.75 * loin,
    `des blocs voisins s'écartent de ${voisin.toFixed(3)} contre ${loin.toFixed(3)} au loin : `
    + 'le bruit n\'est pas lissé');

  // ⚠⚠ ET LE CONTRE-CAS EST UN HACHAGE NU, ce qui est très exactement ce qu'on
  // aurait écrit sans réfléchir. Sans lui, « voisin < 0,75 × loin » pourrait
  // être vrai d'un bruit à peine corrélé ; avec lui, on mesure la DIFFÉRENCE
  // entre les deux écritures sur le même montage.
  let nu = 0;
  let n = 0;
  for (let by = 0; by < 60; by += 1) {
    for (let bx = 0; bx < 60; bx += 1) {
      nu += Math.abs(hachageBrut(7, by, bx, SEL_FAMILLE) / 0x100000000
        - hachageBrut(7, by, bx + 1, SEL_FAMILLE) / 0x100000000);
      n += 1;
    }
  }
  nu /= n;
  assert.ok(nu > 2 * voisin,
    `un hachage nu s'écarte de ${nu.toFixed(3)} entre voisins contre ${voisin.toFixed(3)} `
    + 'pour le bruit lissé : le lissage ne fait rien');

  // ⚠ ET IL RESTE DANS [0, 1), sinon les comparaisons aux parts cumulées
  // laisseraient des blocs sans famille — ou toujours la même.
  let min = Infinity;
  let max = -Infinity;
  for (let by = -20; by < 80; by += 1) {
    for (let bx = -20; bx < 80; bx += 1) {
      const u = bruitDeFamille(3, by, bx);
      min = Math.min(min, u);
      max = Math.max(max, u);
    }
  }
  assert.ok(min >= 0 && max < 1, `le bruit sort de [0, 1) : ${min} … ${max}`);
  assert.ok(min < 0.01 && max > 0.99, `le bruit ne parcourt que ${min} … ${max}`);

  // ⚠⚠ ET LES INDICES NÉGATIFS NE REPLIENT PAS LA MAILLE. `Math.trunc(-1 / 2)`
  // rend 0 quand `Math.floor` rend −1 : avec une troncature, la maille se
  // replierait de part et d'autre de l'origine et la carte porterait une couture
  // invisible en test et flagrante à l'écran. On mesure la CONTINUITÉ à travers
  // zéro, qui est ce que le repli casserait.
  //
  // ⚠⚠ ET CETTE GARDE-CI A ÉTÉ ÉCRITE APRÈS LA MESURE, PARCE QUE LA PREMIÈRE NE
  // MORDAIT PAS. Elle balayait `bx` de −3 à 3 sur UNE graine avec un seuil de
  // 0,7 : la falsification `Math.trunc` la laissait VERTE. Mesuré sur trente
  // graines et les deux axes de −6 à 6, le pire saut entre blocs voisins vaut
  // **0,4825 avec `floor` et 0,9948 avec `trunc`** — presque toute la plage, à
  // `bx = −4`. Le seuil tient entre les deux, et le balayage est assez large
  // pour rencontrer le cas.
  const maille = TERRAIN_CARTE.ouvrage.mailleBlocs;
  let pireSaut = 0;
  let ouSaut = '';
  for (let graine = 1; graine <= 30; graine += 1) {
    for (let by = -6; by <= 6; by += 1) {
      for (let bx = -6; bx <= 6; bx += 1) {
        const ici = bruitDeFamille(graine, by, bx);
        for (const [dy, dx] of [[0, 1], [1, 0]]) {
          const saut = Math.abs(ici - bruitDeFamille(graine, by + dy, bx + dx));
          if (saut > pireSaut) { pireSaut = saut; ouSaut = `(${by}, ${bx}) + (${dy}, ${dx})`; }
        }
      }
    }
  }
  assert.ok(pireSaut < 0.7,
    `saut de ${pireSaut.toFixed(4)} entre blocs voisins en ${ouSaut} : la maille se replie `
    + '— `Math.trunc` au lieu de `Math.floor` ?');
  assert.ok(pireSaut > 0.2,
    `montage : le pire saut ne vaut que ${pireSaut.toFixed(4)}, le balayage ne mesure rien`);
  assert.ok(maille >= 2, 'une maille de 1 bloc rendrait le poivre et sel');
});

test('SOU T6 — le sel du tirage de famille n\'est partagé avec personne', () => {
  // ⚠ DEUX TIRAGES SANS RAPPORT QUI PARTAGENT UN SEL FINISSENT PAR SE CORRÉLER.
  // Le sel de la famille est neuf : `SEL_BLOC` porte déjà le dessin, la rotation
  // et le miroir, et les faire sortir du même mot ferait pencher une famille vers
  // une orientation.
  assert.notEqual(SEL_FAMILLE, SEL_BLOC, 'la famille partage le sel du pavage');
  assert.notEqual(SEL_FAMILLE, SEL_VARIANTE, 'la famille partage le sel des variantes');
  assert.notEqual(SEL_FAMILLE, SEL_FOND, 'la famille partage le sel des décors');
  assert.notEqual(SEL_FAMILLE, SEL_RANGEE, 'la famille partage un sel de sim/poi.js');
  assert.notEqual(SEL_FAMILLE, SEL_COLONNE, 'la famille partage un sel de sim/poi.js');
  // 0 et 1 sont ceux du peuplement.
  assert.ok(SEL_FAMILLE > 1, 'la famille partage un sel du peuplement');
});

test('SOU T7 — la teinte a ses coudes, et les arrêts de dégradé les portent', () => {
  // ⚠⚠ DEUX ARRÊTS NE SUFFISENT PAS QUAND UNE DALLE ENJAMBE UN COUDE. La rampe
  // est linéaire PAR MORCEAUX : sans arrêt au coude, le navigateur interpole en
  // droite là où la fonction casse, et deux dalles voisines cassent à des
  // endroits différents — le raccord se voit, en biais.
  const { rangeePivot, largeurTeinte } = TERRAIN_CARTE.ouvrage;
  assert.deepEqual([...COUDES_DE_TEINTE], [rangeePivot - largeurTeinte, rangeePivot],
    'les coudes ne se dérivent plus de la rampe');

  const cote = TERRAIN_CARTE.dalleCotePx;
  for (const cran of ZOOM_CARTE.crans) {
    for (const coude of COUDES_DE_TEINTE) {
      // Une dalle qui contient le coude en son milieu.
      const y0 = Math.round((coude - 1) * cran - cote / 2);
      const arrets = arretsDeTeinte(y0, cote, cran);
      assert.ok(arrets.length >= 3,
        `cran ${cran}, coude ${coude} : ${arrets.length} arrêts, le coude n'en a pas`);
      // Les arrêts sont rangés et bornés — `addColorStop` refuse le reste.
      for (let i = 0; i < arrets.length; i += 1) {
        assert.ok(arrets[i].s >= 0 && arrets[i].s <= 1, `arrêt hors de [0, 1] : ${arrets[i].s}`);
        if (i > 0) assert.ok(arrets[i].s >= arrets[i - 1].s, 'les arrêts ne sont pas rangés');
      }
      // ⚠ ET L'ARRÊT DU COUDE TOMBE SUR LA VALEUR DE LA FONCTION, pas sur
      // l'interpolation des deux bords : c'est tout ce qu'on lui demande.
      const s = ((coude - 1) * cran - y0) / cote;
      const auCoude = arrets.find((a) => Math.abs(a.s - s) < 1e-9);
      assert.ok(auCoude !== undefined, `cran ${cran} : pas d'arrêt au coude ${coude}`);
      assert.equal(auCoude.t, partDeTeinteDeLaRangee(coude),
        `cran ${cran} : l'arrêt du coude ${coude} ne porte pas la teinte du coude`);
    }
  }

  // ⚠⚠ ET LES ARRÊTS SE CALCULENT EN COORDONNÉES ABSOLUES DE CARTE. C'est
  // l'invariant du module : une zone rendue en une dalle doit être identique à la
  // même rendue en quatre. On le mesure en découpant une dalle en deux et en
  // exigeant que la teinte d'une même rangée soit la même des deux côtés.
  const cran = 64;
  const y0 = (TERRAIN_CARTE.ouvrage.rangeePivot - 1) * cran - 300;
  const entiere = arretsDeTeinte(y0, cote, cran);
  const haute = arretsDeTeinte(y0, cote / 2, cran);
  const basse = arretsDeTeinte(y0 + cote / 2, cote / 2, cran);
  const teinteA = (arrets, y0d, coted, y) => {
    const s = (y - y0d) / coted;
    for (let i = 1; i < arrets.length; i += 1) {
      if (s <= arrets[i].s + 1e-12) {
        const a = arrets[i - 1];
        const b = arrets[i];
        return a.t + ((b.t - a.t) * (s - a.s)) / (b.s - a.s || 1);
      }
    }
    return arrets[arrets.length - 1].t;
  };
  for (let y = y0; y < y0 + cote; y += 7) {
    const dansUne = teinteA(entiere, y0, cote, y);
    const dansDeux = y < y0 + cote / 2
      ? teinteA(haute, y0, cote / 2, y)
      : teinteA(basse, y0 + cote / 2, cote / 2, y);
    assert.ok(Math.abs(dansUne - dansDeux) < 1e-9,
      `y = ${y} : teinte ${dansUne} en une dalle, ${dansDeux} en deux`);
    // Et les deux valent la fonction, pas une interpolation approchée.
    assert.ok(Math.abs(dansUne - partDeTeinteDeLaRangee(y / cran + 1)) < 1e-9,
      `y = ${y} : le dégradé s'écarte de la rampe`);
  }
});

test('SOU T8 — la soustraction ne se replie nulle part, et la marge est mesurée', () => {
  // ⚠⚠ `difference` REND `|d − s|`, DONC LA SOUSTRACTION N'EST EXACTE QUE SI LE
  // SOL RESTE AU-DESSUS DE CE QU'ON LUI RETIRE. En dessous, le pixel BRILLE au
  // lieu de s'assombrir — et personne ne le verrait avant des semaines.
  //
  // ⚠⚠ CE TEST DOIT CASSER SI UNE PLANCHE ENTRE PLUS SOMBRE, PAS S'ASSOUPLIR.
  // C'est la seule chose qui protège le sol, et la marge sur le vert était de
  // ZÉRO avant que `tools/sols.py` ne pose son plancher de stockage : mesuré, la
  // réduction Lanczos et l'encodage WebP faisaient tomber le minimum à 16 pour
  // une soustraction de 21.
  const soustraitRouge = Math.round(-DELTA_TEINTE[0]);
  const soustraitVert = Math.round(-DELTA_TEINTE[1]);
  assert.equal(soustraitRouge, 69, 'la soustraction du rouge a changé');
  assert.equal(soustraitVert, 21, 'la soustraction du vert a changé');
  assert.ok(DELTA_TEINTE[2] > 0, 'le bleu n\'est plus ajouté mais retiré');

  const min = MANIFESTE.minimumParCanal;
  assert.ok(Array.isArray(min) && min.length === 3,
    'le manifeste ne porte plus les minimums par canal');
  assert.ok(min[0] >= soustraitRouge,
    `minimum rouge ${min[0]} pour une soustraction de ${soustraitRouge} : le sol brillerait`);
  assert.ok(min[1] >= soustraitVert,
    `minimum vert ${min[1]} pour une soustraction de ${soustraitVert} : le sol brillerait`);
  // ⚠ LE BLEU N'A PAS DE PLANCHER : il n'est jamais soustrait, seulement ajouté
  // par `lighter`, qui sature. Son minimum de 4 est sans objet, et le dire évite
  // qu'on l'aligne un jour sur les deux autres pour faire joli.
  assert.ok(min[2] >= 0, 'montage : le manifeste ne porte pas de minimum bleu');

  // ⚠ ET LE MANIFESTE PORTE LE PLANCHER QUI REND ÇA VRAI, sinon la garde
  // mesurerait un fait sans savoir ce qui le produit.
  assert.deepEqual(MANIFESTE.plancher, [80, 32, 0], 'le plancher de stockage a changé');
  assert.ok(MANIFESTE.plancher[0] > soustraitRouge && MANIFESTE.plancher[1] > soustraitVert,
    'le plancher ne domine plus la soustraction : l\'encodage peut repasser dessous');
  // Onze pixels sur 6,9 millions — le prix, mesuré, et il doit rester dérisoire.
  const touches = Object.values(MANIFESTE.sols).reduce((s, e) => s + e.plancherPixels, 0);
  assert.ok(touches < 1000, `le plancher touche ${touches} pixels : ce n'est plus un cas limite`);
});

test('SOU T9 — le module et le manifeste s\'accordent sur la translation', () => {
  // ⚠ `render/` EST PUR : il ne lit aucun fichier, donc `DELTA_TEINTE` est écrit
  // au code et MESURÉ par l'outil. C'est ici que les deux se confrontent — au
  // dépôt, pas chez le joueur. Même motif que `COTE_SOURCE`.
  assert.deepEqual([...DELTA_TEINTE], MANIFESTE.delta,
    'DELTA_TEINTE et le manifeste ne disent pas la même translation');
  // ⚠ ET LE REPÈRE RESTE L'OCRE, pas la moyenne des vingt-deux : le recalculer
  // sur l'ensemble déplacerait le sol du bas de trente niveaux vers le violet.
  const ocres = FAMILLES[0].noms.map((n) => MANIFESTE.sols[n].moyenne);
  for (const m of ocres) {
    for (let c = 0; c < 3; c += 1) {
      assert.ok(Math.abs(m[c] - MANIFESTE.reference[c]) < 1,
        `une planche ocre est à ${m[c]} du repère ${MANIFESTE.reference[c]}`);
    }
  }
  // La référence violette est bien le repère plus la translation.
  for (let c = 0; c < 3; c += 1) {
    assert.ok(Math.abs(MANIFESTE.reference[c] + MANIFESTE.delta[c]
      - MANIFESTE.referenceViolette[c]) < 0.01,
    `canal ${c} : le repère plus la translation ne fait pas la référence violette`);
  }
  // ⚠ ET L'ÉCRÊTAGE EST SOUS LE POUR-CENT, la borne que le brief pose comme
  // point d'arrêt. Il vaut 0,2256 % — mesuré, pas supposé.
  assert.ok(MANIFESTE.ecretagePourCentTotal < 1,
    `écrêtage de ${MANIFESTE.ecretagePourCentTotal} % : au-delà du pour-cent, on s'arrête`);
});

test('SOU T10 — une bande rendue en une dalle est identique à la même rendue en quatre', () => {
  // ⚠⚠ C'EST L'INVARIANT DU MODULE, ET LE LOT SOL-OUVRAGE LUI DONNE UN SECOND
  // ÉCUEIL. Le premier est le PAVAGE : la grille de blocs est semée par la
  // position absolue, donc deux dalles voisines se raccordent. Le second est la
  // TEINTE : elle se calcule en coordonnées absolues de carte, avec un arrêt de
  // dégradé à chaque coude enjambé. Oublier l'un ou l'autre donne des bandes
  // horizontales de la taille d'une dalle, ou un raccord en biais au coude.
  //
  // ⚠ ON SIMULE LE RENDU EN PUR, faute de canevas (`CLAUDE.md` §3 : le dépôt n'a
  // ni jsdom ni navigateur). La valeur d'un pixel est `Σ w·v` sur les blocs qui
  // le couvrent — c'est ce que `lighter` calcule dans `ui/monde.js` — puis la
  // teinte s'applique par canal, avec l'arrondi ENTIER que peint un dégradé de
  // canevas. C'est l'idiome de `SOL T3`, étendu à la couleur.
  const cran = 64;
  const [dr, dv, db] = DELTA_TEINTE;

  // Une planche factice mais déterministe : ce qui compte est que deux blocs de
  // dessins différents ne rendent pas la même chose.
  const V = (sol, i, j, canal) => 40 + ((sol * 37 + i * 5 + j * 11 + canal * 23) % 180);

  const rendre = (x0, y0, cote) => {
    const { taille, fondu } = geometrieDuCran(cran);
    const profil = profilDuBloc(taille, fondu);
    const px = new Float64Array(cote * cote * 3);
    for (const b of blocsDeLaDalle({ graine: 4242, cran, x0, y0, cote })) {
      for (let j = 0; j < taille; j += 1) {
        const y = b.y + j;
        if (y < 0 || y >= cote) continue;
        for (let i = 0; i < taille; i += 1) {
          const x = b.x + i;
          if (x < 0 || x >= cote) continue;
          const w = profil[j] * profil[i];
          for (let c = 0; c < 3; c += 1) px[(y * cote + x) * 3 + c] += w * V(b.sol, i, j, c);
        }
      }
    }
    // La teinte, exactement comme `peindreLaTeinte` la peint : deux passes sur
    // des canaux disjoints, arrêts aux coudes, interpolation linéaire entre eux.
    const arrets = arretsDeTeinte(y0, cote, cran);
    const tDe = (y) => {
      const s = (y + 0.5) / cote;
      for (let k = 1; k < arrets.length; k += 1) {
        if (s <= arrets[k].s) {
          const a = arrets[k - 1];
          const z = arrets[k];
          return z.s === a.s ? z.t : a.t + ((z.t - a.t) * (s - a.s)) / (z.s - a.s);
        }
      }
      return arrets[arrets.length - 1].t;
    };
    for (let y = 0; y < cote; y += 1) {
      const t = tDe(y);
      const sr = Math.round(-dr * t);
      const sv = Math.round(-dv * t);
      const ab = Math.round(db * t);
      for (let x = 0; x < cote; x += 1) {
        const k = (y * cote + x) * 3;
        px[k] = Math.abs(px[k] - sr);
        px[k + 1] = Math.abs(px[k + 1] - sv);
        px[k + 2] = Math.min(255, px[k + 2] + ab);
      }
    }
    return px;
  };

  // ⚠⚠ ON PASSE PAR LES DEUX COUDES, ET LE MONTAGE PROUVE QU'IL LES ENJAMBE.
  // Sans cette moitié-là, ce test serait vert sur n'importe quel code : c'est
  // au COUDE que « deux arrêts suffisent » cesse d'être vrai.
  const cote = 256;
  for (const coude of COUDES_DE_TEINTE) {
    const y0 = Math.round((coude - 1) * cran) - cote;
    const x0 = 3 * cote;
    assert.ok((coude - 1) * cran > y0 && (coude - 1) * cran < y0 + 2 * cote,
      `montage : la bande n'enjambe pas le coude ${coude}`);

    // ⚠ ET LA GRANDEUR QUI DOIT VARIER EST LA SOUSTRACTION ENTIÈRE, pas `t`. La
    // rampe s'étale sur 130 rangées et une bande n'en couvre que huit : `t` n'y
    // bouge que de 3 centièmes, ce qui est VOULU — c'est ce qui rend la bascule
    // invisible. Ce qui compte est que la couleur PEINTE change, sinon la moitié
    // couleur de ce test ne mesurerait rien.
    const srDe = (y) => Math.round(-dr * partDeTeinteDeLaRangee(y / cran + 1));
    const amplitude = Math.abs(srDe(y0) - srDe(y0 + 2 * cote));
    assert.ok(amplitude >= 2,
      `montage : au coude ${coude}, la soustraction ne varie que de ${amplitude} niveaux`);

    // La même surface, en une dalle de 2×2 quartiers puis en quatre dalles.
    const grande = rendre(x0, y0, 2 * cote);
    for (const [qy, qx] of [[0, 0], [0, 1], [1, 0], [1, 1]]) {
      const petite = rendre(x0 + qx * cote, y0 + qy * cote, cote);
      for (let y = 0; y < cote; y += 1) {
        for (let x = 0; x < cote; x += 1) {
          for (let c = 0; c < 3; c += 1) {
            const a = grande[(((qy * cote + y) * 2 * cote) + (qx * cote + x)) * 3 + c];
            const b = petite[(y * cote + x) * 3 + c];
            assert.ok(Math.abs(a - b) < 1e-9,
              `coude ${coude}, quartier (${qy}, ${qx}), pixel (${x}, ${y}) canal ${c} : `
              + `${a} contre ${b}`);
          }
        }
      }
    }
  }
});
