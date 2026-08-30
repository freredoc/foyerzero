// Les missions du tutoriel : elles LISENT la base, et c'est tout.
//
// Ce fichier garde ce qu'aucune relecture n'attrape : que la chaîne dictée par
// Ethan le 29/08 est réellement JOUABLE de bout en bout avec le vrai moteur,
// qu'aucune mission n'écrit dans l'état, qu'aucun nombre de la chaîne n'a été
// recopié dans le code qui l'interprète, et que la mini-fenêtre ne promet rien
// qu'elle ne sache montrer.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  creerEtat, poser, ameliorer, demolir, poserEffectif, retirerEffectif,
  problemesDeLaPose, problemesDeLaPoseDEffectif, serialiser, charger,
  reglerTutoriel, tutorielEstFerme, niveauDuChantier,
} from '../src/sim/state.js';
import { ressourceDeLaCase } from '../src/sim/champs.js';
import {
  BASE_BATIMENTS, BATIMENT_DE_CHASSIS, GEOMETRIE_BASE, coutDeMontee, emplacementsDuNiveau,
} from '../src/data/base.js';
import { GRILLE, UNITES, DEFENSES } from '../src/data/combat.js';
import { ARBRE_RECHERCHE } from '../src/data/recherche.js';
import { ECONOMIE_NIVEAU } from '../src/data/economie.js';
import { GEOGRAPHIE, POINTS_ARMEE } from '../src/data/sites.js';
import { CHAINE_TUTORIEL, FAMILLES_OBJECTIF } from '../src/data/missions.js';
import {
  MISSIONS, etatDesMissions, missionCourante, avancement, premierNiveauElectrique,
} from '../src/sim/missions.js';
import {
  lignesDeMission, libelleAvancement, compteDObjectif, vueDuTutoriel,
  signatureDuTutoriel, MARQUE_A_VENIR,
} from '../src/ui/mission.js';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');
const lire = (...c) => readFileSync(join(RACINE, ...c), 'utf8');
/** La feuille sans ses commentaires : une garde qui lit sa propre prose ne garde rien. */
const sansCommentaires = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '');
const T0 = 1_700_000_000_000;

// -- le montage : on joue la chaîne avec le VRAI moteur ----------------------
//
// ⚠ AUCUNE CASE N'EST ÉCRITE À LA MAIN. Le montage DEMANDE au moteur où poser —
// `problemesDeLaPose` sur la bande des bâtiments — au lieu de choisir des
// coordonnées qui marchent pour une graine. Sept des onze bâtiments sont
// uniques et ne peuvent pas se toucher : une liste de coordonnées écrite en dur
// aurait tenu jusqu'au premier changement de terrain, puis serait devenue une
// énigme.

function baseNeuve(graine = 7) {
  return creerEtat({ graine });
}

/** Une base à qui rien ne manque : on mesure la chaîne, pas l'économie. */
function approvisionner(etat) {
  for (const r of Object.keys(etat.economie.ressources)) {
    etat.economie.ressources[r] = 9_000_000_000;
  }
  return etat;
}

function poserOuLever(etat, id, ressource = null) {
  const g = GEOMETRIE_BASE;
  for (let r = g.premiereRangee; r <= g.derniereRangee; r++) {
    for (let c = g.premiereColonne; c <= g.derniereColonne; c++) {
      if (ressource !== null && ressourceDeLaCase(etat.champs, r, c) !== ressource) continue;
      if (problemesDeLaPose(etat, id, r, c).length > 0) continue;
      poser(etat, id, r, c);
      return { rangee: r, colonne: c };
    }
  }
  throw new Error(`montage : aucune case légale pour ${id}${ressource ? ` sur ${ressource}` : ''}`);
}

function poserGarnisonOuLever(etat, id, niveau) {
  const d = GRILLE.bandes.defense;
  for (let r = d.premiere; r <= d.derniere; r++) {
    for (let c = 1; c <= GRILLE.largeur; c++) {
      const piece = { id, rangee: r, colonne: c, niveau };
      if (problemesDeLaPoseDEffectif(etat, 'garnison', piece).length > 0) continue;
      poserEffectif(etat, 'garnison', piece);
      return piece;
    }
  }
  throw new Error(`montage : aucune case de garnison pour ${id}`);
}

function monter(etat, id, niveau) {
  for (let i = 0; i < etat.disposition.length; i++) {
    while (etat.disposition[i].id === id && etat.disposition[i].niveau < niveau) ameliorer(etat, i);
  }
}

function monterTout(etat, niveau) {
  for (let i = 0; i < etat.disposition.length; i++) {
    while (etat.disposition[i].niveau < niveau) ameliorer(etat, i);
  }
}

/** La chaîne dictée, geste par geste, dans l'ordre d'Ethan. */
function gestesDeLaChaine(etat) {
  return [
    ['un Collecteur sur du quartz', () => poserOuLever(etat, 'collecteur', 'quartz')],
    ['le Chantier au deuxième palier', () => monter(etat, 'chantierDeConstruction', 2)],
    ['trois Collecteurs de quartz au niveau 2', () => {
      poserOuLever(etat, 'collecteur', 'quartz');
      poserOuLever(etat, 'collecteur', 'quartz');
      monter(etat, 'collecteur', 2);
    }],
    ['le Chantier au troisième palier', () => monter(etat, 'chantierDeConstruction', 3)],
    ['deux Centrales, toute la base au niveau 3', () => {
      poserOuLever(etat, 'centrale');
      poserOuLever(etat, 'centrale');
      monterTout(etat, 3);
    }],
    ['le Chantier au cinquième palier', () => monter(etat, 'chantierDeConstruction', 5)],
    ['Raffinerie et Accumulateur, toute la base au niveau 5', () => {
      poserOuLever(etat, 'raffinerie');
      poserOuLever(etat, 'accumulateur');
      monterTout(etat, 5);
    }],
    ['Centre de commandement et Dépôt de véhicules au niveau 3', () => {
      poserOuLever(etat, 'centreDeCommandement');
      poserOuLever(etat, 'depotDeVehicules');
      monter(etat, 'centreDeCommandement', 3);
      monter(etat, 'depotDeVehicules', 3);
    }],
    ['deux Éclaireurs au niveau 3', () => {
      poserEffectif(etat, 'armee', { id: 'ratisseur', vague: 1, colonne: 1, niveau: 3 });
      poserEffectif(etat, 'armee', { id: 'ratisseur', vague: 1, colonne: 2, niveau: 3 });
    }],
    ['QG de défense et Complexe de défense au niveau 3', () => {
      poserOuLever(etat, 'qgDeDefense');
      poserOuLever(etat, 'complexeDeDefense');
      monter(etat, 'qgDeDefense', 3);
      monter(etat, 'complexeDeDefense', 3);
    }],
    ['deux Murs et deux Tourelles au niveau 3', () => {
      for (const id of ['merlon', 'merlon', 'casemate', 'casemate']) {
        poserGarnisonOuLever(etat, id, 3);
      }
    }],
    ['les trois bâtiments de tête', () => {
      monter(etat, 'chantierDeConstruction', 8);
      monter(etat, 'centreDeCommandement', 7);
      monter(etat, 'qgDeDefense', 5);
    }],
    ['les trois moyennes', () => {
      monterTout(etat, 7);
      for (const p of etat.armee) p.niveau = 6;
      for (const p of etat.garnison) p.niveau = 5;
    }],
  ];
}

function jouerToutLeTutoriel(graine = 7) {
  const etat = approvisionner(baseNeuve(graine));
  for (const [, geste] of gestesDeLaChaine(etat)) geste();
  return etat;
}

// -- la chaîne ---------------------------------------------------------------

test('missions — la chaîne dictée est jouable jusqu\'au bout, avec le vrai moteur', () => {
  const etat = approvisionner(baseNeuve());
  const verifiables = CHAINE_TUTORIEL.length
    - CHAINE_TUTORIEL.filter((m) => m.objectifs.some((o) => o.famille === 'sans-moteur')).length;

  // Le montage doit partir de zéro, sinon la progression ne mesure rien.
  assert.deepEqual(avancement(etat), { faites: 0, total: verifiables });
  assert.ok(verifiables >= 10, `${verifiables} missions vérifiables, c'est trop peu pour un tutoriel`);

  let plusHaut = 0;
  for (const [quoi, geste] of gestesDeLaChaine(etat)) {
    geste();
    const { faites } = avancement(etat);
    assert.ok(faites >= plusHaut - 2,
      `« ${quoi} » a fait retomber la progression de ${plusHaut} à ${faites}`);
    plusHaut = Math.max(plusHaut, faites);
  }

  assert.deepEqual(
    avancement(etat), { faites: verifiables, total: verifiables },
    'la chaîne d\'Ethan doit pouvoir se finir : toute mission vérifiable doit se cocher',
  );
  assert.equal(missionCourante(etat), null, 'la chaîne finie ne met plus rien en avant');
  assert.equal(libelleAvancement(etat), 'Tutoriel terminé');
});

test('missions — la chaîne tient dans les emplacements qu\'elle fait ouvrir', () => {
  // ⚠ LA FAUTE QUE CE TEST EXISTE POUR EMPÊCHER : une mission qui demande un
  // bâtiment de plus que le Chantier n'ouvre d'emplacements rend le tutoriel
  // INFINISSABLE, et rien à la relecture ne le dirait.
  const etat = approvisionner(baseNeuve());
  for (const [quoi, geste] of gestesDeLaChaine(etat)) {
    geste();
    const ouverts = emplacementsDuNiveau(niveauDuChantier(etat));
    assert.ok(
      etat.disposition.length <= ouverts,
      `après « ${quoi} » : ${etat.disposition.length} bâtiments pour ${ouverts} emplacements`,
    );
  }

  // ⚠ MESURÉ, ET LA MARGE EST NULLE : la chaîne pose EXACTEMENT le nombre de
  // bâtiments que le Chantier de niveau 5 ouvre. Une mission de plus, ou une
  // table d'emplacements retouchée, et le tutoriel devient injouable.
  assert.equal(etat.disposition.length, 12, 'la chaîne ne pose plus douze bâtiments');
  assert.equal(emplacementsDuNiveau(5), 12, 'la table d\'emplacements du Chantier a bougé');

  // ⚠⚠ ET LA MESURE CI-DESSUS NE SUFFISAIT PAS — LA FALSIFICATION L'A MONTRÉ.
  // Le montage ci-dessus est écrit à la main dans ce fichier : ajouter deux
  // bâtiments à `data/missions.js` ne le change pas, donc il passait VERT sur
  // une chaîne devenue injouable. Ce qui suit lit la CHAÎNE, pas le montage :
  // à chaque mission, ce que les objectifs exigent depuis le début doit tenir
  // dans les emplacements que les Chantiers déjà demandés ont ouverts.
  const parId = new Map();
  let niveauChantierExige = 1;
  const chantier = 'chantierDeConstruction';
  for (const m of CHAINE_TUTORIEL) {
    for (const o of m.objectifs.filter((x) => x.famille === 'batiments')) {
      parId.set(o.id, Math.max(parId.get(o.id) ?? 0, o.nombre));
      if (o.id === chantier) niveauChantierExige = Math.max(niveauChantierExige, o.niveau ?? 1);
    }
    const exiges = [...parId.values()].reduce((t, n) => t + n, 0);
    const ouverts = emplacementsDuNiveau(niveauChantierExige);
    assert.ok(
      exiges <= ouverts,
      `à « ${m.id} » la chaîne exige ${exiges} bâtiments pour ${ouverts} emplacements `
        + `(Chantier au niveau ${niveauChantierExige}) : le tutoriel devient infinissable`,
    );
  }
  // Falsifiable : la chaîne doit vraiment SERRER, sinon la boucle ne mesure rien.
  const exigesEnTout = [...parId.values()].reduce((t, n) => t + n, 0);
  assert.ok(exigesEnTout >= 12, `${exigesEnTout} bâtiments exigés — le montage ne serre rien`);
});

test('missions — elles LISENT l\'état, elles ne l\'écrivent jamais', () => {
  const etat = jouerToutLeTutoriel();
  const photo = JSON.stringify({
    d: etat.disposition, e: etat.economie, g: etat.garnison, a: etat.armee, t: etat.tutoriel,
  });
  assert.ok(photo.length > 500, 'le montage ne photographie rien de substantiel');

  etatDesMissions(etat);
  missionCourante(etat);
  avancement(etat);
  vueDuTutoriel(etat);

  assert.equal(
    JSON.stringify({
      d: etat.disposition, e: etat.economie, g: etat.garnison, a: etat.armee, t: etat.tutoriel,
    }),
    photo,
    'une mission a modifié l\'état — elles n\'ont le droit que de le lire',
  );
});

test('missions — rien n\'est mémorisé : défaire un geste décoche sa mission', () => {
  // ⚠ C'EST VOULU, PAS UN DÉFAUT. Retenir « faite » créerait une seconde
  // source de vérité sur ce que le joueur a construit ; la base est la
  // première, et elle ne peut pas mentir.
  const etat = jouerToutLeTutoriel();
  const cible = 'deux-eclaireurs';
  assert.equal(etatDesMissions(etat).find((m) => m.id === cible).faite, true,
    `${cible} n'était pas cochée avant qu'on défasse le geste`);

  retirerEffectif(etat, 'armee', 0);
  assert.equal(etatDesMissions(etat).find((m) => m.id === cible).faite, false,
    'retirer une unité doit décocher la mission qui la demandait');

  // Et côté bâtiments, la même chose.
  const avantDemolition = etatDesMissions(etat).find((m) => m.id === 'qg-et-complexe');
  assert.equal(avantDemolition.faite, true);
  demolir(etat, etat.disposition.findIndex((b) => b.id === 'complexeDeDefense'));
  assert.equal(etatDesMissions(etat).find((m) => m.id === 'qg-et-complexe').faite, false);
});

test('missions — la mise en avant est la première NON faite, pas la suivante', () => {
  // Le joueur n'est obligé à rien : il peut monter son Chantier avant de poser
  // son premier Collecteur. Le tutoriel doit alors le rattraper sur ce qui
  // manque VRAIMENT, pas lui redemander ce qu'il vient de faire.
  const etat = approvisionner(baseNeuve());
  monter(etat, 'chantierDeConstruction', 2);

  const rangs = CHAINE_TUTORIEL.map((m) => m.id);
  const courante = missionCourante(etat);
  assert.equal(courante.id, 'premier-collecteur');

  // Falsifiable : une mission PLUS LOIN dans la liste est bien déjà faite,
  // donc « la suivante de la dernière faite » aurait donné une autre réponse.
  const derniereFaite = etatDesMissions(etat).filter((m) => m.faite).pop();
  assert.ok(
    rangs.indexOf(derniereFaite.id) > rangs.indexOf(courante.id),
    'le montage ne distingue pas les deux façons de choisir la mission courante',
  );
});

// -- ce qui n'a pas encore de moteur -----------------------------------------

test('missions — ce qui n\'a pas de moteur se dit, ne se coche pas, et ne bloque rien', () => {
  // ⚠ QUATRE MISSIONS D'ETHAN ATTENDENT UN MOTEUR : deux raids, le
  // redéploiement de la base et la seconde base. Les taire aurait amputé sa
  // feuille de route ; les compter aurait donné un compteur qui n'atteint
  // jamais son plafond, c'est-à-dire un tutoriel infinissable.
  const sansMoteur = CHAINE_TUTORIEL
    .filter((m) => m.objectifs.some((o) => o.famille === 'sans-moteur'));
  assert.ok(sansMoteur.length > 0, 'le montage ne mesure rien si tout a un moteur');

  const etat = jouerToutLeTutoriel();
  const lignes = etatDesMissions(etat);

  for (const m of sansMoteur) {
    const ligne = lignes.find((l) => l.id === m.id);
    assert.equal(ligne.verifiable, false, `${m.id} se dit vérifiable`);
    assert.equal(ligne.faite, false, `${m.id} s'est cochée toute seule`);
    // Elle porte sa RAISON, pas un compteur muet.
    assert.ok(ligne.objectifs[0].libelle.length > 10, `${m.id} ne dit pas ce qui manque`);
  }

  // Le compteur ne les compte pas, et la mise en avant les saute.
  const { faites, total } = avancement(etat);
  assert.equal(total, CHAINE_TUTORIEL.length - sansMoteur.length);
  assert.equal(faites, total, 'tout ce qui est vérifiable est fait dans ce montage');
  assert.equal(missionCourante(etat), null,
    'une mission sans moteur retient la mise en avant : le tutoriel ne finit jamais');

  // ⚠ ET ELLE NE LA RETIENT PAS NON PLUS EN COURS DE ROUTE. Sur une base neuve,
  // la mission mise en avant doit être vérifiable — sans quoi le joueur serait
  // arrêté à la dixième ligne pour toujours.
  assert.equal(missionCourante(baseNeuve()).verifiable, true);
});

// -- les compteurs -----------------------------------------------------------

test('missions — le compteur d\'objectif compte, et son dénominateur peut bouger', () => {
  const etat = approvisionner(baseNeuve());
  const objectif = (id) => etatDesMissions(etat).find((m) => m.id === id).objectifs;

  assert.deepEqual(objectif('trois-collecteurs-de-quartz').map(compteDObjectif), ['0 / 3']);
  poserOuLever(etat, 'collecteur', 'quartz');
  monter(etat, 'chantierDeConstruction', 2);
  monter(etat, 'collecteur', 2);
  assert.deepEqual(objectif('trois-collecteurs-de-quartz').map(compteDObjectif), ['1 / 3']);

  // ⚠ LE DÉNOMINATEUR DE « CHAQUE BÂTIMENT AU NIVEAU n » EST LE NOMBRE DE
  // BÂTIMENTS POSÉS : il monte quand le joueur construit. C'est ce qui fait que
  // poser du neuf DÉCOCHE une mission de mise à niveau — conséquence assumée de
  // « rien n'est mémorisé », et non un défaut de calcul.
  const avant = objectif('deux-centrales').find((o) => o.libelle.startsWith('chaque'));
  poserOuLever(etat, 'centrale');
  const apres = objectif('deux-centrales').find((o) => o.libelle.startsWith('chaque'));
  assert.ok(apres.total > avant.total,
    'poser un bâtiment doit augmenter le dénominateur de « chaque bâtiment au niveau n »');
});

test('missions — aucune clé de code ne fuit dans un libellé lu par le joueur', () => {
  // ⚠ LA RÉGRESSION QUE CE TEST GARDE : les trois moyennes s'affichaient
  // « armee en moyenne au niveau 6,0 » — la clé de `MOYENNES`, sans accent,
  // arrivée sous les yeux du joueur. Même faute que `axe` contre `axeLibelle`
  // dans `data/combat.js`, et elle ne se voit qu'à l'écran.
  const etat = jouerToutLeTutoriel();
  const textes = etatDesMissions(etat)
    .flatMap((m) => [m.titre, m.explication, ...m.objectifs.map((o) => o.libelle)]);
  assert.ok(textes.length > 20, 'le montage ne balaie pas assez de texte');

  for (const cle of ['armee', 'batiments', 'chantierDeConstruction', 'centreDeCommandement',
    'qgDeDefense', 'depotDeVehicules', 'complexeDeDefense', 'ratisseur', 'merlon', 'casemate']) {
    for (const t of textes) {
      assert.ok(!t.includes(cle), `« ${cle} » — une clé de code est affichée : « ${t} »`);
    }
  }
  // Falsifiable : les NOMS, eux, sont bien là.
  assert.ok(textes.some((t) => t.includes(BASE_BATIMENTS.chantierDeConstruction.nom.joueur)));
  assert.ok(textes.some((t) => t.includes(UNITES.ratisseur.nom.joueur)));
});

// -- les prérequis, mesurés --------------------------------------------------

test('missions — les prérequis d\'une pièce se MESURENT sur les tables', () => {
  // ⚠⚠ CE TEST A CHANGÉ DE MESURE AU LOT RECHERCHE, PAS D'INTENTION. Il
  // vérifiait que le tutoriel DIT le niveau d'apparition, lu dans `UNITES` et
  // `DEFENSES` ; la recherche seule ouvre désormais les pièces, donc il vérifie
  // que le tutoriel dit le COÛT, lu dans `ARBRE_RECHERCHE`. Dans les deux cas :
  // la phrase se MESURE sur la table, elle n'y est pas recopiée, et le jour où
  // Ethan réétalonne, elle suit toute seule.
  //
  // ⚠ ET LA TENSION QUE CE TEST RENDAIT VISIBLE A DISPARU. La chaîne demandait
  // deux Éclaireurs alors qu'elle ne montait le Centre de commandement qu'au
  // niveau 7, sous l'apparition de l'Éclaireur. `ratisseur` est GRATUIT en
  // offense : le tutoriel dit « déjà débloqué », et la branche à zéro se mesure
  // ci-dessous plutôt que de se supposer.
  const lignes = etatDesMissions(baseNeuve());
  let gratuites = 0;
  let payantes = 0;

  for (const m of CHAINE_TUTORIEL) {
    for (const o of m.objectifs.filter((x) => x.famille === 'effectif')) {
      const dits = lignes.find((l) => l.id === m.id).prerequis;
      const commandant = BASE_BATIMENTS[POINTS_ARMEE[
        o.force === 'garnison' ? 'defense' : 'offense'].batiment].nom.joueur;
      const branche = o.force === 'garnison' ? 'defense' : 'offense';
      const prix = ARBRE_RECHERCHE[branche][o.id].unite;
      if (prix === 0) {
        gratuites += 1;
        assert.ok(dits.some((d) => d.includes('déjà débloqué')),
          `${m.id} : ${o.id} est gratuit, la phrase ne le dit pas — ${dits.join(' / ')}`);
      } else {
        payantes += 1;
        assert.ok(
          dits.some((d) => d.includes(`${prix} points`) && d.includes(commandant)),
          `${m.id} : le coût mesuré (${prix}) n'est pas dit — ${dits.join(' / ')}`,
        );
      }
      const chassis = UNITES[o.id]?.chassis;
      if (chassis !== undefined) {
        const requis = BASE_BATIMENTS[BATIMENT_DE_CHASSIS[chassis]].nom.joueur;
        assert.ok(dits.some((d) => d.includes(requis)),
          `${m.id} : le bâtiment de production (${requis}) n'est pas dit`);
      }
    }
  }

  // Falsifiable : au moins une mission porte vraiment des prérequis, sinon la
  // boucle ci-dessus ne mesure rien.
  assert.ok(lignes.some((l) => l.prerequis.length > 0), 'aucun prérequis n\'a été calculé');
  // ⚠⚠ MESURÉ, PAS SUPPOSÉ : LES TROIS OBJECTIFS D'EFFECTIF DE LA CHAÎNE SONT
  // GRATUITS SOUS LA NOUVELLE RÈGLE — Éclaireur (offense), Merlon et Casemate
  // (défense). Le tutoriel est donc franchissable avec ZÉRO point de recherche,
  // et la tension « deux Éclaireurs pour un Centre de commandement au niveau 7 »
  // n'existe plus.
  //
  // ⚠ CONSÉQUENCE À CONNAÎTRE : la branche « payante » de `prerequisDe` n'est
  // exercée par AUCUNE mission aujourd'hui. Ce n'est pas un trou de test, c'est
  // un fait de contenu — et le jour où la chaîne demandera une pièce payante,
  // l'assertion ci-dessous tombera et forcera à le regarder.
  assert.equal(gratuites, 3, `${gratuites} objectif(s) d'effectif gratuit(s), 3 attendus`);
  assert.equal(payantes, 0,
    `${payantes} objectif(s) payant(s) : la chaîne a changé, vérifier la phrase du coût`);
  // Et un ouvrage fixe n'en a pas — un mur n'a jamais eu besoin d'une caserne.
  const defense = lignes.find((l) => l.id === 'premiere-ligne-de-defense');
  assert.ok(defense.prerequis.every((d) => !d.includes('Caserne')));
});

// -- les nombres et les noms -------------------------------------------------

test('missions — la chaîne est dans data/, et le moteur n\'en recopie aucun nombre', () => {
  // ⚠ CLAUDE.md §4 : les valeurs de calibrage vivent dans `src/data/`. Les
  // niveaux visés et les comptes ont été DICTÉS par Ethan ; les écrire dans le
  // module qui les interprète en ferait une seconde table.
  const moteur = lire('src', 'sim', 'missions.js')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '');

  for (const id of new Set(CHAINE_TUTORIEL.flatMap((m) => m.objectifs.map((o) => o.id)))) {
    if (id === undefined) continue;
    assert.ok(!moteur.includes(`'${id}'`),
      `l'identifiant « ${id} » est écrit dans sim/missions.js : la chaîne vit dans data/`);
  }
  // Aucun nom du joueur non plus : ils viennent de `nom.joueur`.
  for (const b of Object.values(BASE_BATIMENTS)) {
    assert.ok(!moteur.includes(b.nom.joueur), `« ${b.nom.joueur} » est recopié dans le moteur`);
  }

  // Le niveau visé du tutoriel est celui de la table, pas un « 2 » à la main.
  const textes = etatDesMissions(baseNeuve());
  const chantier = textes.find((m) => m.id === 'chantier-deuxieme-niveau');
  assert.ok(chantier.titre.includes(String(ECONOMIE_NIVEAU.premierNiveauPayant)));

  // ⚠ ET LE SEUL SUBSTITUT DES EXPLICATIONS EST RÉSOLU. Un « {niveauElectrique} »
  // resté dans le texte serait affiché tel quel au joueur.
  for (const m of textes) {
    assert.ok(!m.explication.includes('{'), `substitut non résolu : « ${m.explication} »`);
  }
  const electrique = textes.find((m) => m.id === 'deux-centrales');
  assert.ok(electrique.explication.includes(`niveau ${premierNiveauElectrique()}`));

  // Et ce niveau-là est MESURÉ sur le barème, pas décrété.
  const n = premierNiveauElectrique();
  assert.ok(n >= ECONOMIE_NIVEAU.premierNiveauPayant && n <= GEOGRAPHIE.niveauPlafond);
  const auMoinsUn = Object.keys(BASE_BATIMENTS)
    .some((id) => (coutDeMontee(id, n).electricite ?? 0) > 0);
  assert.ok(auMoinsUn, `aucun bâtiment ne paie d'électricité au niveau ${n}`);
  for (const id of Object.keys(BASE_BATIMENTS)) {
    for (let v = ECONOMIE_NIVEAU.premierNiveauPayant; v < n; v++) {
      assert.equal(coutDeMontee(id, v).electricite ?? 0, 0,
        `${id} paie de l'électricité avant le niveau ${n}`);
    }
  }
});

test('missions — toutes les familles d\'objectif déclarées sont connues du moteur', () => {
  for (const m of CHAINE_TUTORIEL) {
    assert.ok(Array.isArray(m.objectifs) && m.objectifs.length > 0, `${m.id} n'a aucun objectif`);
    for (const o of m.objectifs) {
      assert.ok(FAMILLES_OBJECTIF.has(o.famille), `${m.id} : famille « ${o.famille} » inconnue`);
    }
    // ⚠ SEULES LES MISSIONS SANS MOTEUR PORTENT UN LIBELLÉ ÉCRIT À LA MAIN. Les
    // autres composent le leur depuis les tables ; un libellé écrit sur une
    // mission vérifiable serait un texte qui ne suit plus ses données.
    const sansMoteur = m.objectifs.some((o) => o.famille === 'sans-moteur');
    assert.equal(m.libelle !== undefined, sansMoteur,
      `${m.id} : un libellé écrit à la main n'est légitime que sans moteur`);
  }
  assert.equal(MISSIONS, CHAINE_TUTORIEL, 'MISSIONS doit rester la chaîne, pas une copie');
});

test('missions — aucune ne lit l\'économie, et l\'onglet peut donc se peindre à l\'ouverture', () => {
  // ⚠ LA GARDE QUE LE COMMENTAIRE DE `ui/mission.js` PROMET pour l'ONGLET, qui
  // ne se repeint qu'à l'ouverture. Une mission « accumule 100 quartz »
  // avancerait sous les yeux du joueur sans que rien ne se redessine.
  // La mini-fenêtre, elle, se rafraîchit à chaque image : elle n'a pas besoin
  // de cette garde, mais l'onglet si.
  //
  // ⚠ LES LIGNES D'IMPORT SONT ÔTÉES AVANT LE BALAYAGE. `data/economie.js` est
  // la table des COÛTS, pas les stocks du joueur : la confondre avec
  // `etat.economie` ferait tomber la garde sur un import parfaitement légitime,
  // et la première version de ce test le faisait.
  const source = lire('src', 'sim', 'missions.js')
    .replace(/\/\/[^\n]*/g, '')
    .replace(/^\s*import[\s\S]*?;/gm, '');
  assert.ok(
    !/\beconomie\b/.test(source),
    'une mission lit `economie` : l\'onglet doit alors être rafraîchi, pas seulement peint',
  );
  // Falsifiable des deux côtés : le motif attrape une lecture de l'économie, et
  // le retrait des imports ne l'aveugle pas sur le corps du fichier.
  assert.ok(/\beconomie\b/.test('const q = etat.economie.stocks.quartz;'));
  assert.ok(/\beconomie\b/.test('const { economie } = etat;'));
  assert.ok(source.includes('ECONOMIE_NIVEAU'), 'le retrait des imports a emporté le corps du fichier');
});

// -- les deux vues -----------------------------------------------------------

test('missions — une seule ligne est mise en avant, et aucune quand c\'est fini', () => {
  const etat = approvisionner(baseNeuve());
  const enAvant = (e) => lignesDeMission(e).filter((m) => m.courante);

  assert.equal(enAvant(etat).length, 1, 'une base neuve doit mettre exactement une mission en avant');
  assert.equal(enAvant(etat)[0].id, CHAINE_TUTORIEL[0].id);
  assert.equal(libelleAvancement(etat), `Mission 0 / ${avancement(etat).total}`);

  for (const [, geste] of gestesDeLaChaine(etat)) {
    geste();
    const encore = lignesDeMission(etat).some((m) => m.verifiable && !m.faite);
    assert.equal(
      enAvant(etat).length, encore ? 1 : 0,
      'il faut exactement une mission en avant tant qu\'il en reste, et zéro ensuite',
    );
  }
  // ⚠ « TERMINÉ », PAS « 13 / 13 » : un compte plein se lit comme un compteur
  // qui pourrait encore monter.
  assert.equal(libelleAvancement(etat), 'Tutoriel terminé');
});

test('missions — l\'écran DÉSIGNE la mission courante, il ne la recalcule pas', () => {
  // ⚠ LA FALSIFICATION QUI A IMPOSÉ CE TEST : `lignesDeMission` refaisait le
  // choix sur place, ce qui marchait, et restait une SECONDE lecture de la même
  // règle. On remplace ici la réponse du moteur et on exige que l'écran suive.
  const etat = approvisionner(baseNeuve());
  monter(etat, 'chantierDeConstruction', 2);
  const duMoteur = missionCourante(etat);
  const deLEcran = lignesDeMission(etat).find((m) => m.courante);
  assert.equal(deLEcran.id, duMoteur.id);
  // Falsifiable : « la suivante de la dernière faite » désignerait autre chose.
  const rangs = CHAINE_TUTORIEL.map((m) => m.id);
  assert.ok(rangs.indexOf(duMoteur.id) < rangs.indexOf('chantier-deuxieme-niveau'));
});

test('tutoriel — la mini-fenêtre ne montre rien qu\'elle ne sache montrer', () => {
  const etat = approvisionner(baseNeuve());

  // Ouverte sur une base neuve : elle porte la première mission et son compteur.
  const vue = vueDuTutoriel(etat);
  assert.ok(vue !== null, 'la mini-fenêtre doit s\'ouvrir sur une partie neuve');
  assert.equal(vue.avancement, libelleAvancement(etat));
  assert.equal(vue.objectifs.length, 1);
  assert.equal(vue.objectifs[0].compte, '0 / 1');
  assert.equal(vue.objectifs[0].atteint, false);

  // ⚠ TROIS RAISONS DE SE TAIRE, ET LES TROIS SE MESURENT.
  reglerTutoriel(etat, true);
  assert.equal(vueDuTutoriel(etat), null, 'fermée, elle ne montre rien');
  reglerTutoriel(etat, false);
  assert.ok(vueDuTutoriel(etat) !== null, 'rouverte, elle remontre la mission');

  const fini = jouerToutLeTutoriel();
  assert.equal(vueDuTutoriel(fini), null,
    'le tutoriel fini, la fenêtre disparaît au lieu de rester vide');
});

test('tutoriel — la fenêtre ne se reconstruit que quand son contenu change', () => {
  // ⚠ `rafraichir` PASSE DIX FOIS PAR SECONDE. Refaire les nœuds à chaque
  // passage les ferait clignoter sous le doigt — la faute que la palette de
  // garnison a dû corriger au lot GARNISON-ET-ARMÉE.
  const etat = approvisionner(baseNeuve());
  const avant = signatureDuTutoriel(vueDuTutoriel(etat));
  assert.notEqual(avant, '', 'le montage ne mesure rien si la fenêtre est déjà muette');
  assert.equal(signatureDuTutoriel(vueDuTutoriel(etat)), avant,
    'deux lectures sans geste doivent donner la même signature');

  poserOuLever(etat, 'collecteur', 'quartz');
  assert.notEqual(signatureDuTutoriel(vueDuTutoriel(etat)), avant,
    'un geste du joueur doit changer la signature, sinon la fenêtre resterait figée');

  // ⚠ ET ELLE PORTE LES LIBELLÉS, PAS SEULEMENT LA MISSION. Le dénominateur de
  // « chaque bâtiment au niveau n » bouge sans changer de mission : une
  // signature réduite à l'identifiant aurait figé le compteur à l'écran.
  const etat2 = approvisionner(baseNeuve());
  monter(etat2, 'chantierDeConstruction', 3);
  for (let i = 0; i < 3; i++) poserOuLever(etat2, 'collecteur', 'quartz');
  monter(etat2, 'collecteur', 2);
  poserOuLever(etat2, 'centrale');
  const s1 = signatureDuTutoriel(vueDuTutoriel(etat2));
  poserOuLever(etat2, 'centrale');
  assert.notEqual(signatureDuTutoriel(vueDuTutoriel(etat2)), s1,
    'un dénominateur qui bouge doit changer la signature');
});

test('tutoriel — quitter le tuto traverse la sauvegarde, et se retrouve dans l\'onglet', () => {
  // ⚠ CE N'EST PAS DE LA PROGRESSION, ET C'EST POUR ÇA QUE ÇA SE SAUVEGARDE.
  // Ce qui est FAIT se relit dans la base ; « j'ai fermé la fenêtre » est un
  // geste du joueur qu'aucune base n'exprime.
  const etat = approvisionner(baseNeuve());
  assert.equal(tutorielEstFerme(etat), false, 'une partie neuve ouvre le tutoriel');

  reglerTutoriel(etat, true);
  const relu = charger(serialiser(etat, T0), T0);
  assert.equal(tutorielEstFerme(relu), true, 'la fermeture doit survivre à un aller-retour');

  reglerTutoriel(relu, false);
  assert.equal(tutorielEstFerme(charger(serialiser(relu, T0), T0)), false);

  // Et la progression, elle, n'est PAS sauvegardée : elle se recalcule.
  assert.deepEqual(avancement(relu), avancement(etat));
  assert.throws(() => reglerTutoriel(etat, 'oui'), /booléen attendu/);
});

// -- le balisage -------------------------------------------------------------

test('tutoriel — la mini-fenêtre prend sa place, elle n\'avale pas le toucher', () => {
  const feuille = sansCommentaires(lire('src', 'index.src.html'));

  // ⚠⚠ LA FAUTE MESURÉE DE CE LOT, ET LA RAISON DE CE TEST. Écrite en
  // `position: absolute` au-dessus du défilement, la fenêtre AVALAIT le toucher
  // des cases qu'elle couvrait : dans un navigateur, `elementFromPoint` sur la
  // première case légale rendait `#tuto-objectifs`, et poser un Collecteur était
  // devenu impossible. C'est la faute que le dépôt interdit déjà au calque des
  // traits de voisinage (`pointer-events: none`) et au `transform: scale()` de
  // la grille — le doigt se décroche de la case qu'il vise. Elle prend donc SA
  // place dans la colonne, et la grille se fait plus courte.
  const regle = feuille.match(/#chantier-tuto\s*\{([^}]*)\}/);
  assert.ok(regle, 'la règle de #chantier-tuto a disparu');
  assert.ok(!/position:\s*absolute/.test(regle[1]),
    '#chantier-tuto est posé sur la grille : il avalera le toucher des cases qu\'il couvre');
  assert.ok(!/position:\s*fixed/.test(regle[1]), 'même faute que `absolute`');

  // Et la colonne qui rend ça possible : le champ empile, le défilement absorbe.
  const champ = feuille.match(/#chantier-champ\s*\{([^}]*)\}/)[1];
  assert.match(champ, /display:\s*flex/);
  assert.match(champ, /flex-direction:\s*column/);
  const defile = feuille.match(/#chantier-defile\s*\{([^}]*)\}/)[1];
  assert.match(defile, /flex:\s*1/, 'le défilement doit absorber ce que la fenêtre laisse');
  assert.ok(!/position:\s*absolute/.test(defile),
    'un défilement en absolute repasserait SOUS la fenêtre, et le toucher serait de nouveau avalé');

  // ⚠ CE N'EST PAS UNE SEPTIÈME BARRE. Sa hauteur vaut une, deux ou trois lignes
  // d'objectif : `0 0 auto`, jamais `0 0 Npx`. La garde des 288 px de
  // `chantier.test.js` énumère les hauteurs FIXES et resterait muette sur une
  // barre élastique — c'est ici que la consigne « tu compresses tout dans l'ui »
  // est tenue pour cette fenêtre-ci.
  assert.match(regle[1], /flex:\s*0 0 auto/);
  assert.ok(!/flex:\s*0 0 \d+px/.test(regle[1]),
    '#chantier-tuto a pris une hauteur fixe : c\'est une septième barre');
  assert.match(regle[1], /max-height/, 'sans plafond, trois objectifs mangeraient la grille');

  // ⚠ « EN BAS, AU-DESSUS DES BOUTONS AMÉLIORER » (Ethan, 29/08). L'ordre du
  // DOCUMENT est l'ordre de l'écran, jamais un `order` CSS : le même dessin
  // obtenu par `order` casserait la navigation au clavier et la lecture par un
  // lecteur d'écran.
  assert.ok(!/#chantier-tuto\s*\{[^}]*order:/.test(feuille), 'l\'ordre vient du document');
  const rang = (id) => feuille.indexOf(`id="${id}"`);
  assert.ok(rang('chantier-champ') < rang('chantier-defile'));
  assert.ok(rang('chantier-defile') < rang('chantier-tuto'),
    'la fenêtre doit venir APRÈS la grille : elle est en bas');
  assert.ok(rang('chantier-tuto') < rang('chantier-contexte'),
    'la fenêtre doit venir AVANT les boutons améliorer : elle est au-dessus d\'eux');

  // La croix, et le bouton qui la ramène depuis l'onglet Mission.
  assert.ok(feuille.includes('id="tuto-fermer"'), 'la croix de fermeture a disparu');
  assert.ok(feuille.includes('id="mission-rouvrir"'),
    'sans ce bouton, fermer le tutoriel le perdrait pour toujours');

  // ⚠ ET LA CROIX EST UNE CIBLE AU DOIGT. Un « × » de la taille du texte se rate
  // sur un téléphone, et le joueur toucherait la grille derrière.
  const croix = feuille.match(/#tuto-fermer\s*\{([^}]*)\}/)[1];
  const cote = Number(croix.match(/width:\s*(\d+)px/)[1]);
  assert.ok(cote >= 24, `croix de ${cote} px : trop petite pour un doigt`);
});

test('missions — l\'onglet est vivant, et chaque écran allume le sien', () => {
  const html = sansCommentaires(lire('src', 'index.src.html'));
  assert.ok(html.includes('id="onglet-mission"'), 'l\'onglet Mission a disparu');
  assert.ok(html.includes('id="ecran-mission"'), 'l\'écran Mission a disparu');

  const session = sansCommentaires(lire('src', 'ui', 'session.js'));
  const table = session.match(/const ONGLET_DE_L_ECRAN = \{([^}]*)\}/);
  assert.ok(table, 'ONGLET_DE_L_ECRAN a disparu : l\'onglet allumé redevient une condition');
  const ecrans = session.match(/const ECRANS = \[([^\]]*)\]/)[1]
    .split(',').map((s) => s.trim().replace(/'/g, '')).filter(Boolean);
  const couverts = [...table[1].matchAll(/(\w+):/g)].map((m) => m[1]);
  assert.deepEqual(couverts.slice().sort(), ecrans.slice().sort(),
    'la table des onglets ne couvre plus exactement les écrans');

  // ⚠ PLUS AUCUN ONGLET MORT DEPUIS LE LOT RECHERCHE (30/08) — et `recherche`
  // entre dans cette liste-ci, qui nomme les écrans que la table doit couvrir.
  for (const vivant of ['mission', 'monde', 'options', 'chantier', 'recherche']) {
    assert.ok(couverts.includes(vivant), `l'écran ${vivant} n'est plus dans la table`);
  }
  // ⚠ ET LA LISTE ATTENDUE EST VIDE. Elle valait `['Recherche']` : un onglet
  // mort se reconnaissait à sa classe, pas à un identifiant, puisque rien ne
  // l'écoutait. Le dernier vient de s'ouvrir. `test/chantier.test.js` tient la
  // garde POSITIVE — les cinq boutons portent un identifiant et aucun n'est
  // désactivé —, celle-ci garde la trace du dernier mort qui s'en va.
  const morts = [...html.matchAll(/<button[^>]*class="futur"[^>]*>([^<]*)</g)].map((m) => m[1]);
  assert.deepEqual(morts, [],
    `onglets morts : ${morts.join(', ')} — la liste a changé, dire lequel`);
  assert.ok(html.includes('id="onglet-recherche"'), 'l\'onglet Recherche a disparu');
  assert.ok(html.includes('id="ecran-recherche"'), 'l\'écran Recherche a disparu');

  // Et la marque des missions à venir est distincte des deux autres.
  assert.notEqual(MARQUE_A_VENIR, '✔');
  assert.notEqual(MARQUE_A_VENIR, '·');
});
