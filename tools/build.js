// Build de Chantier : src/ → dist/index.html, un seul fichier HTML autonome.
//
// Contrat :
//   - esbuild seul, version épinglée (package.json), aucune dépendance
//     transitive ; fonctionne sans réseau une fois `npm ci` passé ;
//   - TOUT est inliné : le HTML final ne référence aucune ressource externe,
//     et le build SORT EN ERREUR s'il en détecte une — l'offline est non
//     négociable. Les IMAGES aussi : l'atlas de terrain de la carte entre en
//     `data:` à la place de son marqueur, et son absence est une erreur de
//     build, pas une carte muette ;
//   - dist/ est un produit de build : jamais commité.
//
// Le point d'entrée JS est le <script type="module"> inline de
// src/index.src.html : il est extrait, bundlé avec esbuild (résolution des
// imports relatifs depuis src/), puis réinjecté inline en IIFE.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';
// ⚠⚠ LA FAMILLE DES SONS SE LIT DANS LA TABLE QUE LE JEU LIT, ELLE NE SE
// RECOPIE PAS. 263 marqueurs écrits à la main, ce seraient 263 occasions d'en
// oublier un — et la faute serait MUETTE : un marqueur absent de cette table
// resterait tel quel dans le HTML, la garde offline n'y verrait pas d'adresse,
// et le son manquerait sans que rien ne lève. En important `SONS`, tout son que
// le jeu connaît DOIT avoir son fichier, et la garde « marqueur sans fichier »
// juste en dessous le dit.
import { SONS } from '../src/data/sons.js';
// ⚠ ET L'IDENTIFIANT DOM VIENT DE LA MÊME FONCTION QUE CELLE QUI LE RELIT.
// `src/ui/son.js` cherche ses balises par `idDuSon` ; les fabriquer ici avec un
// second `replaceAll` marcherait aujourd'hui et divergerait au premier son dont
// le nom sort du moule. Une dérivation, un seul endroit.
import { idDuSon } from '../src/ui/son.js';

const racine = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Échec explicite : message clair, code de sortie non nul. */
function echec(message) {
  console.error(`\nBUILD EN ÉCHEC — ${message}`);
  process.exit(1);
}

// --- lecture des sources ----------------------------------------------------

const pkg = JSON.parse(readFileSync(join(racine, 'package.json'), 'utf8'));
const version = pkg.version;
const build = pkg.config?.build ?? '0';

const cheminHtml = join(racine, 'src', 'index.src.html');
const htmlSource = readFileSync(cheminHtml, 'utf8');

// --- les balises des sons ---------------------------------------------------

// ⚠⚠ 263 BALISES NE S'ÉCRIVENT PAS À LA MAIN DANS LE HTML. Le lot précédent en
// posait quatre, ce qui se relit ; à 263 ce serait deux cent soixante-trois
// occasions d'oublier un attribut, et la faute serait MUETTE — un son sans
// balise reste simplement silencieux. Le HTML porte donc UN marqueur, et ce
// build y écrit la famille entière, dans l'ordre de la table.
//
// ⚠ `preload="none"` EST OBLIGATOIRE : sans lui, le navigateur préchargerait
// 263 `data:` au chargement de la page, c'est-à-dire exactement le démarrage
// non instantané que ce lot s'interdit. Rien ne lit jamais ces balises comme
// des lecteurs audio — `src/ui/son.js` ne fait que relire leur attribut `src`
// et le décoder par `atob`.
const MARQUEUR_BALISES_SON = '%BALISES_SON%';

const balisesSon = Object.keys(SONS)
  .map((nom) => `<audio id="${idDuSon(nom)}" preload="none" src="%SON_${nom.toUpperCase()}%"></audio>`)
  .join('\n');

// --- extraction du point d'entrée -------------------------------------------

const motifEntree = /<script\s+type="module">([\s\S]*?)<\/script>/;
const entree = htmlSource.match(motifEntree);
if (!entree) {
  echec(`aucun <script type="module"> inline trouvé dans ${cheminHtml}`);
}

// --- bundle ------------------------------------------------------------------

const resultat = await esbuild.build({
  stdin: {
    contents: entree[1],
    resolveDir: join(racine, 'src'),
    sourcefile: 'index.src.html <script>',
    loader: 'js',
  },
  bundle: true,
  minify: true,
  format: 'iife',
  platform: 'browser',
  target: 'es2020',
  legalComments: 'none',
  write: false,
});

const js = resultat.outputFiles[0].text.trim();
if (js.includes('</script')) {
  echec('le bundle contient « </script » : injection inline impossible sans corruption du HTML');
}

// --- assemblage ---------------------------------------------------------------

let html = htmlSource
  .replace(motifEntree, () => `<script>${js}</script>`)
  .replaceAll(MARQUEUR_BALISES_SON, balisesSon)
  .replaceAll('%VERSION%', version)
  .replaceAll('%BUILD%', build)
  // Les commentaires HTML ne portent rien dans le livrable.
  .replace(/<!--[\s\S]*?-->/g, '');

// --- les images inlinées ------------------------------------------------------
//
// ⚠ ELLES N'ENTRENT PAS PAR ESBUILD, ET C'EST DÉLIBÉRÉ. Un `import` de PNG
// obligerait `src/ui/` à porter une extension que `node --test` ne sait pas
// charger : le module de la carte deviendrait intestable ici, alors que tout ce
// qui n'est pas le DOM l'est. Le HTML porte donc un marqueur, ce build met le
// `data:` dedans, et l'écran relit l'image par son identifiant — du DOM
// ordinaire.
//
// ⚠ ET UN MARQUEUR SANS FICHIER EST UNE ERREUR, PAS UN AVERTISSEMENT. Livrer
// une carte au fond noir parce qu'un PNG a été oublié dans une archive est
// exactement le genre de panne qui se découvre sur l'appareil.

// ⚠ AUCUN MARQUEUR N'EST PRÉFIXE D'UN AUTRE, ET C'EST LE `%` FINAL QUI LE TIENT.
// Le cas d'école était `%ATLAS_TERRAIN%` et `%ATLAS_TERRAIN_BASE%`, qui
// partageaient quatorze caractères : sans le `%` de fin, le premier
// `replaceAll` aurait mangé la tête du second et laissé un `_BASE%` orphelin
// dans le HTML — la garde offline n'y aurait rien vu, et l'écran aurait affiché
// la carte du monde sous les bâtiments. Le premier est parti au lot
// SOL-SATELLITE ; la règle reste, et un test la vérifie sur toute la table.
//
// ⚠ ET ON N'EN DÉCLARE PAS « POUR PLUS TARD ». Les cinq familles restantes —
// socle, defense, unite, tourelle-unite, carte — ne sont pas cousues : les
// inscrire ici ferait cinq entrées mortes, et la garde « marqueur sans fichier »
// ne les verrait jamais, puisqu'elle ne regarde que les marqueurs PRÉSENTS dans
// le HTML. Chaque famille entre avec le lot qui la consomme.
// ⚠⚠ LA GRILLE EMBARQUÉE TIENT EN UNE CONSTANTE, ET UNE SEULE. Les atlas sont
// cousus en 64 ET en 128 depuis le lot PIXELS ; c'est ce nombre-ci qui décide
// de celle qui entre dans le livrable. L'écrire dix fois dans la table
// ci-dessous, ce serait dix occasions d'en oublier une, et la faute serait
// MUETTE : le build inlinerait un atlas de 128 dont l'index dit 64, les
// cellules seraient adressées au quart, et rien ne lèverait.
//
// ⚠ ET IL DOIT S'ACCORDER AVEC `COTE_SPRITE` DE `src/data/atlas.js`, que
// `tools/atlas.py` écrit depuis son `COTE_INDEX`. Les changer ensemble est le
// geste complet ; `test/sprite.test.js` refuse qu'ils divergent.
const GRILLE_ATLAS = 128;

// ⚠⚠ WEBP DEPUIS LE LOT PIXELS. Les sprites ne sont plus quantifiés sur quatorze
// teintes : en PNG les huit atlas passeraient de 468 à 1 630 Kio, ×3,5. Le type
// MIME suit le fichier — un `image/png` sur des octets WebP ferait afficher du
// vide, sans erreur, exactement comme un rectangle source non fini.
const atlas = (slug) => ({
  marqueur: `%ATLAS_${slug.toUpperCase()}%`,
  chemin: ['art', 'sprites', `atlas-${slug}-${GRILLE_ATLAS}.webp`],
  type: 'image/webp',
});

// ⚠ LA TABLE A CESSÉ DE NE PORTER QUE DES IMAGES — lot SON-MOTEUR, 04/09. Les
// quatre sons témoins entrent par le même mécanisme, et le nom suit : une table
// nommée « images » qui porterait de l'audio mentirait au premier relecteur.
// Le type MIME est déjà par entrée, donc rien d'autre ne change.
const FICHIERS_INLINE = [
  // ⚠⚠ LES HUIT PLANCHES DU SOL DE CARTE — lot SOL-SATELLITE, 05/09. Elles
  // remplacent `%ATLAS_TERRAIN%`, qui portait l'atlas indexé de 64 tuiles du
  // fond de carte : 224 548 octets de PNG, soit 299 400 en base64. Ethan a livré
  // huit planches satellite et demandé « le moins de traitement possible » ; le
  // sol n'est donc plus accumulé ni requantifié, il est posé tel quel.
  //
  // ⚠⚠ ELLES PÈSENT 1 674 196 OCTETS EN WEBP q75, SOIT 2 232 264 EN BASE64, ET
  // C'EST LE POSTE LE PLUS LOURD DU LIVRABLE. Le réglage est celui des huit
  // décors de base — voir `tools/sols.py`, qui porte les paliers mesurés et dit
  // pourquoi la résolution ne se touche pas.
  //
  // ⚠ ET ELLES NE SONT PAS DANS UN ATLAS, parce qu'aucun atlas ne peut les
  // prendre : `tools/atlas.py` coud des cellules carrées À LA TAILLE DE CASE, et
  // une planche fait 1 254 pixels pour 4,9 cases. Chacune a donc son marqueur,
  // comme les décors de base et les deux grosses bases de l'Ouvrage.
  //
  // ⚠ AUCUNE VARIABLE CSS EN FACE : seul le canevas de l'écran Monde s'en sert,
  // et `drawImage` veut un élément. Le marqueur va donc dans le `src` de la
  // balise, comme `%ATLAS_CARTE%` et `%ATLAS_LIMITE%`.
  { marqueur: '%SOL_CARTE_1%', chemin: ['art', 'sprites', 'sol', 'sol_carte_1.webp'], type: 'image/webp' },
  { marqueur: '%SOL_CARTE_2%', chemin: ['art', 'sprites', 'sol', 'sol_carte_2.webp'], type: 'image/webp' },
  { marqueur: '%SOL_CARTE_3%', chemin: ['art', 'sprites', 'sol', 'sol_carte_3.webp'], type: 'image/webp' },
  { marqueur: '%SOL_CARTE_4%', chemin: ['art', 'sprites', 'sol', 'sol_carte_4.webp'], type: 'image/webp' },
  { marqueur: '%SOL_CARTE_5%', chemin: ['art', 'sprites', 'sol', 'sol_carte_5.webp'], type: 'image/webp' },
  { marqueur: '%SOL_CARTE_6%', chemin: ['art', 'sprites', 'sol', 'sol_carte_6.webp'], type: 'image/webp' },
  { marqueur: '%SOL_CARTE_7%', chemin: ['art', 'sprites', 'sol', 'sol_carte_7.webp'], type: 'image/webp' },
  { marqueur: '%SOL_CARTE_8%', chemin: ['art', 'sprites', 'sol', 'sol_carte_8.webp'], type: 'image/webp' },
  atlas('batiment'),
  // ⚠ LE MARQUEUR NE SE DÉDUIT PAS DU SLUG ICI : la famille s'appelle `terrain`
  // et le marqueur `%ATLAS_TERRAIN_BASE%`. Le suffixe date du temps où
  // `%ATLAS_TERRAIN%` était pris par l'atlas du FOND DE CARTE ; celui-ci est
  // parti au lot SOL-SATELLITE, et le suffixe RESTE — le renommer changerait le
  // HTML de tous les appareils pour une cosmétique de source.
  { ...atlas('terrain'), marqueur: '%ATLAS_TERRAIN_BASE%' },
  atlas('defense'),
  atlas('socle'),
  // ⚠⚠ LES HUIT DÉCORS DE BASE — lot MUR-PEINT, 03/09. Ils remplacent les douze
  // pièces de mur de `bord/` qui entraient ici : Ethan a fait peindre le mur
  // DANS le fond, donc l'anneau que le code dessinait n'existe plus. Un décor
  // fait 1080 × 2160 et n'entre dans aucun atlas — `tools/atlas.py` ne coud que
  // des cellules carrées d'un même côté —, donc chacun a son marqueur, comme le
  // fond du bassin juste en dessous.
  //
  // ⚠⚠ ILS PÈSENT 1 650 546 OCTETS EN WEBP q75, SOIT 2 200 728 EN BASE64, ET
  // C'EST UN ARBITRAGE D'ETHAN. À q85 le HTML construit passait à 2,08 fois son
  // poids d'avant, et le brief du lot pose le doublement comme une condition
  // d'arrêt. Les paliers mesurés lui ont été soumis : q80 → 1,83× · q75 → 1,65×
  // · q70 → 1,60×, contre 1,73× pour une réduction à 810 px. Réponse : q75,
  // pleine résolution — voir `tools/fonds.py`, qui dit pourquoi la résolution ne
  // se touche pas.
  //
  // ⚠ ILS SERVENT AUX DEUX ÉCRANS, ET NE S'INLINENT QU'UNE FOIS. La feuille les
  // déclare en variables pour l'écran de la base ; les balises `fond-*` du
  // balisage n'ont PAS de `src` et reçoivent l'adresse de `garnirLesAtlas`. Les
  // douze murs, eux, se partageaient par camp — six en CSS, six en `src` — parce
  // qu'aucune image ne servait des deux côtés.
  { marqueur: '%FOND_J_01%', chemin: ['art', 'sprites', 'fond', 'fond_j_01.webp'], type: 'image/webp' },
  { marqueur: '%FOND_J_02%', chemin: ['art', 'sprites', 'fond', 'fond_j_02.webp'], type: 'image/webp' },
  { marqueur: '%FOND_J_03%', chemin: ['art', 'sprites', 'fond', 'fond_j_03.webp'], type: 'image/webp' },
  { marqueur: '%FOND_J_04%', chemin: ['art', 'sprites', 'fond', 'fond_j_04.webp'], type: 'image/webp' },
  { marqueur: '%FOND_O_AUSTERE%', chemin: ['art', 'sprites', 'fond', 'fond_o_austere.webp'], type: 'image/webp' },
  { marqueur: '%FOND_O_HOSTILE%', chemin: ['art', 'sprites', 'fond', 'fond_o_hostile.webp'], type: 'image/webp' },
  { marqueur: '%FOND_O_MENACANTE%', chemin: ['art', 'sprites', 'fond', 'fond_o_menacante.webp'], type: 'image/webp' },
  { marqueur: '%FOND_O_OPPRESSANTE%', chemin: ['art', 'sprites', 'fond', 'fond_o_oppressante.webp'], type: 'image/webp' },
  atlas('unite'),
  atlas('chassis'),
  // ⚠ LE FICHIER PORTE LE SLUG À SOULIGNÉ — `atlas-tourelle_unite-64.png` —
  // parce que `tools/atlas.py` en fait aussi une clé JavaScript. Le dossier
  // source, lui, garde son tiret : `art/sprites/tourelle-unite/`.
  atlas('tourelle_unite'),
  // ⚠⚠ LES DEUX GROSSES BASES VOYAGENT HORS ATLAS, CHACUNE DANS SON MARQUEUR.
  // À la grille 64 elles mesurent 128×128 et 192×192 — elles couvrent 2×2 et
  // 3×3 cases —, et `tools/atlas.py` exige `COTE × COTE` pour coudre. Un atlas
  // d'un seul sprite ne coud rien de toute façon. Même forme que les huit
  // planches de sol, qui sont hors des sept aussi.
  atlas('carte'),
  // ⚠⚠ L'ATLAS DES LIMITES DE TERRITOIRE — lot TERRITOIRE, 03/09. Il est dans un
  // atlas alors que les murs de contour n'y sont pas, et la différence est de
  // FORME, pas de nature : une limite fait 128 × 128, un mur 512 × 128, et
  // `coudre` exige des cellules carrées. Vingt-six cellules pour 19 178 octets —
  // un dessin de limite est presque tout transparent.
  // ⚠ IL NE SERT QU'AU CANEVAS DE L'ÉCRAN MONDE, donc pas de variable CSS : sa
  // balise porte le marqueur en `src`, comme `monde-emblemes` juste à côté.
  atlas('limite'),
  { marqueur: '%BASE_O_2X2%', chemin: ['art', 'sprites', 'carte', String(GRILLE_ATLAS), 'base_o_2x2.png'], type: 'image/png' },
  { marqueur: '%BASE_O_3X3%', chemin: ['art', 'sprites', 'carte', String(GRILLE_ATLAS), 'base_o_3x3.png'], type: 'image/png' },
  // ⚠ LE FOND DU BASSIN — 03/09. Ethan : « je t'ai envoyé un sprite pour
  // combler le menu offense ». Ce n'est pas une cellule d'atlas — 1149 × 1368 —
  // donc il voyage dans son propre marqueur, comme les murs de contour. Il pèse
  // 164 578 o en WebP contre 2 099 998 en PNG optimisé : voir `tools/fonds.py`,
  // qui dit pourquoi un décor n'est pas du pixel art à teintes comptées.
  { marqueur: '%FOND_OFFENSE%', chemin: ['art', 'sprites', 'fond', 'fond_offense.webp'], type: 'image/webp' },

  // ⚠⚠ LES 263 SONS DU PACK — lot SON-CATALOGUE, 04/09. Ils ne sont pas des
  // images, et ils voyagent pourtant par le mécanisme des images : un marqueur,
  // un `data:`, une balise qui le porte en `src`. C'est la même contrainte qui
  // le veut — la garde offline refuse toute adresse dans le HTML produit, et
  // CLAUDE.md §6 interdit d'en assembler une à l'exécution pour passer dessous.
  // `src/ui/son.js` LIT donc l'adresse sur la balise, comme `garnirLesAtlas`
  // lit la sienne dans une variable CSS, et la décode par `atob`.
  //
  // ⚠ UNE FAMILLE, PAS 263 CONSTANTES. Le lot précédent en écrivait quatre à la
  // main, ce qui se relit ; à 263 la table serait une copie qui vieillit. Le
  // marqueur se DÉRIVE du nom, exactement comme `idDuSon` dérive l'identifiant
  // DOM du même nom — deux dérivations de la même chaîne, jamais deux tables.
  ...Object.keys(SONS).map((nom) => ({
    marqueur: `%SON_${nom.toUpperCase()}%`,
    chemin: ['art', 'sprites', 'son', `${nom}.opus`],
    type: 'audio/ogg',
  })),
];

// ⚠⚠ ET LE « AUCUN MARQUEUR N'EST PRÉFIXE D'UN AUTRE » SE MESURE MAINTENANT,
// IL NE SE RELIT PLUS. Le commentaire du haut disait « revérifié à la main sur
// les HUIT marqueurs » ; à 284, une relecture à la main serait une affirmation
// sans mesure. Le `%` final le garantit tant que deux marqueurs ne sont pas
// ÉGAUX — d'où ce contrôle-ci, qui attrape aussi le doublon.
{
  const vus = new Set();
  for (const entree of FICHIERS_INLINE) {
    if (vus.has(entree.marqueur)) echec(`${entree.marqueur} est déclaré deux fois`);
    vus.add(entree.marqueur);
    if (!/^%[A-Z0-9_]+%$/.test(entree.marqueur)) {
      echec(`${entree.marqueur} n'a pas la forme %NOM% : le « % » final est ce qui`
        + ' empêche un marqueur d\'être préfixe d\'un autre');
    }
  }
}

for (const image of FICHIERS_INLINE) {
  if (!html.includes(image.marqueur)) continue;
  const chemin = join(racine, ...image.chemin);
  if (!existsSync(chemin)) {
    echec(`${image.marqueur} attend ${image.chemin.join('/')}, qui est absent du dépôt`);
  }
  const donnees = readFileSync(chemin).toString('base64');
  html = html.replaceAll(image.marqueur, `data:${image.type};base64,${donnees}`);
}

// --- garde offline ------------------------------------------------------------

// ⚠⚠ UNE SEULE URL EST TOLÉRÉE, ET CE N'EST PAS UNE RÉFÉRENCE. L'espace de
// noms XML du SVG — `http://www.w3.org/2000/svg` — est l'argument obligatoire
// de `createElementNS` : sans lui, le navigateur fabrique un élément HTML nommé
// « svg » qui ne dessine rien. C'est un IDENTIFIANT, pas une adresse : rien
// n'est jamais téléchargé depuis là, et le HTML reste hors ligne au sens
// strict. Le calque des traits de voisinage en a besoin depuis le 29/08.
//
// ⚠ ET L'EXCEPTION EST NOMMÉE, PAS ÉLARGIE. On ne retire pas la garde, on ne
// l'assouplit pas en autorisant `w3.org` : on retire cette chaîne-là, à
// l'identique, et tout le reste est refusé comme avant. La contourner en
// assemblant l'URL à l'exécution aurait marché aussi — et c'est exactement ce
// que CLAUDE.md §6 interdit pour les hex à trois chiffres : passer sous un
// garde-fou en silence coûte plus cher que la contrainte qu'il pose.
const NAMESPACE_SVG = 'http://www.w3.org/2000/svg';

const violations = [];
const horsNamespace = html.split(NAMESPACE_SVG).join('');
const url = horsNamespace.match(/https?:\/\/[^\s"'<>]*/i);
if (url) violations.push(`URL réseau présente dans le HTML final : « ${url[0]} »`);

for (const attribut of html.matchAll(/<[^>]+\b(?:src|href)\s*=\s*["']([^"']*)["']/gi)) {
  const valeur = attribut[1];
  if (!valeur.startsWith('data:') && !valeur.startsWith('#')) {
    violations.push(`ressource référencée au lieu d'être inlinée : « ${valeur} »`);
  }
}

for (const importCss of html.matchAll(/@import\b|url\(\s*(?!["']?data:)/gi)) {
  violations.push(`référence CSS externe potentielle : « ${importCss[0]}… »`);
}

if (violations.length) {
  echec(
    `le HTML produit référence l'extérieur — l'offline est non négociable :\n  - ${violations.join('\n  - ')}`,
  );
}

// --- écriture -----------------------------------------------------------------

mkdirSync(join(racine, 'dist'), { recursive: true });
const cheminSortie = join(racine, 'dist', 'index.html');
writeFileSync(cheminSortie, html);

const octets = Buffer.byteLength(html);
console.log(`dist/index.html — version ${version} build ${build} — ${octets} octets (${(octets / 1024).toFixed(1)} Kio)`);
