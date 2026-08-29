// Le site d'une case — deux graines, une saveur de case, et le mini-onglet.
//
// Arbitrage du 29/08 asserté ici : « deux camps sur la même case auront les
// mêmes dispositions quartz scories obstacles, mais des dispositions bâtiment
// défense différentes ». La moitié SAVEUR est tenue et mesurée ; la moitié
// OBSTACLES ne l'est pas, et un test témoin dit exactement de combien.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  SEL_TERRAIN_DU_SITE, SEL_INSTANCE_DU_SITE, INSTANCE_DUNE_BASE, SAVEURS_TIRABLES,
  SAVEURS_CONNUES, graineDuTerrain, graineDeLInstance, saveurDeLaCase, siteDeLaCase,
  montageDuSite, resumeDuSite, butinSiToutTombe, forceDeLaDefense, ciblesAPortee,
} from '../src/sim/site-de-la-case.js';
import { creerEtat, rattraperJeu, pointsEngages } from '../src/sim/state.js';
import { basesDeLaFenetre, hachageBrut } from '../src/sim/peuplement.js';
import { niveauDeLaRangee } from '../src/sim/carte.js';
import { butin } from '../src/sim/combat.js';
import { GEOGRAPHIE, TYPES_SITE } from '../src/data/sites.js';

/** Une partie dont les trois satellites sont parus. */
function partieAvecSatellites(graine = 2026) {
  const etat = creerEtat(graine);
  rattraperJeu(etat, 3001);
  assert.equal(etat.satellites.presents.length, 3, 'montage : les satellites ne sont pas parus');
  return etat;
}

/** Une identité de camp posée à la main, pour éprouver une case précise. */
function campEn(graine, rangee, colonne, instance, niveau = 12) {
  return {
    type: 'camp',
    niveau,
    saveur: saveurDeLaCase(graine, rangee, colonne, 'camp'),
    instance,
    rangee,
    colonne,
  };
}

test('graines — le terrain ignore l\'instance, les occupants non', () => {
  const g = 2026;
  // Falsifiable des deux côtés : il faut que les deux graines BOUGENT quand la
  // case bouge, sinon « elle ignore l'instance » serait vrai d'une constante.
  assert.notEqual(graineDuTerrain(g, 100, 10), graineDuTerrain(g, 100, 11));
  assert.notEqual(graineDeLInstance(g, 100, 10, 1), graineDeLInstance(g, 100, 11, 1));

  // Le terrain : même valeur quelle que soit l'instance — il n'en prend pas.
  assert.equal(graineDuTerrain(g, 100, 10), graineDuTerrain(g, 100, 10));

  // Les occupants : deux instances de la même case ne tombent pas ensemble.
  const vues = new Set();
  for (let i = 0; i < 200; i += 1) vues.add(graineDeLInstance(g, 100, 10, i));
  assert.equal(vues.size, 200, 'deux instances partagent une graine');

  // Et la graine d'une partie compte : deux parties ne peuplent pas pareil.
  assert.notEqual(graineDeLInstance(g, 100, 10, 1), graineDeLInstance(g + 1, 100, 10, 1));
});

test('graines — les six sels donnent six tirages indépendants', () => {
  // ⚠ MONTAGE FALSIFIABLE : deux sels qui se marcheraient dessus rendraient LA
  // MÊME valeur sur la même case, et le site hériterait du tirage du peuplement
  // ou du pavage du fond. On le mesure sur 500 cases, pas sur une.
  const sels = [0, 1, 2, 3, SEL_TERRAIN_DU_SITE, SEL_INSTANCE_DU_SITE];
  assert.equal(new Set(sels).size, sels.length, 'deux sels portent le même numéro');

  let collisions = 0;
  for (let rangee = 1; rangee <= 25; rangee += 1) {
    for (let colonne = 1; colonne <= 20; colonne += 1) {
      const valeurs = sels.map((s) => hachageBrut(2026, rangee, colonne, s));
      if (new Set(valeurs).size !== sels.length) collisions += 1;
    }
  }
  assert.equal(collisions, 0, `${collisions} cases où deux sels rendent la même valeur`);
});

test('saveur — deux saveurs, tirées de la CASE et jamais de l\'instance', () => {
  // La spec §8 : « deux variantes de camp et d'avant-poste ». La table en porte
  // trois clés, dont `base` qui vaut null — ce n'est pas une saveur tirable.
  assert.deepEqual(SAVEURS_TIRABLES, ['richeQuartz', 'richeScorie']);
  assert.equal(SAVEURS_CONNUES.length, 3, 'la table a changé de forme');
  for (const s of SAVEURS_TIRABLES) assert.ok(SAVEURS_CONNUES.includes(s));

  // ⚠ MONTAGE FALSIFIABLE : les DEUX saveurs doivent sortir, et à peu près
  // autant l'une que l'autre. Un tirage bloqué sur une seule passerait toutes
  // les autres assertions de ce test.
  const comptes = { richeQuartz: 0, richeScorie: 0 };
  for (let rangee = 1; rangee <= 60; rangee += 1) {
    for (let colonne = 1; colonne <= 31; colonne += 1) {
      comptes[saveurDeLaCase(2026, rangee, colonne, 'camp')] += 1;
    }
  }
  const total = comptes.richeQuartz + comptes.richeScorie;
  assert.equal(total, 60 * 31);
  assert.ok(comptes.richeQuartz > total * 0.4 && comptes.richeQuartz < total * 0.6,
    `partage déséquilibré : ${comptes.richeQuartz} / ${total}`);

  // Stable par case : c'est l'arbitrage d'Ethan, et il ne dépend d'aucun état.
  for (const type of ['camp', 'avantPoste']) {
    assert.equal(saveurDeLaCase(2026, 140, 7, type), saveurDeLaCase(2026, 140, 7, type));
  }
  // Une base n'a pas de saveur : elle est proportionnelle.
  assert.equal(saveurDeLaCase(2026, 140, 7, 'base'), null);
});

test('site — la case du joueur n\'est pas une cible', () => {
  const etat = partieAvecSatellites();
  assert.equal(siteDeLaCase(etat, etat.position.rangee, etat.position.colonne), null);
  // Et une case vide non plus — sinon « pas de cible » ne voudrait rien dire.
  assert.equal(siteDeLaCase(etat, etat.position.rangee, etat.position.colonne + 7), null);
  // Ni une case hors carte.
  assert.equal(siteDeLaCase(etat, 0, 1), null);
  assert.equal(siteDeLaCase(etat, 1, GEOGRAPHIE.carte.largeur + 1), null);
});

test('site — un satellite posé est une cible, avec SON instance', () => {
  const etat = partieAvecSatellites();
  for (const s of etat.satellites.presents) {
    const site = siteDeLaCase(etat, s.rangee, s.colonne);
    assert.ok(site, `aucun site sur le satellite en (${s.rangee}, ${s.colonne})`);
    assert.equal(site.type, s.type);
    assert.equal(site.niveau, s.niveau);
    assert.equal(site.instance, s.instance, 'l\'instance du satellite s\'est perdue');
    assert.notEqual(site.saveur, null, 'un camp a une saveur');
  }
  // Falsifiable : les trois instances sont DIFFÉRENTES, sinon lire l'instance
  // ou lire une constante reviendrait au même.
  const instances = etat.satellites.presents.map((s) => s.instance);
  assert.equal(new Set(instances).size, 3);
});

test('site — une base de l\'Ouvrage est une cible, de niveau de sa rangée', () => {
  const etat = creerEtat(2026);
  const bases = basesDeLaFenetre(2026, {
    premiereRangee: 100, derniereRangee: 140, premiereColonne: 1, derniereColonne: 31,
  });
  // Falsifiable : la fenêtre doit en contenir, et à des rangées DIFFÉRENTES,
  // sinon « le niveau suit la rangée » ne serait pas mis à l'épreuve.
  assert.ok(bases.length > 10, `${bases.length} bases dans la fenêtre`);
  assert.ok(new Set(bases.map((b) => b.rangee)).size > 5);

  const niveaux = new Set();
  for (const b of bases) {
    const site = siteDeLaCase(etat, b.rangee, b.colonne);
    assert.ok(site, `pas de site sur la base en (${b.rangee}, ${b.colonne})`);
    assert.equal(site.type, 'base');
    assert.equal(site.saveur, null, 'une base est proportionnelle');
    assert.equal(site.instance, INSTANCE_DUNE_BASE);
    assert.equal(site.niveau, niveauDeLaRangee(b.rangee));
    niveaux.add(site.niveau);
  }
  assert.ok(niveaux.size > 1, 'toutes les bases au même niveau : la rangée n\'est pas lue');
});

test('montage — même identité, même site ; autre instance, autres occupants', () => {
  const g = 2026;
  const cle = (liste) => liste.map((x) => `${x.id}@${x.rangee}:${x.colonne}`).sort().join(' ');

  const a = montageDuSite(g, campEn(g, 200, 10, 1));
  const bis = montageDuSite(g, campEn(g, 200, 10, 1));
  assert.deepEqual(a, bis, 'le même site ne se régénère pas à l\'identique');

  const b = montageDuSite(g, campEn(g, 200, 10, 2));
  assert.notEqual(cle(a.batiments), cle(b.batiments), 'l\'instance ne change rien aux bâtiments');
  assert.notEqual(cle(a.defenseurs), cle(b.defenseurs), 'l\'instance ne change rien aux défenses');
  // La saveur, elle, ne bouge pas : c'est la moitié tenue de l'arbitrage.
  assert.equal(a.saveur, b.saveur);

  // Et une autre CASE donne un autre site, à instance égale.
  const ailleurs = montageDuSite(g, campEn(g, 200, 11, 1));
  assert.notEqual(cle(a.batiments), cle(ailleurs.batiments));
});

test('témoin — les obstacles ne sont PAS encore stables par case', () => {
  // ⚠ CE TEST MESURE UNE DETTE, IL NE DÉFEND PAS UN ACQUIS. Ethan a arbitré que
  // deux camps successifs sur une même case gardent les mêmes obstacles.
  // `genererSite` les place EN DERNIER, dans ce que les bâtiments et les
  // défenses ont laissé libre : ils suivent donc l'instance, quelle que soit la
  // graine qu'on leur donnerait. Le jour où le générateur tirera les obstacles
  // EN PREMIER, ce test devra être INVERSÉ — c'est le signal, et c'est pour ça
  // qu'il est écrit plutôt que laissé en commentaire.
  const g = 2026;
  const a = montageDuSite(g, campEn(g, 200, 10, 1));
  const b = montageDuSite(g, campEn(g, 200, 10, 2));
  const communes = a.obstacles.filter(
    (o) => b.obstacles.some((p) => p.rangee === o.rangee && p.colonne === o.colonne),
  ).length;
  assert.equal(a.obstacles.length, b.obstacles.length, 'le NOMBRE d\'obstacles, lui, est stable');
  assert.ok(communes < a.obstacles.length,
    'les obstacles sont devenus stables : inverser ce test et retirer la dette du rapport');
});

test('résumé — le butin suit la saveur, et la somme ne bouge pas', () => {
  const g = 2026;
  const base = campEn(g, 200, 10, 1);
  const quartz = resumeDuSite(g, { ...base, saveur: 'richeQuartz' });
  const scorie = resumeDuSite(g, { ...base, saveur: 'richeScorie' });

  const sommeQ = quartz.butinSiToutTombe.quartz + quartz.butinSiToutTombe.scorie;
  const sommeS = scorie.butinSiToutTombe.quartz + scorie.butinSiToutTombe.scorie;
  // Falsifiable : le total doit être le MÊME — la saveur incline le partage,
  // elle n'enrichit pas le site. Un écart d'une unité vient de l'arrondi final.
  assert.ok(Math.abs(sommeQ - sommeS) <= 2, `${sommeQ} contre ${sommeS}`);

  // 75 / 25 d'un côté, l'inverse de l'autre.
  assert.ok(quartz.butinSiToutTombe.quartz > 2.5 * quartz.butinSiToutTombe.scorie);
  assert.ok(scorie.butinSiToutTombe.scorie > 2.5 * scorie.butinSiToutTombe.quartz);
  // Et les deux sites sont par ailleurs IDENTIQUES : même bâti, même garnison.
  assert.equal(quartz.batiments, scorie.batiments);
  assert.equal(quartz.forceDeLaDefense, scorie.forceDeLaDefense);
});

test('résumé — « si tout tombe » est bien le PLAFOND du butin', () => {
  // ⚠ MONTAGE FALSIFIABLE : on compare au butin d'un raid qui n'aurait détruit
  // que la MOITIÉ de chaque bâtiment, sans faire tomber la Souche. Le plafond
  // doit valoir le double, à l'arrondi près. Un « si tout tombe » qui rendrait
  // la même chose que le demi-raid ne mesurerait rien.
  const g = 2026;
  const montage = montageDuSite(g, campEn(g, 200, 10, 1));
  const plafond = butinSiToutTombe(montage);

  const demi = butin({
    cause: 'plafond',
    batiments: montage.batiments.map((b) => ({ ...b, pvPerdusMilli: 500, pvMaxMilli: 1000 })),
    defenses: [],
  }, montage);

  for (const r of ['quartz', 'scorie']) {
    assert.ok(plafond[r] > 0, `le plafond est nul en ${r}`);
    assert.ok(Math.abs(plafond[r] - 2 * demi[r]) <= 2,
      `${r} : plafond ${plafond[r]}, demi-raid ${demi[r]}`);
  }
});

test('résumé — la force de la défense se compte comme celle du joueur', () => {
  // ⚠ C'EST LE TEST ANTI-DIVERGENCE DU LOT. `pointsEngages` de `sim/state.js`
  // somme le champ `points` des pièces du joueur ; `forceDeLaDefense` fait la
  // même somme sur la garnison d'un site. Les deux DOIVENT rendre le même
  // nombre sur la même liste, sinon le mini-onglet annoncerait une force qui ne
  // se compare à rien de ce que le joueur lit sur ses propres bandes.
  const g = 2026;
  const etat = creerEtat(g);
  const montage = montageDuSite(g, campEn(g, 200, 10, 1, 20));
  assert.ok(montage.defenseurs.length > 5, 'montage sans mordant : trop peu de défenseurs');

  etat.garnison = montage.defenseurs.map((d) => ({
    id: d.id, rangee: d.rangee, colonne: d.colonne, niveau: d.niveau, degatsMilli: 0,
  }));
  assert.equal(forceDeLaDefense(montage.defenseurs), pointsEngages(etat, 'garnison'));

  // Une pièce inconnue est un fait de programme, pas un zéro silencieux.
  assert.throws(() => forceDeLaDefense([{ id: 'lancePierres' }]), /n'est ni une défense ni une unité/);
});

test('butin — un avant-poste paie 3,25 fois un camp, une base paie comme un camp', () => {
  // ⚠ MONTAGE FALSIFIABLE, ET LE PREMIER JET NE L'ÉTAIT PAS. Comparer un camp à
  // un avant-poste de même niveau ne mesure PAS le multiplicateur : ils n'ont
  // pas le même nombre de bâtiments — 16 contre 24 au niveau 20 —, si bien que
  // le rapport mesuré valait 5,05 et non 3,25. Ce qui isole le facteur, c'est
  // de payer LE MÊME SITE deux fois, en ne changeant que son type.
  const g = 2026;
  const montage = montageDuSite(g, {
    type: 'camp', niveau: 20, saveur: null, instance: 1, rangee: 200, colonne: 10,
  });
  const paye = (type) => {
    const b = butinSiToutTombe({ ...montage, type });
    return b.quartz + b.scorie;
  };
  const camp = paye('camp');
  assert.ok(camp > 0, 'montage sans mordant : ce site ne rapporte rien');

  const facteur = TYPES_SITE.avantPoste.multiplicateurButin;
  assert.equal(facteur, 3.25, 'le multiplicateur de la table a bougé');
  assert.ok(Math.abs(paye('avantPoste') / camp - facteur) < 0.001,
    `rapport mesuré ${(paye('avantPoste') / camp).toFixed(4)}`);

  // ⚠ ET UNE BASE PORTE `null`, QUI VAUT 1 — pas zéro. Le lire comme un zéro
  // rendrait toute base sans butin, ce qu'aucun test ne dirait autrement.
  assert.equal(TYPES_SITE.base.multiplicateurButin, null);
  assert.equal(paye('base'), camp, 'une base ne paie pas comme un camp de même bâti');
  // Un montage sans type non plus : c'est ce qui laisse les raids de référence
  // écrits à la main exacts.
  assert.equal(paye(undefined), camp);
});

test('résumé — un site de haut niveau pèse plus lourd qu\'un site de bas niveau', () => {
  const g = 2026;
  const petit = resumeDuSite(g, campEn(g, 200, 10, 1, 2));
  const grand = resumeDuSite(g, campEn(g, 200, 10, 1, 40));
  assert.ok(grand.forceDeLaDefense > petit.forceDeLaDefense, 'la défense ne suit pas le niveau');
  assert.ok(grand.defenseurs > petit.defenseurs, 'la densité ne suit pas le niveau');
  assert.ok(grand.butinSiToutTombe.quartz > petit.butinSiToutTombe.quartz * 100,
    'le butin ne suit pas le niveau');
});

test('cibles — aucune au départ, les trois satellites cinq minutes après', () => {
  // ⚠ FAIT DE JEU MESURÉ, PAS UN EFFET DE BORD : la garde du peuplement fait
  // quinze cases, le rayon d'attaque en fait dix. Une partie neuve n'a donc
  // RIEN à attaquer avant que ses propres satellites paraissent. C'est
  // exactement le rôle « filet de sécurité » que `TYPES_SITE.camp` annonce.
  const neuve = creerEtat(2026);
  assert.deepEqual(ciblesAPortee(neuve, neuve), []);

  const etat = partieAvecSatellites();
  const cibles = ciblesAPortee(etat, etat);
  assert.equal(cibles.length, 3);
  assert.deepEqual(
    cibles.map((c) => c.type).sort(), ['avantPoste', 'camp', 'camp'],
  );
  // Triées du plus proche au plus loin, et toutes dans le rayon.
  for (let i = 1; i < cibles.length; i += 1) {
    assert.ok(cibles[i].distance >= cibles[i - 1].distance, 'liste non triée');
  }
  for (const c of cibles) {
    assert.ok(c.distance >= 1 && c.distance <= GEOGRAPHIE.rayonAttaque, `distance ${c.distance}`);
  }
});

test('cibles — le rayon est celui de GEOGRAPHIE, et il borne vraiment', () => {
  // Une base plantée en plein territoire de l'Ouvrage, loin de la garde : là,
  // il y a de quoi mesurer un bord.
  const etat = creerEtat(2026);
  const attaquante = { position: { rangee: 120, colonne: 16 } };
  const cibles = ciblesAPortee(etat, attaquante);
  assert.ok(cibles.length > 3, `${cibles.length} cibles : montage sans mordant`);

  for (const c of cibles) {
    const d = Math.max(Math.abs(c.rangee - 120), Math.abs(c.colonne - 16));
    assert.equal(c.distance, d, 'la distance annoncée n\'est pas celle de Tchebychev');
    assert.ok(d <= GEOGRAPHIE.rayonAttaque, `cible à ${d} cases, hors rayon`);
  }
  // Falsifiable : au moins une cible doit être au-delà du rayon d'influence,
  // sinon le bornage ne serait jamais éprouvé.
  assert.ok(cibles.some((c) => c.distance > GEOGRAPHIE.rayonInfluenceJoueur));
});
