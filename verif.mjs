import { GRILLE, UNITES, DEFENSES, MODULES, MATRICE_COLONNES } from './src/data/combat.js';
import { BATIMENTS, DENSITE, GARNISON, VAGUES, POINTS_RECHERCHE, RAID_OUVRAGE } from './src/data/sites.js';
let ko = 0;
const ok = (c, m) => { if (!c) { ko++; console.log('  KO  ' + m); } else console.log('  ok  ' + m); };

ok(Object.keys(UNITES).length === 14, `14 unités (${Object.keys(UNITES).length})`);
ok(Object.keys(DEFENSES).length === 9, `9 défenses (${Object.keys(DEFENSES).length})`);

// bandes contiguës et cases bâtiments
const b = GRILLE.bandes;
ok(b.deploiement.derniere + 1 === b.defense.premiere && b.defense.derniere + 1 === b.batiments.premiere
   && b.batiments.derniere === GRILLE.longueur, 'bandes contiguës, 1→18');
ok((b.batiments.derniere - b.batiments.premiere + 1) * GRILLE.largeur === GRILLE.casesBatiments, '72 cases bâtiments');

// matrices bornées, clés exactes
for (const [k, u] of Object.entries({ ...UNITES, ...DEFENSES })) {
  if (!u.matrice) continue;
  const cles = Object.keys(u.matrice).join(',');
  if (cles !== MATRICE_COLONNES.join(',')) { ko++; console.log(`  KO  matrice ${k} : clés ${cles}`); }
  for (const v of Object.values(u.matrice)) if (v < 0 || v > 1) { ko++; console.log(`  KO  matrice ${k} hors [0,1]`); }
}
ok(true, 'matrices : clés et bornes');

// règle de bascule anti-structure → anti-aérien
for (const [k, u] of Object.entries(UNITES)) {
  if (!u.defense.present) continue;
  const attendu = u.specialite === 'antiStructure' ? 'antiAerien' : u.specialite;
  if (u.defense.cible !== attendu) { ko++; console.log(`  KO  bascule ${k} : ${u.specialite} → ${u.defense.cible}, attendu ${attendu}`); }
}
ok(true, 'règle de bascule offense → défense');

// aucun aéronef ne défend
for (const [k, u] of Object.entries(UNITES))
  if (u.chassis === 'aeronef' && u.defense.present) { ko++; console.log(`  KO  ${k} aéronef présent en défense`); }
ok(true, 'aucun aéronef ne défend');

// modules référencés existants
for (const [k, u] of Object.entries(UNITES))
  for (const m of [u.module, u.moduleOuvrage, u.defense.module])
    if (m && !MODULES[m]) { ko++; console.log(`  KO  module inconnu « ${m} » (${k})`); }
for (const [k, d] of Object.entries(DEFENSES))
  for (const m of [d.moduleJoueur, d.moduleOuvrage])
    if (m && !MODULES[m]) { ko++; console.log(`  KO  module inconnu « ${m} » (${k})`); }
ok(true, 'tous les modules référencés sont définis');

// parts des bâtiments
const somme = Object.values(BATIMENTS).filter(x => !x.unique).reduce((s, x) => s + x.part, 0);
ok(Math.abs(somme - 1) < 1e-9, `parts proportionnelles = ${somme.toFixed(2)}`);
ok(Object.values(BATIMENTS).filter(x => x.unique).length === 2, '2 bâtiments uniques');

// compositions : somme 100, ids connus, respect du déblocage
const connus = new Set([...Object.keys(UNITES), ...Object.keys(DEFENSES)]);
for (const [nom, table] of [['GARNISON', GARNISON], ['VAGUES', VAGUES]]) {
  for (const [niv, ligne] of Object.entries(table.parNiveau)) {
    const s = Object.values(ligne).reduce((a, x) => a + x, 0);
    if (Math.abs(s - 100) > 1e-9) { ko++; console.log(`  KO  ${nom} niv ${niv} somme ${s}`); }
    for (const id of Object.keys(ligne)) {
      if (!connus.has(id)) { ko++; console.log(`  KO  ${nom} niv ${niv} : id inconnu « ${id} »`); continue; }
      const app = (UNITES[id] ?? DEFENSES[id]).apparition;
      if (Number(niv) < app) { ko++; console.log(`  KO  ${nom} niv ${niv} : ${id} pas encore débloqué (apparition ${app})`); }
    }
  }
}
ok(true, 'compositions : sommes à 100, ids connus, déblocage respecté');

// garnison : que des entités présentes en défense
for (const [niv, ligne] of Object.entries(GARNISON.parNiveau))
  for (const id of Object.keys(ligne))
    if (UNITES[id] && !UNITES[id].defense.present) { ko++; console.log(`  KO  GARNISON niv ${niv} : ${id} absent de la défense`); }
ok(true, 'garnison : aucune unité absente de la défense');

// vagues : aucune structure
for (const [niv, ligne] of Object.entries(VAGUES.parNiveau))
  for (const id of Object.keys(ligne))
    if (DEFENSES[id]) { ko++; console.log(`  KO  VAGUES niv ${niv} : ${id} est une défense`); }
ok(true, 'vagues : aucune structure');

// barème de recherche = exactement le pool défensif
const pool = new Set();
for (const ligne of Object.values(GARNISON.parNiveau)) for (const id of Object.keys(ligne)) pool.add(id);
const bareme = new Set(Object.keys(POINTS_RECHERCHE.parCible));
const manque = [...pool].filter(x => !bareme.has(x));
const enTrop = [...bareme].filter(x => !pool.has(x));
ok(manque.length === 0 && enTrop.length === 0, `barème recherche ↔ pool défensif (manque ${manque}, en trop ${enTrop})`);

// densité : bâtiments ≤ 72, base ≤ 72
for (const [niv, d] of Object.entries(DENSITE.parNiveau)) {
  const base = Math.round(d.avantPoste.batiments * DENSITE.facteurBase);
  if (base > GRILLE.casesBatiments) { ko++; console.log(`  KO  niv ${niv} base ${base} > 72`); }
  if (d.camp.batiments > d.avantPoste.batiments) { ko++; console.log(`  KO  niv ${niv} camp > avant-poste`); }
}
ok(true, 'densité : tout tient dans les 72 cases');

// budgets de vague croissants
const budgets = Object.entries(RAID_OUVRAGE.budgetParNiveau).sort((a, b2) => a[0] - b2[0]).map(x => x[1]);
ok(budgets.every((v, i) => i === 0 || v >= budgets[i - 1]), 'budgets de vague monotones');

console.log(ko === 0 ? '\nTOUT PASSE' : `\n${ko} ÉCHEC(S)`);
process.exit(ko ? 1 : 0);
