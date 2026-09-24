// LE MODE DÉVELOPPEUR ET LA SAUVEGARDE QU'ON EMPORTE — lot MODE-DEV, 19/09/2026.
//
// Deux tests, sur les deux verrous du lot, et pas un de plus.
//
// T1 porte sur la franchise : elle s'applique aux NEUF péages du dépôt, elle
// n'écrit RIEN dans l'état, et elle ne lève aucun verrou qui ne soit pas un
// prix. Le montage vérifie les trois, dans les deux sens — chaque péage est
// d'abord mesuré ACTIF, mode éteint, sur un état volontairement fauché.
//
// ⚠⚠ LE NEUVIÈME EST ENTRÉ AU LOT ARTILLERIE-RECHERCHE, 23/09, ET CETTE LIGNE
// DISAIT HUIT. Le dépôt en comptait huit le 19/09 ; `acheterUnSoutien` en fait
// un de plus, au même geste que `acheter`. ⚠ CE TEST N'A PAS ROUGI TOUT SEUL :
// il ÉNUMÈRE les péages, il ne les COMPTE pas — un péage neuf non branché sur
// la franchise serait donc passé en silence, et un péage neuf branché laissait
// cette phrase mentir. **Tout lot qui ajoute un péage ajoute sa ligne ici.**
//
// T2 porte sur le codec : aller-retour à l'octet par SHA-256, et refus nommés
// sur tout ce qui n'est pas une sauvegarde.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

import {
  creerEtat, rattraperJeu, poserEffectif, serialiser, charger, migrer, SAVE_VERSION,
  problemesDeLAmelioration, ameliorer,
  problemesDeLAmeliorationDEffectif, ameliorerEffectif,
} from '../src/sim/state.js';
import { baseCourante } from '../src/sim/base-courante.js';
import { enModeDeveloppeur } from '../src/sim/mode-developpeur.js';
import {
  problemesDeLAchat, acheter, problemesDeLAchatDUneBase, acheterUneBaseDePlus,
  problemesDeLAchatDUnSoutien, acheterUnSoutien, soutienEstAcquis,
} from '../src/sim/recherche.js';
import { problemesDuRaid, executerRaid } from '../src/sim/raid.js';
import { coutDUnRaid } from '../src/sim/prix-du-raid.js';
import { problemesDeLaReparationDUnePiece, reparerUnePiece } from '../src/sim/reparation.js';
import { apercuDuTransfert } from '../src/sim/transfert.js';
import { problemesDuDeplacement, ticksAvantProchainDeplacement } from '../src/sim/deplacement.js';
import { versLeTextePortable, depuisLeTextePortable } from '../src/ui/sauvegarde-portable.js';

const INSTANT = 1_700_000_000_000;
const codes = (liste) => liste.map((p) => p.code);

/**
 * Une partie fauchée : des satellites, une armée, et PLUS RIEN pour payer.
 * C'est le montage qui rend le test falsifiable — sur une partie riche, la
 * franchise ne se distinguerait pas de l'abondance.
 */
function partieFauchee(modeDeveloppeur) {
  const etat = creerEtat(2026);
  rattraperJeu(etat, 3001);
  const base = baseCourante(etat);
  base.disposition[0].niveau = 12;
  let colonne = 1;
  // ⚠ LE CENTRE DE COMMANDEMENT EST DANS LE MONTAGE PARCE QUE LA FRANCHISE NE
  // LE REMPLACE PAS. Arbitrage « non » d'Ethan sur les verrous non monétaires :
  // sans lui, `problemesDeLAmeliorationDEffectif` rend `sans-batiment` et le
  // geste est refusé même en mode développeur. Le premier jet de ce test l'a
  // découvert en levant, et c'est la bonne nouvelle : le refus tient.
  for (const id of ['caserne', 'depotDeVehicules', 'aerodrome', 'centreDeCommandement']) {
    base.disposition.push({ id, rangee: 13, colonne, niveau: 5, degatsMilli: 0 });
    base.economie.residus.push({});
    colonne += 2;
  }
  for (let c = 1; c <= 6; c += 1) {
    poserEffectif(etat, 'armee', { id: 'meute', vague: 1, colonne: c, niveau: 1 });
  }
  // La fauche, et elle porte sur les CINQ monnaies du dépôt.
  for (const r of Object.keys(base.economie.ressources)) base.economie.ressources[r] = 0;
  for (const k of Object.keys(base.reserveReparation)) base.reserveReparation[k] = 0;
  base.reserveReparationBatiments = 0;
  etat.recherche.pointsMilli = '0';
  etat.attaque.points = 0;
  // Une pièce abîmée à réparer, et un déplacement tout juste contracté.
  base.armee[0].degatsMilli = 1000;
  base.dernierDeplacementTick = etat.horloge.nbTicks;
  base.dernierDeplacementDelaiTicks = 5000;
  // Une seconde base, pour le transfert : copiée et éloignée de vingt cases.
  etat.bases.push(JSON.parse(JSON.stringify(base)));
  etat.bases[1].position = { rangee: base.position.rangee + 20, colonne: base.position.colonne };
  etat.modeDeveloppeur = modeDeveloppeur;
  return etat;
}

/** Le camp le plus proche — la cible de raid du montage. */
function campProche(etat) {
  const s = baseCourante(etat).satellites.presents.find((x) => x.type === 'camp');
  return s === undefined ? null : { rangee: s.rangee, colonne: s.colonne };
}

/** Une case à trois rangées au nord, pour éprouver le délai et lui seul. */
function caseVoisine(etat) {
  const p = baseCourante(etat).position;
  return { rangee: p.rangee - 3, colonne: p.colonne };
}

// ---------------------------------------------------------------------------
// MODE-DEV T1 — la franchise porte sur les neuf péages, et sur eux seuls
// ---------------------------------------------------------------------------

test('MODE-DEV T1 — la franchise lève les neuf péages, n\'écrit rien, et ne lève rien d\'autre', () => {
  // ⚠⚠ LE MONTAGE SE MESURE AVANT D'ÊTRE CRU. Mode ÉTEINT, chaque péage doit
  // MORDRE : sans cette moitié, un test qui verrait tout passer en mode allumé
  // ne prouverait rien — il pourrait mesurer une partie riche, ou un refus qui
  // n'existe plus du tout.
  const fauche = partieFauchee(false);
  const cible = campProche(fauche);
  assert.ok(cible !== null, 'le montage n\'a pas de camp à attaquer : il ne mesure rien');
  assert.equal(enModeDeveloppeur(fauche), false, 'le montage éteint se croit allumé');

  assert.ok(codes(problemesDeLAmelioration(fauche, 0)).some((c) => c.startsWith('manque:')),
    'péage 1 (bâtiment) : le montage n\'est pas fauché');
  assert.ok(codes(problemesDeLAmeliorationDEffectif(fauche, 'armee', 0)).some((c) => c.startsWith('manque:')),
    'péage 2 (pièce) : le montage n\'est pas fauché');
  assert.ok(codes(problemesDeLAchat(fauche, 'offense', 'belier', 'unite')).includes('pointsInsuffisants'),
    'péage 3 (recherche) : le montage n\'est pas fauché');
  assert.ok(codes(problemesDeLAchatDUneBase(fauche)).includes('pointsInsuffisants'),
    'péage 4 (droit de base) : le montage n\'est pas fauché');
  assert.ok(codes(problemesDuRaid(fauche, baseCourante(fauche), cible)).includes('points-insuffisants'),
    'péage 5 (raid) : le montage n\'est pas fauché');
  assert.ok(problemesDeLaReparationDUnePiece(fauche, 0).length > 0,
    'péage 6 (réparation) : le montage n\'est pas fauché');
  assert.ok(apercuDuTransfert(fauche, 0, 1, 1_000_000).recuMilli < 1_000_000,
    'péage 7 (transfert) : la taxe ne mord pas sur vingt cases');
  assert.ok(codes(problemesDuDeplacement(fauche, caseVoisine(fauche))).includes('delai'),
    'péage 8 (délai) : le montage n\'est pas fraîchement déplacé');
  // ⚠ LE NEUVIÈME PREND LE SOUTIEN LE MOINS CHER — 1 500 000 points : un montage
  // qui ne paie déjà pas le Bélier ne le paie pas non plus, donc le péage mord.
  assert.ok(codes(problemesDeLAchatDUnSoutien(fauche, 'soutienAntiInfanterie')).includes('pointsInsuffisants'),
    'péage 9 (soutien d\'artillerie) : le montage n\'est pas fauché');

  // ⚠ ET MAINTENANT LE MÊME MONTAGE, ALLUMÉ. Les neuf tombent.
  const dev = partieFauchee(true);
  const cibleDev = campProche(dev);
  const base = baseCourante(dev);

  assert.ok(!codes(problemesDeLAmelioration(dev, 0)).some((c) => c.startsWith('manque:')),
    'péage 1 : le bâtiment se paie encore');
  assert.ok(!codes(problemesDeLAmeliorationDEffectif(dev, 'armee', 0)).some((c) => c.startsWith('manque:')),
    'péage 2 : la pièce se paie encore');
  assert.deepEqual(codes(problemesDeLAchat(dev, 'offense', 'belier', 'unite')), [],
    'péage 3 : la recherche se paie encore');
  assert.deepEqual(codes(problemesDeLAchatDUneBase(dev)), [],
    'péage 4 : le droit de base se paie encore');
  assert.ok(!codes(problemesDuRaid(dev, base, cibleDev)).includes('points-insuffisants'),
    'péage 5 : le raid se paie encore');
  assert.deepEqual(problemesDeLaReparationDUnePiece(dev, 0), [],
    'péage 6 : la réparation se paie encore');
  assert.equal(apercuDuTransfert(dev, 0, 1, 1_000_000).recuMilli, 1_000_000,
    'péage 7 : le transfert est encore taxé');
  assert.equal(ticksAvantProchainDeplacement(dev), 0, 'péage 8 : le délai court encore');
  assert.deepEqual(codes(problemesDeLAchatDUnSoutien(dev, 'soutienAntiInfanterie')), [],
    'péage 9 : le soutien d\'artillerie se paie encore');

  // ⚠⚠ LE VRAI VERROU DU LOT : LES GESTES PASSENT, ET RIEN NE S'ÉCRIT. Un mode
  // qui CRÉDITERAIT des ressources passerait tous les `assert` ci-dessus et
  // serait irréversible — c'est exactement la variante qu'Ethan a refusée le
  // 19/09, et c'est ce bloc-ci qui la ferait tomber.
  const ressourcesAvant = { ...base.economie.ressources };
  const reserveAvant = { ...base.reserveReparation };
  const pointsAvant = dev.recherche.pointsMilli;
  const attaqueAvant = dev.attaque.points;

  // ⚠ L'ORDRE N'EST PAS LIBRE : la réparation vient AVANT la montée de la
  // pièce. « Une pièce abîmée ne monte pas » est un verrou de règle, et la
  // franchise ne le lève pas — inverser ces deux lignes fait lever le test, ce
  // qui est exactement ce qu'on veut qu'il fasse.
  ameliorer(dev, 0);
  const paye = reparerUnePiece(dev, 0);
  ameliorerEffectif(dev, 'armee', 0);
  acheter(dev, 'offense', 'belier', 'unite');
  acheterUneBaseDePlus(dev);
  acheterUnSoutien(dev, 'soutienAntiInfanterie');

  assert.deepEqual(base.economie.ressources, ressourcesAvant,
    'un stock a bougé : la franchise crédite au lieu de lever le péage');
  assert.deepEqual(base.reserveReparation, reserveAvant,
    'une réserve de temps a bougé');
  assert.equal(base.reserveReparationBatiments, 0, 'la réserve des bâtiments a bougé');
  assert.equal(dev.recherche.pointsMilli, pointsAvant, 'les points de recherche ont bougé');
  // ⚠⚠ ET L'OUVERTURE, ELLE, A BIEN EU LIEU. La franchise saute le DÉBIT, jamais
  // l'effet du geste : un mode qui ne donnerait rien ferait passer l'assertion
  // ci-dessus sur un achat qui n'a pas eu lieu, et le péage 9 serait vert pour
  // la mauvaise raison.
  assert.equal(soutienEstAcquis(dev, 'soutienAntiInfanterie'), true,
    'péage 9 : l\'achat gratuit n\'a rien ouvert');
  assert.equal(dev.attaque.points, attaqueAvant, 'les points d\'attaque ont bougé');
  assert.deepEqual({ ticks: paye.ticks, scorie: paye.scorie }, { ticks: 0, scorie: 0 },
    'la réparation annonce une facture qu\'elle n\'a pas prélevée');

  // ⚠⚠ LE RAID SE MESURE À PART, ET C'EST LE BUTIN QUI L'IMPOSE. Un raid gagné
  // CRÉDITE des ressources — `verserLeButin` — et l'y mêler ferait tomber le
  // `deepEqual` ci-dessus sur un gain parfaitement légitime : mesuré, +13 000
  // milli de scorie sur ce montage. Ce qu'on garde ici, c'est que les POINTS
  // D'ATTAQUE n'ont pas bougé et que le journal facture zéro.
  const pointsDAttaqueAvantRaid = dev.attaque.points;
  executerRaid(dev, base, cibleDev);
  assert.equal(dev.attaque.points, pointsDAttaqueAvantRaid,
    'le raid a prélevé des points d\'attaque');
  assert.equal(dev.rapports.at(-1).cout, 0, 'le journal facture un raid gratuit');
  // ⚠⚠ ET LE PRIX QUE LES DEUX ÉCRANS LISENT EST LE MÊME ZÉRO. `coutDUnRaid` est
  // la seule autorité du prix — `ui/monde.js` et `ui/raid.js` l'appellent une
  // fois chacun, et deux tests gardent ce compte. Sans cette assertion, une
  // franchise posée dans `executerRaid` seule passerait, et la carte annoncerait
  // « ce raid coûte 11 points » au-dessus d'un raid gratuit. C'est le défaut que
  // la relecture adverse du 19/09 a trouvé.
  assert.equal(coutDUnRaid(dev, base, cibleDev), 0,
    'la carte annonce encore un prix pour un raid gratuit');
  assert.ok(coutDUnRaid(fauche, baseCourante(fauche), cible) > 0,
    'le barème rend zéro même mode éteint : le test ne mesure rien');

  // Et les gestes ont bien EU LIEU — sans quoi tout ce qui précède se vérifie
  // sur une partie où rien n'a été tenté.
  assert.equal(base.disposition[0].niveau, 13, 'le bâtiment n\'est pas monté');
  assert.equal(base.armee[0].degatsMilli, 0, 'la pièce n\'est pas réparée');
  assert.equal(base.armee[0].niveau, 2, 'la pièce n\'est pas montée');
  assert.ok(dev.recherche.acquises.offense.includes('belier'), 'la recherche n\'est pas rangée');

  // ⚠⚠ ET CE QUI N'EST PAS UN PRIX NE SE LÈVE PAS — arbitrage « non » d'Ethan
  // sur les verrous non monétaires. Un `dejaAcquise` qui passerait rangerait
  // deux fois la même pièce dans `acquises`, et la sauvegarde garderait la
  // faute. C'est la contre-assertion du lot : elle mord si quelqu'un
  // « complète » la franchise en la posant en tête de fonction.
  assert.ok(codes(problemesDeLAchat(dev, 'offense', 'belier', 'unite')).includes('dejaAcquise'),
    'la franchise laisse racheter une pièce déjà acquise');
  assert.ok(codes(problemesDuDeplacement(dev, baseCourante(dev).position)).includes('sur-place'),
    'la franchise a emporté la géométrie du déplacement');
  // ⚠ ET LE VERROU « ABÎMÉE » TIENT, MESURÉ SUR UNE PIÈCE QU'ON RABÎME.
  base.armee[1].degatsMilli = 1000;
  assert.ok(codes(problemesDeLAmeliorationDEffectif(dev, 'armee', 1)).includes('abimee'),
    'la franchise laisse monter une pièce abîmée');
  base.armee[1].degatsMilli = 0;

  // ⚠ ET L'EXTINCTION EST PROPRE PARCE QU'IL N'Y A RIEN À DÉFAIRE : le même
  // état, drapeau éteint, refacture tout de suite. C'est la réponse à « vérifier
  // que le désactiver remet bien tout proprement ».
  dev.modeDeveloppeur = false;
  assert.ok(codes(problemesDeLAmelioration(dev, 0)).some((c) => c.startsWith('manque:')),
    'l\'extinction ne referme pas le péage des bâtiments');
  assert.ok(codes(problemesDuDeplacement(dev, caseVoisine(dev))).includes('delai'),
    'l\'extinction ne referme pas le délai');
  assert.equal(apercuDuTransfert(dev, 0, 1, 1_000_000).recuMilli < 1_000_000, true,
    'l\'extinction ne referme pas la taxe de transfert');

  // Le drapeau voyage, et une sauvegarde d'avant le lot arrive éteinte.
  const allume = partieFauchee(true);
  const relu = charger(serialiser(allume, INSTANT), INSTANT);
  assert.equal(relu.modeDeveloppeur, true, 'le drapeau ne survit pas au tour de sauvegarde');
  // ⚠⚠ LA VERSION DE DÉPART EST 37, PAS `SAVE_VERSION - 1` — corrigé au lot
  // VERROUS, 20/09/2026. Le raccourci disait « la version d'avant », et il était
  // juste tant que MODE-DEV était le dernier lot à migrer ; `SAVE_VERSION` est
  // passé à 39, donc il désignait 38 et le maillon mesuré ici — 37 → 38 — n'était
  // plus traversé du tout. Le test tombait en annonçant que la migration
  // n'éteint pas le mode, alors qu'elle n'était jamais appelée.
  //
  // ⚠ UN TEST ÉPINGLE LE MAILLON QU'IL MESURE, jamais « le dernier ». Écrit
  // ainsi, il traverse aussi tous les maillons postérieurs, ce qui est une
  // garde de plus : une migration future qui casserait le drapeau le dirait.
  const VERSION_AVANT_MODE_DEV = 37;
  const ancienne = JSON.parse(serialiser(creerEtat(9), INSTANT));
  delete ancienne.modeDeveloppeur;
  ancienne.version = VERSION_AVANT_MODE_DEV;
  assert.ok(VERSION_AVANT_MODE_DEV < SAVE_VERSION,
    'le montage ne mesure rien : la version de départ n\'est pas antérieure');
  assert.equal(migrer(ancienne).modeDeveloppeur, false,
    'la migration v37 → v38 n\'éteint pas le mode');
});

// ---------------------------------------------------------------------------
// MODE-DEV T2 — le texte portable, à l'octet
// ---------------------------------------------------------------------------

test('MODE-DEV T2 — le texte portable revient à l\'octet, et refuse ce qui n\'en est pas', async () => {
  const etat = partieFauchee(false);
  const json = serialiser(etat, INSTANT);
  const empreinte = createHash('sha256').update(json).digest('hex');

  const texte = await versLeTextePortable(json);

  // ⚠ LE MONTAGE SE MESURE AVANT D'ÊTRE CRU : un codec qui rendrait la chaîne
  // vide passerait un aller-retour sur du vide.
  assert.ok(texte.length > 200, `texte portable de ${texte.length} caractères : trop court pour mesurer`);
  assert.match(texte, /^[0-9a-f]+$/, 'le texte portable n\'est pas purement hexadécimal');
  assert.equal(texte.length % 2, 0, 'le texte portable a une longueur impaire');

  // ⚠⚠ ET IL EST PLUS COURT QUE L'HEXADÉCIMAL DU JSON BRUT, ce qui est TOUTE la
  // raison d'être de la compression : `hex(JSON)` pèse exactement le double du
  // JSON. Sans cette assertion, un codec qui sauterait gzip passerait
  // l'aller-retour sans que rien ne le dise.
  assert.ok(texte.length < json.length * 2,
    `${texte.length} caractères pour un JSON de ${json.length} : la compression ne sert à rien`);

  const retour = await depuisLeTextePortable(texte);
  assert.equal(createHash('sha256').update(retour).digest('hex'), empreinte,
    'l\'aller-retour ne rend pas le JSON à l\'octet');
  // Et il est jouable, pas seulement identique.
  assert.equal(charger(retour, INSTANT).rapports.length, etat.rapports.length);

  // ⚠ LES BLANCS ET LA CASSE SONT TOLÉRÉS : un texte qui passe par une
  // messagerie revient coupé en lignes, et un presse-papier peut remonter des
  // majuscules. Ni l'un ni l'autre n'est une faute du joueur.
  const malmene = `\n  ${texte.toUpperCase().replace(/(.{40})/g, '$1\n')}  \n`;
  assert.equal(createHash('sha256').update(await depuisLeTextePortable(malmene)).digest('hex'),
    empreinte, 'un texte recoupé en lignes est refusé');

  // ⚠⚠ ET LES CINQ REFUS SONT NOMMÉS, EN FRANÇAIS. Un codec qui laisserait
  // remonter « InvalidStateError » jusqu'à l'écran ne dirait rien à personne.
  const refus = [
    ['   ', /vide/],
    [`zz${texte.slice(2)}`, /hexad/],
    [texte.slice(0, -1), /impair/],
    [`0000${texte.slice(4)}`, /Foyer Z/],
    [texte.slice(0, texte.length - 200), /abîmée|incomplète/],
  ];
  for (const [entree, attendu] of refus) {
    await assert.rejects(
      () => depuisLeTextePortable(entree),
      (erreur) => attendu.test(erreur.message),
      `« ${String(entree).slice(0, 12)}… » n'est pas refusé comme attendu`,
    );
  }
});
