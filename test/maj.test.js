// La vérification de mise à jour, côté PAGE.
//
// ⚠ CE QUI SE TESTE ICI. La décision — allowlist, anti-retour, empreinte — vit
// dans le module Kotlin `:maj`, testé en JVM par la CI ; la formulation des
// messages aussi, depuis ce lot (`EtatMiseAJour`). Ce qui reste à la page, c'est
// LIRE ce que le pont rend, et ne jamais faire confiance à ce qu'elle reçoit.
//
// ⚠⚠ ET LA GARDE QUI COMPTE LE PLUS EST CELLE DE L'OFFLINE. `tools/build.js`
// refuse tout `https?://` dans le HTML produit, et CLAUDE.md §6 interdit
// d'assembler l'adresse à l'exécution pour passer dessous. L'adresse du
// manifeste doit donc rester côté Kotlin — un test l'exige des deux côtés.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { lireEtatDeMaj, MAJ_SANS_PONT, MAJ_PERIODE_MS } from '../src/ui/session.js';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');
const lire = (...chemin) => readFileSync(join(RACINE, ...chemin), 'utf8');
const sansCommentaires = (texte) => texte
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .split('\n').filter((l) => !l.trimStart().startsWith('//')).join('\n');

test('maj — un état bien formé se lit entièrement', () => {
  const lu = lireEtatDeMaj(JSON.stringify({
    etape: 'A_JOUR', build: 57, message: 'À jour — build 57.',
  }));
  assert.equal(lu.etape, 'A_JOUR');
  assert.equal(lu.build, 57);
  assert.equal(lu.message, 'À jour — build 57.');
});

test('maj — rien de ce que rend le pont n\'est cru sur parole', () => {
  // ⚠⚠ LE CAS RÉEL N'EST PAS THÉORIQUE. Le HTML se met à jour tout seul par
  // GitHub Pages ; l'APK, lui, ne bouge que quand le joueur l'installe. Une page
  // NEUVE tourne donc régulièrement dans une enveloppe ANCIENNE, qui ne connaît
  // pas ce pont ou n'en rend pas la même forme. Une exception ici tomberait au
  // milieu du câblage de l'écran Options — donc bien loin de sa cause.
  for (const brut of [
    undefined, null, '', 42, {}, [], 'pas du json', '{', 'null', '[]', '"texte"',
    '{"etape":123}', '{"message":""}', '{"build":"57"}', '{"build":null}',
  ]) {
    const lu = lireEtatDeMaj(brut);
    assert.equal(typeof lu.message, 'string');
    assert.ok(lu.message.length > 0, `message vide pour ${JSON.stringify(brut)}`);
    assert.equal(typeof lu.etape, 'string');
    assert.ok(lu.build === null || Number.isFinite(lu.build));
  }

  // ⚠ UN BUILD QUI N'EST PAS UN NOMBRE REND `null`, PAS LA CHAÎNE. Le manifeste
  // porte `build` en NOMBRE (CLAUDE.md §6, « les types de package.json ») ;
  // recopier une chaîne ferait afficher `"57"` avec ses guillemets.
  assert.equal(lireEtatDeMaj('{"build":"57"}').build, null);
  assert.equal(lireEtatDeMaj('{"build":57}').build, 57);
});

test('maj — hors de l\'enveloppe, la ligne dit pourquoi', () => {
  // « Un indice n'est pas une interdiction » (CLAUDE.md §4) : un bouton sans
  // effet n'apprend rien, une phrase qui dit quoi faire à la place, si.
  assert.ok(MAJ_SANS_PONT.length > 20);
  assert.match(MAJ_SANS_PONT, /rechargez/i);
  // ⚠ ET ELLE NE PORTE AUCUNE ADRESSE : ce message entre dans le HTML produit.
  assert.ok(!/https?:/.test(MAJ_SANS_PONT));
  assert.ok(MAJ_PERIODE_MS >= 250, 'interroger plus vite que ça ne sert à rien');
});

test('maj — la page ne porte aucune adresse, et n\'en fabrique pas', () => {
  // ⚠⚠ C'EST LA GARDE CENTRALE DE CE LOT. `tools/build.js` refuse déjà tout
  // `https?://` dans le HTML produit, mais il ne verrait PAS une adresse
  // assemblée à l'exécution — et CLAUDE.md §6 interdit nommément ce
  // contournement, comme pour les hex à trois chiffres et l'espace de noms SVG.
  const session = sansCommentaires(lire('src', 'ui', 'session.js'));
  assert.ok(!/https?:/.test(session), 'une adresse est apparue dans la session');
  // Les deux formes d'assemblage qu'on écrirait vraiment.
  assert.ok(!/['"`]http/.test(session));
  assert.ok(!/manifest\.json/.test(session), 'le nom du manifeste n\'a rien à faire ici');

  // ⚠ ET LA PAGE NE TÉLÉCHARGE RIEN ELLE-MÊME. Aucun `fetch`, aucun
  // `XMLHttpRequest` : tout passe par le pont, qui porte l'allowlist côté Kotlin.
  assert.ok(!/\bfetch\s*\(/.test(session), 'la page télécharge : l\'allowlist est contournée');
  assert.ok(!/XMLHttpRequest/.test(session));

  // Le livrable non plus, évidemment — mais on le vérifie de face plutôt que de
  // faire confiance à la garde du build, qui pourrait être assouplie.
  const html = lire('dist', 'index.html');
  const sansSvg = html.split('http://www.w3.org/2000/svg').join('');
  assert.ok(!/https?:\/\//.test(sansSvg), 'le livrable référence l\'extérieur');
});

test('maj — le pont est LU, jamais nourri', () => {
  const session = sansCommentaires(lire('src', 'ui', 'session.js'));
  const debut = session.indexOf('function pontDeMaj');
  assert.ok(debut > 0, 'le pont ne se cherche plus');

  // ⚠⚠ LES DEUX MÉTHODES SONT APPELÉES SANS ARGUMENT, ET C'EST TOUT L'ACCORD
  // AVEC `MainActivity`. Le pont ne prend rien de la page : c'est ce qui fait
  // qu'il n'y a rien à injecter, et c'est la raison écrite pour laquelle le
  // dépôt a accepté d'en ouvrir un après avoir dit « aucune interface JS
  // native ». Lui passer une fonction de rappel rouvrirait ce sens-là.
  assert.match(session, /pont\.verifier\(\)/, 'la demande de vérification a changé de forme');
  assert.match(session, /pont\.etat\(\)/, 'la lecture de l\'état a changé de forme');
  assert.ok(!/pont\.verifier\(\s*[^)]/.test(session), 'un argument traverse le pont');
  assert.ok(!/pont\.etat\(\s*[^)]/.test(session), 'un argument traverse le pont');

  // ⚠ ET L'ABSENCE DE PONT EST TESTÉE AVANT USAGE, pas rattrapée par un `try`.
  // Dans un navigateur `window.FoyerZeroMaj` n'existe simplement pas.
  const bloc = session.slice(debut, debut + 400);
  assert.match(bloc, /typeof pont\.verifier === 'function'/);
  assert.match(bloc, /typeof pont\.etat === 'function'/);
});

test('maj — le bouton et sa ligne sont dans le livrable', () => {
  const html = lire('dist', 'index.html');
  assert.match(html, /id="options-maj-verifier"/, 'le bouton de vérification a disparu');
  assert.match(html, /id="options-maj-etat"/, 'la ligne d\'état a disparu');

  // ⚠ LA CLASSE QUE LE JS BASCULE DOIT AVOIR UNE RÈGLE — c'est la leçon du lot
  // ÉCRAN-ACTIONS, où `arme` était posée par le JS et peinte par personne. Ici
  // c'est `[disabled]` que l'écran bascule : sans règle, une vérification en
  // cours ne se verrait pas.
  const feuille = lire('src', 'index.src.html').replace(/\/\*[\s\S]*?\*\//g, '');
  assert.match(feuille, /#options-maj-verifier\[disabled\]\s*\{/,
    'un bouton désactivé ne se distingue pas d\'un bouton vif');
});

test('maj — l\'enveloppe garde l\'adresse, et le module la décision', () => {
  // La contre-épreuve : si la page ne porte pas l'adresse, quelqu'un doit la
  // porter. Sans ce test, « aucune adresse dans la page » serait satisfait par
  // une fonction de mise à jour qui n'existe plus du tout.
  const kotlin = lire('android', 'app', 'src', 'main', 'kotlin', 'fr', 'freredoc',
    'foyerzero', 'MiseAJour.kt');
  assert.match(kotlin, /URL_MANIFESTE\s*=\s*"https:/, 'l\'enveloppe ne porte plus l\'adresse');
  assert.match(kotlin, /Allowlist\.urlAutorisee/, 'l\'allowlist ne garde plus les téléchargements');

  // ⚠ ET LE PONT EST DÉCLARÉ SOUS LE NOM QUE LA PAGE CHERCHE. Les deux moitiés
  // vivent dans deux langages et deux modules de build : rien d'autre qu'un test
  // croisé ne peut dire qu'elles se parlent. C'est la leçon de la boussole de
  // `sim/rendu-pose.js` — deux modules justes séparément peuvent être faux
  // ensemble.
  const activite = lire('android', 'app', 'src', 'main', 'kotlin', 'fr', 'freredoc',
    'foyerzero', 'MainActivity.kt');
  const session = lire('src', 'ui', 'session.js');
  const nom = activite.match(/addJavascriptInterface\([^,]+,\s*"([^"]+)"\)/);
  assert.ok(nom, 'l\'enveloppe n\'expose plus de pont');
  assert.ok(session.includes(`fenetre.${nom[1]}`),
    `la page cherche un autre nom que « ${nom[1]} » : le bouton restera muet`);

  // Les deux méthodes que la page appelle doivent être annotées côté Kotlin,
  // sans quoi elles ne sont pas exposées du tout depuis l'API 17.
  for (const methode of ['verifier', 'etat']) {
    assert.match(
      activite,
      new RegExp(`@JavascriptInterface\\s+fun ${methode}\\(`),
      `« ${methode} » n'est pas exposée au JavaScript`,
    );
  }
});
