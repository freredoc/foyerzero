// Audit de la maquette contre les tables du dépôt : aucun nom, aucun chiffre
// de `foyer-zero-ui.html` ne doit sortir de l'imagination.
//
// ⚠ CE N'EST PAS UN TEST, ET C'EST DÉLIBÉRÉ. `CLAUDE.md` §2 le dit : « un audit
// hors de npm run check ne s'exécute pas, donc n'existe pas » — c'est ce qui
// avait tué `verif.mjs`. La règle vaut pour le CODE LIVRÉ. La maquette n'est
// pas du code livré : elle n'est ni dans le bundle, ni dans le graphe
// d'`index.src.html`, et la faire garder par la suite ferait passer `main` au
// rouge pour un fichier que le joueur ne verra jamais.
//
// Il se lance à la main, et son seul moment utile est celui où quelqu'un
// TOUCHE à la maquette :  node tools/audit-maquette.mjs
//
// Le jour où l'écran de jeu existera, ce sont ses tests à lui qui prendront le
// relais, dans `npm run check`, et ce fichier n'aura plus de raison d'être.
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');
const R = join(RACINE, 'src') + '/';
const brut = readFileSync(join(RACINE, 'foyer-zero-ui.html'), 'utf8');
// ⚠ LES COMMENTAIRES HTML SONT RETIRÉS AVANT TOUT CONTRÔLE D'ABSENCE. L'en-tête
// du fichier RACONTE les six mensonges corrigés, donc il contient les mots
// interdits. C'est exactement le piège de documentation.test.js : la prose qui
// explique un motif en devient une occurrence. On scanne l'INTERFACE, pas sa
// notice.
const html = brut.replace(/<!--[\s\S]*?-->/g, '');
const B = await import(R + 'data/base.js');
const C = await import(R + 'data/combat.js');
const E = await import(R + 'sim/economie-base.js');
const D = await import(R + 'sim/disposition.js');
const N = await import(R + 'sim/niveau-de-base.js');
const champs = (await import(R + 'sim/champs.js')).champsDeLaBase(275, 16);

let ko = 0;
const ok = (b, m) => { console.log((b ? '  ok   ' : '  KO   ') + m); if (!b) ko++; };

// 1. Les noms de bâtiments affichés existent tous dans data/base.js.
const nomsReels = new Set(Object.values(B.BASE_BATIMENTS).map((b) => b.nom.joueur));
const affiches = [...html.matchAll(/'([A-ZÉÀ][^']{3,30})'/g)].map((m) => m[1])
  .filter((s) => /^[A-ZÉÀ][a-zéèêàçô]/.test(s) && !s.includes('/'));
const inconnus = [...new Set(affiches)].filter((s) => !nomsReels.has(s));
ok(inconnus.length === 0, `noms de bâtiments affichés : ${inconnus.length ? inconnus.join(', ') : 'tous réels'}`);

// 2. Aucun nom OUVRAGE ne traîne dans un panneau joueur.
const nomsOuvrage = Object.values(C.UNITES).map((u) => u.nom.ouvrage);
const intrus = nomsOuvrage.filter((n) => new RegExp(`>${n}<|'${n}'`).test(html));
ok(intrus.length === 0, `noms Ouvrage dans l'écran joueur : ${intrus.length ? intrus.join(', ') : 'aucun'}`);

// 3. La grille affichée fait bien GRILLE.largeur colonnes.
ok(html.includes(`repeat(${C.GRILLE.largeur},1fr)`), `grille en ${C.GRILLE.largeur} colonnes`);
ok(html.includes(`c <= ${C.GRILLE.largeur};`), `boucle de rendu sur ${C.GRILLE.largeur} colonnes`);
ok(html.includes(`r <= ${C.GRILLE.longueur};`), `boucle de rendu sur ${C.GRILLE.longueur} rangées`);

// 4. Les trois ressources, et elles seules.
for (const r of E.RESSOURCES) {
  const mot = { quartz: 'Quartz', scorie: 'Scorie', electricite: 'Élec.' }[r];
  ok(html.includes(mot), `ressource « ${mot} » présente`);
}
ok(!/Commande/.test(html), 'aucune ressource « Commande »');

// 5. Le terrain gravé dans la maquette EST celui du moteur.
const grave = [...html.matchAll(/\[(1[2-7]),(\d),'(quartz|scorie)'\]/g)]
  .map((m) => ({ rangee: +m[1], colonne: +m[2], ressource: m[3] }));
ok(grave.length === champs.cases.length, `${grave.length} champs gravés pour ${champs.cases.length} au moteur`);
ok(JSON.stringify(grave) === JSON.stringify(champs.cases), 'terrain identique à champsDeLaBase(275, 16)');

// 6. La disposition gravée est légale, et ses chiffres sont ceux du moteur.
const dispo = [
  { id: 'chantierDeConstruction', rangee: 18, colonne: 5, niveau: 6 },
  { id: 'collecteur', rangee: 13, colonne: 2, niveau: 6 },
  { id: 'collecteur', rangee: 14, colonne: 2, niveau: 6 },
  { id: 'collecteur', rangee: 14, colonne: 6, niveau: 5 },
  { id: 'collecteur', rangee: 14, colonne: 7, niveau: 5 },
  { id: 'collecteur', rangee: 16, colonne: 7, niveau: 4 },
  { id: 'raffinerie', rangee: 15, colonne: 6, niveau: 5 },
  { id: 'centrale', rangee: 16, colonne: 5, niveau: 4 },
  { id: 'accumulateur', rangee: 17, colonne: 5, niveau: 3 },
  { id: 'caserne', rangee: 18, colonne: 3, niveau: 4 },
  { id: 'complexeDeDefense', rangee: 18, colonne: 7, niveau: 3 },
];
ok(D.problemesDeDisposition(dispo, champs).length === 0, 'disposition légale');
ok(B.emplacementsDuNiveau(6) === 12 && dispo.length === 11, 'emplacements 11 / 12');
ok(html.includes('11 / 12'), 'la maquette affiche 11 / 12');

const niv = N.niveauDesBatiments(dispo);
const affiche = (niv / 10).toFixed(1).replace('.', ',');
ok(niv === 46 && html.includes(`<i>${affiche}</i>`), `niveau des bâtiments ${affiche} (${niv} dixièmes)`);

const deb = E.debitsMilliParHeure(dispo, champs);
const tot = { quartz: 0, scorie: 0, electricite: 0 };
for (const d of deb) for (const k of Object.keys(d)) tot[k] += d[k];
const fr = (n) => n.toLocaleString('fr-FR').replace(/\u202f|\u00a0|\u2009/g, ' ');
for (const k of E.RESSOURCES) {
  ok(html.includes(`+${fr(tot[k] / 1000)}/h`), `débit ${k} : +${fr(tot[k] / 1000)}/h`);
}
const cap = E.capacitesMilli(dispo);
for (const k of E.RESSOURCES) {
  ok(html.includes(`/ ${fr(cap[k] / 1000)}`), `capacité ${k} : ${fr(cap[k] / 1000)}`);
}
const iRaf = dispo.findIndex((b) => b.id === 'raffinerie');
ok(deb[iRaf].quartz === 176000 && deb[iRaf].scorie === 352000
   && html.includes('+176 q +352 s /h'), 'raffinerie : +176 quartz +352 scorie / h');

// 7. LA PALETTE, avec la règle EXACTE de banc.test.js — celle que l'écran
// devra passer. La fiche est transcrite ici indépendamment, pour que le
// contrôle ne valide pas la maquette avec elle-même.
const FICHE = new Set(['#161914', '#343A2C', '#4E5742', '#6A7658', '#8C9A72',
  '#1E2124', '#3E454C', '#68727E',
  '#928E80', '#F5F3E8', '#8A1E17', '#E43E32', '#A67018', '#F5B636']);
const teintes = [...html.matchAll(/#[0-9A-Fa-f]{6}(?![0-9A-Za-z])/g)].map((m) => m[0]);
ok(teintes.length > 12, `${teintes.length} teintes balayées — le montage doit en voir`);
const horsFiche = [...new Set(teintes)].filter((h) => !FICHE.has(h.toUpperCase()));
ok(horsFiche.length === 0, `teintes hors fiche : ${horsFiche.join(', ') || 'aucune'}`);
const rgbas = [...new Set([...html.matchAll(/rgba?\([^)]*\)/g)].map((m) => m[0]))]
  .filter((r) => r !== 'rgba(0,0,0,0.31)');
ok(rgbas.length === 0, `rgba hors fiche : ${rgbas.join(', ') || 'aucun'}`);
// Les deux échappatoires que la garde de banc.test.js ne voit PAS. On se les
// interdit ici, sinon la maquette pousserait l'écran à s'en servir.
const courts = [...new Set([...html.matchAll(/#[0-9A-Fa-f]{3}(?![0-9A-Fa-f])/g)].map((m) => m[0]))];
ok(courts.length === 0, `hex à 3 chiffres (invisible à la garde) : ${courts.join(', ') || 'aucun'}`);
const longs = [...new Set([...html.matchAll(/#[0-9A-Fa-f]{8}/g)].map((m) => m[0]))];
ok(longs.length === 0, `hex à 8 chiffres (invisible à la garde) : ${longs.join(', ') || 'aucun'}`);

// 8. Aucune référence externe : l'offline est non négociable, maquette comprise.
ok(!/src\s*=\s*["']http|href\s*=\s*["']http|@import/.test(html), 'aucune référence externe');

console.log(ko === 0 ? '\nAUDIT VERT' : `\nAUDIT ROUGE — ${ko} écart(s)`);
process.exit(ko === 0 ? 0 : 1);
