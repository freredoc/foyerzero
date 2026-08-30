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
// `%ATLAS_TERRAIN%` et `%ATLAS_TERRAIN_BASE%` partagent quatorze caractères ;
// sans le `%` de fin, le premier `replaceAll` mangerait la tête du second et
// laisserait un `_BASE%` orphelin dans le HTML — la garde offline n'y verrait
// rien, et l'écran afficherait la carte du monde sous les bâtiments. Vérifié :
// aucune des trois chaînes complètes n'est préfixe d'une autre.
//
// ⚠ ET ON N'EN DÉCLARE PAS « POUR PLUS TARD ». Les cinq familles restantes —
// socle, defense, unite, tourelle-unite, carte — ne sont pas cousues : les
// inscrire ici ferait cinq entrées mortes, et la garde « marqueur sans fichier »
// ne les verrait jamais, puisqu'elle ne regarde que les marqueurs PRÉSENTS dans
// le HTML. Chaque famille entre avec le lot qui la consomme.
const IMAGES_INLINE = [
  { marqueur: '%ATLAS_TERRAIN%', chemin: ['art', 'sprites', 'carte', 'atlas-terrain-64.png'], type: 'image/png' },
  { marqueur: '%ATLAS_BATIMENT%', chemin: ['art', 'sprites', 'atlas-batiment-64.png'], type: 'image/png' },
  { marqueur: '%ATLAS_TERRAIN_BASE%', chemin: ['art', 'sprites', 'atlas-terrain-64.png'], type: 'image/png' },
];

for (const image of IMAGES_INLINE) {
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
