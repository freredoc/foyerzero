// Les missions du tutoriel : elles LISENT la base, et c'est tout.
//
// Ce fichier garde trois choses qu'aucune relecture n'attrape : que la chaîne
// est réellement JOUABLE jusqu'au bout dans les emplacements dont le joueur
// dispose, qu'aucune mission n'écrit dans l'état, et qu'aucun nombre du
// tutoriel n'a été recopié à la main depuis une table.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { creerEtat, poser, ameliorer, demolir } from '../src/sim/state.js';
import { ressourceDeLaCase } from '../src/sim/champs.js';
import { BASE_BATIMENTS, coutDeMontee, emplacementsDuNiveau } from '../src/data/base.js';
import { ECONOMIE_NIVEAU } from '../src/data/economie.js';
import { GEOGRAPHIE } from '../src/data/sites.js';
import {
  MISSIONS, etatDesMissions, missionCourante, avancement, premierNiveauElectrique,
} from '../src/sim/missions.js';

/** Une base neuve, et le premier champ de son terrain. */
function baseNeuve(graine = 7) {
  const etat = creerEtat({ graine });
  return { etat, champ: etat.champs.cases[0] };
}

/** Joue l'ouverture arbitrée, geste par geste. */
function jouerLOuverture(etat, champ) {
  const gestes = [];
  gestes.push(['Chantier → niveau 2', () => ameliorer(etat, 0)]);
  gestes.push(['Collecteur sur un champ', () => poser(etat, 'collecteur', champ.rangee, champ.colonne)]);
  gestes.push(['Raffinerie au contact', () => poser(etat, 'raffinerie', champ.rangee, champ.colonne + 1)]);
  gestes.push(['Raffinerie → niveau 2', () => {
    ameliorer(etat, etat.disposition.findIndex((b) => b.id === 'raffinerie'));
  }]);
  gestes.push(['Centrale', () => poser(etat, 'centrale', champ.rangee - 1, champ.colonne + 2)]);
  return gestes;
}

test('missions — la chaîne est jouable, et chaque geste en coche exactement une', () => {
  const { etat, champ } = baseNeuve();

  // Le montage doit partir de zéro, sinon la progression ne mesure rien.
  assert.deepEqual(avancement(etat), { faites: 0, total: MISSIONS.length });
  assert.ok(MISSIONS.length >= 3, `${MISSIONS.length} missions, c'est trop peu pour un tutoriel`);

  let precedent = 0;
  for (const [quoi, geste] of jouerLOuverture(etat, champ)) {
    geste();
    const { faites } = avancement(etat);
    assert.equal(
      faites, precedent + 1,
      `« ${quoi} » a fait passer la progression de ${precedent} à ${faites} — `
        + 'un geste de l\'ouverture coche exactement une mission',
    );
    precedent = faites;
  }

  assert.deepEqual(avancement(etat), { faites: MISSIONS.length, total: MISSIONS.length });
  assert.equal(missionCourante(etat), null, 'la chaîne finie doit ne plus rien mettre en avant');
});

test('missions — la chaîne tient dans les emplacements qu\'elle fait ouvrir', () => {
  // ⚠ LA GARDE QUI COMPTE. Une sixième mission demandant un cinquième bâtiment
  // rendrait le tutoriel INFINISSABLE sans une seconde amélioration du
  // Chantier — et rien à la relecture ne le dirait. Le tutoriel doit tenir
  // dans la place qu'il apprend à ouvrir.
  const { etat, champ } = baseNeuve();
  for (const [, geste] of jouerLOuverture(etat, champ)) geste();

  const chantier = etat.disposition.find((b) => b.id === 'chantierDeConstruction');
  const ouverts = emplacementsDuNiveau(chantier.niveau);
  assert.ok(
    etat.disposition.length <= ouverts,
    `le tutoriel demande ${etat.disposition.length} bâtiments pour ${ouverts} emplacements`,
  );

  // Falsifiable : sans l'amélioration du Chantier, la place NE suffit pas.
  // Sans cette assertion, la précédente passerait aussi sur un tutoriel vide.
  const neuve = baseNeuve().etat;
  const ouvertsAuDepart = emplacementsDuNiveau(
    neuve.disposition.find((b) => b.id === 'chantierDeConstruction').niveau,
  );
  assert.ok(
    etat.disposition.length > ouvertsAuDepart,
    'le tutoriel tiendrait sans faire monter le Chantier : il n\'apprend donc pas ce geste',
  );
});

test('missions — elles LISENT l\'état, elles ne l\'écrivent jamais', () => {
  const { etat, champ } = baseNeuve();
  for (const [, geste] of jouerLOuverture(etat, champ)) geste();

  // On photographie tout ce qui est sérialisable, missions comprises.
  const avant = JSON.stringify({ d: etat.disposition, e: etat.economie, p: etat.position });
  assert.ok(avant.length > 200, 'le montage ne photographie rien de substantiel');

  etatDesMissions(etat);
  missionCourante(etat);
  avancement(etat);

  assert.equal(
    JSON.stringify({ d: etat.disposition, e: etat.economie, p: etat.position }), avant,
    'une mission a modifié l\'état — elles n\'ont le droit que de le lire',
  );
});

test('missions — rien n\'est mémorisé : défaire un geste décoche sa mission', () => {
  // ⚠ C'EST VOULU, PAS UN DÉFAUT. Retenir « faite » créerait une seconde
  // source de vérité sur ce que le joueur a construit ; la base est la
  // première, et elle ne peut pas mentir.
  const { etat, champ } = baseNeuve();
  for (const [, geste] of jouerLOuverture(etat, champ)) geste();

  const cible = 'premiere-centrale';
  const etatAvant = etatDesMissions(etat).find((m) => m.id === cible);
  // Le montage doit d'abord AVOIR coché, sinon il ne mesure pas le décochage.
  assert.equal(etatAvant.faite, true, `${cible} n'était pas cochée avant démolition`);

  demolir(etat, etat.disposition.findIndex((b) => b.id === 'centrale'));
  assert.equal(
    etatDesMissions(etat).find((m) => m.id === cible).faite, false,
    'démolir le bâtiment d\'une mission doit la décocher',
  );
});

test('missions — la mise en avant est la première NON faite, pas la suivante', () => {
  // Le joueur n'est obligé à rien : il peut poser une Centrale avant sa
  // Raffinerie. Le tutoriel doit alors le rattraper sur ce qui manque
  // VRAIMENT, pas lui redemander ce qu'il vient de faire.
  const { etat, champ } = baseNeuve();
  ameliorer(etat, 0);
  poser(etat, 'centrale', champ.rangee - 1, champ.colonne + 2);

  const rangs = MISSIONS.map((m) => m.id);
  const courante = missionCourante(etat);
  assert.equal(courante.id, 'collecteur-sur-un-champ');

  // Falsifiable : une mission PLUS LOIN dans la liste est bien déjà faite,
  // donc « la suivante de la dernière faite » aurait donné une autre réponse.
  const derniere = etatDesMissions(etat).filter((m) => m.faite).pop();
  assert.ok(
    rangs.indexOf(derniere.id) > rangs.indexOf(courante.id),
    'le montage ne distingue pas les deux façons de choisir la mission courante',
  );
});

test('missions — aucun nombre ni aucun nom n\'est recopié à la main', () => {
  const textes = etatDesMissions(baseNeuve().etat);

  // Le niveau visé est celui de la table, pas un « 2 » écrit à la main.
  const vise = ECONOMIE_NIVEAU.premierNiveauPayant;
  assert.ok(
    textes.some((m) => m.titre.includes(`niveau ${vise}`)),
    `aucune mission ne nomme le niveau ${vise} de ECONOMIE_NIVEAU.premierNiveauPayant`,
  );

  // Le niveau qui coûte de l'électricité se MESURE sur coutDeMontee.
  let mesure = null;
  for (const id of Object.keys(BASE_BATIMENTS)) {
    for (let n = vise; n <= GEOGRAPHIE.niveauPlafond; n++) {
      if ((coutDeMontee(id, n).electricite ?? 0) > 0) {
        mesure = mesure === null ? n : Math.min(mesure, n);
        break;
      }
    }
  }
  assert.equal(premierNiveauElectrique(), mesure, 'le niveau électrique annoncé n\'est pas le mesuré');
  assert.ok(
    textes.some((m) => m.explication.includes(`niveau ${mesure}`)),
    `aucune explication ne nomme le niveau ${mesure}, celui où l'électricité commence à coûter`,
  );

  // ⚠ LE VOCABULAIRE DU JOUEUR, JAMAIS CELUI DE L'OUVRAGE (CLAUDE.md §4).
  const tout = textes.map((m) => `${m.titre} ${m.explication}`).join(' ');
  const ouvrage = Object.values(BASE_BATIMENTS)
    .map((b) => b.nom.ouvrage).filter((n) => typeof n === 'string');
  assert.ok(ouvrage.length >= 3, `${ouvrage.length} noms Ouvrage lus : le balayage ne prouve rien`);
  for (const mot of ouvrage) {
    assert.ok(!tout.includes(mot), `le tutoriel emploie « ${mot} », qui est un nom de l'Ouvrage`);
  }
  // Et il emploie bien les noms du joueur, sinon l'assertion ci-dessus
  // passerait sur un tutoriel qui ne nommerait aucun bâtiment.
  for (const id of ['chantierDeConstruction', 'collecteur', 'raffinerie', 'centrale']) {
    assert.ok(tout.includes(BASE_BATIMENTS[id].nom.joueur), `${id} n'est jamais nommé`);
  }
});

// ---------------------------------------------------------------------------
// L'écran, et son câblage
// ---------------------------------------------------------------------------

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lignesDeMission, libelleAvancement } from '../src/ui/mission.js';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');
const lire = (...c) => readFileSync(join(RACINE, ...c), 'utf8');
/** La feuille sans ses commentaires : une garde qui lit sa propre prose ne garde rien. */
const sansCommentaires = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '');

test('missions — aucune ne lit l\'économie, et l\'écran peut donc se peindre à l\'ouverture', () => {
  // ⚠ LA GARDE QUE LE COMMENTAIRE DE `ui/mission.js` PROMET. L'écran ne se
  // repeint qu'à l'ouverture, ce qui n'est juste que tant qu'aucune mission ne
  // dépend d'une grandeur qui court toute seule. Une mission « accumule 100
  // quartz » avancerait sous les yeux du joueur sans que rien ne se redessine.
  //
  // ⚠ LES LIGNES D'IMPORT SONT ÔTÉES AVANT LE BALAYAGE. `data/economie.js` est
  // la table des COÛTS, pas les stocks du joueur : la confondre avec
  // `etat.economie` ferait tomber la garde sur un import parfaitement légitime,
  // et la première version de ce test le faisait.
  const source = lire('src', 'sim', 'missions.js')
    .replace(/\/\/[^\n]*/g, '')
    .replace(/^\s*import[^;]*;/gm, '');
  assert.ok(
    !/\beconomie\b/.test(source),
    'une mission lit `economie` : l\'écran doit alors être rafraîchi, pas seulement peint à l\'ouverture',
  );
  // Falsifiable des deux côtés : le motif attrape une lecture de l'économie, et
  // le retrait des imports ne l'aveugle pas sur le corps du fichier.
  assert.ok(/\beconomie\b/.test('const q = etat.economie.stocks.quartz;'));
  assert.ok(/\beconomie\b/.test('const { economie } = etat;'));
  assert.ok(source.includes('ECONOMIE_NIVEAU'), 'le retrait des imports a emporté le corps du fichier');
});

test('missions — une seule ligne est mise en avant, et aucune quand c\'est fini', () => {
  const { etat, champ } = baseNeuve();
  const enAvant = (e) => lignesDeMission(e).filter((m) => m.courante);

  assert.equal(enAvant(etat).length, 1, 'une base neuve doit mettre exactement une mission en avant');
  assert.equal(enAvant(etat)[0].id, MISSIONS[0].id);
  assert.equal(libelleAvancement(etat), `Mission 0 / ${MISSIONS.length}`);

  for (const [, geste] of jouerLOuverture(etat, champ)) {
    geste();
    const encore = lignesDeMission(etat).some((m) => !m.faite);
    assert.equal(
      enAvant(etat).length, encore ? 1 : 0,
      'il faut exactement une mission en avant tant qu\'il en reste, et zéro ensuite',
    );
  }
  // ⚠ « TERMINÉ », PAS « 5 / 5 » : un compte plein se lit comme un compteur qui
  // pourrait encore monter.
  assert.equal(libelleAvancement(etat), 'Tutoriel terminé');
});

test('missions — l\'onglet est vivant, et chaque écran allume le sien', () => {
  const html = sansCommentaires(lire('src', 'index.src.html'));

  // L'onglet Mission n'est plus mort — c'était le sens de « bouton mort pour
  // l'instant, futur tuto » : le tuto est là.
  assert.match(html, /<button[^>]*id="onglet-mission"[^>]*>Mission<\/button>/,
    'l\'onglet Mission n\'existe plus, ou n\'a pas d\'identifiant');
  const balise = html.match(/<button[^>]*id="onglet-mission"[^>]*>/)[0];
  assert.ok(!/disabled/.test(balise), 'l\'onglet Mission est encore désactivé');
  assert.ok(!/class="[^"]*\bfutur\b/.test(balise), 'l\'onglet Mission se dit encore « futur »');

  // L'écran existe, et l'ORDRE DU DOCUMENT est l'ordre des onglets — jamais un
  // `order` CSS, qui casserait le clavier et la lecture d'écran.
  for (const id of ['ecran-mission', 'mission-avancement', 'mission-liste']) {
    assert.ok(html.includes(`id="${id}"`), `#${id} manque au balisage`);
  }
  assert.ok(
    html.indexOf('id="onglet-base"') < html.indexOf('id="onglet-mission"')
      && html.indexOf('id="onglet-mission"') < html.indexOf('id="onglet-options"'),
    'l\'onglet Mission n\'est plus entre Base et Options',
  );

  // ⚠ LA TABLE COUVRE TOUS LES ÉCRANS. Un écran absent de `ONGLET_DE_L_ECRAN`
  // n'allumerait aucun onglet, et rien ne planterait : le joueur ne saurait
  // simplement plus où il est.
  const session = lire('src', 'ui', 'session.js');
  const ecrans = session.match(/const ECRANS = \[([^\]]*)\]/)[1]
    .match(/'([a-z]+)'/g).map((s) => s.replace(/'/g, ''));
  const table = session.match(/const ONGLET_DE_L_ECRAN = \{([\s\S]*?)\};/)[1]
    .match(/^\s*([a-z]+):/gm).map((s) => s.trim().replace(':', ''));
  assert.ok(ecrans.length >= 4, `${ecrans.length} écrans lus : le montage ne mesure rien`);
  assert.deepEqual(
    table.slice().sort(), ecrans.slice().sort(),
    'un écran n\'a pas d\'onglet, ou un onglet n\'a pas d\'écran',
  );
});

test('missions — l\'écran DÉSIGNE la mission courante, il ne la recalcule pas', () => {
  // ⚠ TROUVÉ PAR FALSIFICATION, PAS PAR RELECTURE. `lignesDeMission` refaisait
  // le choix sur place (`findIndex((m) => !m.faite)`) : remplacer ce choix par
  // « la suivante de la dernière faite » DANS L'ÉCRAN ne faisait tomber aucun
  // test, parce que le test du moteur n'interrogeait que `missionCourante` et
  // que celui de l'écran ne comptait que les lignes. Deux lectures de la même
  // règle, dont une seule était gardée.
  const { etat, champ } = baseNeuve();
  ameliorer(etat, 0);
  poser(etat, 'centrale', champ.rangee - 1, champ.colonne + 2);

  // Le montage doit être celui qui distingue les deux façons de choisir :
  // une mission plus loin dans la liste est faite, une plus tôt ne l'est pas.
  const lignes = lignesDeMission(etat);
  const rangs = MISSIONS.map((m) => m.id);
  const derniereFaite = lignes.filter((m) => m.faite).pop();
  const enAvant = lignes.find((m) => m.courante);
  assert.ok(
    rangs.indexOf(derniereFaite.id) > rangs.indexOf(enAvant.id),
    'le montage ne distingue pas les deux façons de choisir',
  );

  assert.equal(
    enAvant.id, missionCourante(etat).id,
    'l\'écran met en avant une autre mission que le moteur : il la recalcule',
  );

  // Et l'accord tient à chaque étape de l'ouverture, pas seulement sur ce cas.
  const { etat: autre, champ: sonChamp } = baseNeuve(11);
  for (const [, geste] of jouerLOuverture(autre, sonChamp)) {
    geste();
    const moteur = missionCourante(autre);
    const ecran = lignesDeMission(autre).find((m) => m.courante) ?? null;
    assert.equal(ecran === null ? null : ecran.id, moteur === null ? null : moteur.id);
  }
});
