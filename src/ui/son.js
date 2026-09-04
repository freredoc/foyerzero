// L'ADAPTATEUR audio : il crée le contexte, décode, connecte les bus, joue.
//
// ⚠⚠ IL NE DÉCIDE DE RIEN, ET C'EST LA MOITIÉ QUI COMPTE. Faut-il jouer, quelle
// variante, à quel gain : tout cela vit dans `src/son/politique.js`, qui est pur
// et éprouvable dans Node. Ce fichier-ci ne fait que ce qu'aucun test du dépôt
// ne peut faire — parler au navigateur. Une condition d'autorisation qui
// apparaîtrait ici serait au mauvais endroit, et une garde de
// `test/son.test.js` la refuse en nommant les champs de la politique.
//
// ⚠ LES SEULS `if` D'ICI SONT DES CONSTATS DE CAPACITÉ, PAS DES PERMISSIONS :
// « le navigateur n'a pas de Web Audio », « le décodage n'a pas encore rendu ».
// Ils disent qu'on ne PEUT pas, jamais qu'on n'a pas le DROIT.
//
// ⚠⚠ ET IL SE TAIT PLUTÔT QUE DE LEVER. Pas d'`AudioContext`, décodage en
// échec, marqueur non substitué : le jeu démarre, joue et reste silencieux.
// C'est l'INVERSE de la règle des atlas — « une unité invisible est un défaut
// qu'on doit voir » —, et l'asymétrie est voulue : une carte noire rend le jeu
// injouable, un jeu muet reste entièrement jouable.

import { SONS, BUS, MEMOIRE } from '../data/sons.js';
import { creerVoix, demanderUnSon } from '../son/politique.js';

/**
 * L'identifiant DOM qui porte le `data:` d'un son.
 *
 * ⚠ IL SE DÉRIVE DU NOM, IL NE SE RECOPIE PAS. Une seconde table d'identifiants
 * serait la première à oublier un son — même raisonnement que `nomCssDuFond`
 * pour les décors.
 *
 * @param {string} nomDuSon
 * @returns {string}
 */
export function idDuSon(nomDuSon) {
  return `son-${nomDuSon.replaceAll('_', '-')}`;
}

/**
 * Les octets d'une adresse `data:`, sans passer par le réseau.
 *
 * ⚠⚠ PAS DE `fetch`, MÊME SUR UN `data:`. Il marcherait ; mais le dépôt refuse
 * qu'une adresse s'assemble à l'exécution (CLAUDE.md §6, la garde offline de
 * `tools/build.js`), et faire passer un livrable hors ligne par l'API du réseau
 * demanderait à chaque relecteur de vérifier que ce n'en est pas une. `atob`
 * décode ce que le build a écrit, et il n'y a rien à vérifier.
 *
 * @param {string} adresse
 * @returns {ArrayBuffer|null} null si ce n'est pas un `data:` en base64
 */
export function octetsDuDataUri(adresse) {
  const marque = ';base64,';
  const coupe = (adresse ?? '').indexOf(marque);
  if (!(adresse ?? '').startsWith('data:') || coupe < 0) return null;
  const binaire = atob(adresse.slice(coupe + marque.length));
  const octets = new Uint8Array(binaire.length);
  for (let i = 0; i < binaire.length; i += 1) octets[i] = binaire.charCodeAt(i);
  return octets.buffer;
}

/**
 * Le moteur audio de la page.
 *
 * @param {Document} doc
 * @param {{reglages: {muet: boolean, volume: number}, graine: number}} options
 *   `reglages` est l'objet VIVANT que la session tient et modifie ; on le
 *   transmet à la politique sans jamais en lire un champ.
 */
export function initialiserLeSon(doc, { reglages, graine }) {
  const fenetre = doc.defaultView;
  const voix = creerVoix(graine);

  let contexte = null;
  let maitre = null;
  const bus = {};
  // Les sons DÉCODÉS. ⚠⚠ C'est ici que se joue le point dur du lot : un son
  // décodé ne pèse plus rien de ce que pèse son fichier — le navigateur le
  // range en Float32 à 48 kHz —, donc les 263 feraient 64,7 Mo si tout y
  // entrait, contre 890 417 octets de fichiers.
  const tampons = new Map();
  // Les décodages EN VOL. ⚠⚠ Sans cette table, deux demandes rapprochées du
  // même son lanceraient deux décodages : `decodeAudioData` est asynchrone, et
  // le premier n'a pas encore rempli `tampons` quand le second regarde. C'est
  // le piège classique, et il coûte double travail ET double mémoire crête.
  const enVol = new Map();
  // Le rang de dernier usage, pour l'éviction. Un COMPTEUR, pas un temps : il
  // ne sert qu'à ordonner, et l'horloge murale est interdite ici (CLAUDE.md §11
  // — `maintenantMs` est seule lectrice dans tout `src/`).
  const usages = new Map();
  let rang = 0;
  // Les secondes décodées HORS résidentes, celles que le budget borne.
  let secondesDecodees = 0;
  let horsService = false;

  /**
   * ⚠⚠ LE CONTEXTE SE CRÉE AU PREMIER GESTE, ET PAS AVANT. Un `AudioContext`
   * construit au chargement naît SUSPENDU — le navigateur l'exige depuis que
   * les pages ont cessé d'avoir le droit de faire du bruit toutes seules —, et
   * il le reste jusqu'à un geste. Le créer tôt ne gagne rien et laisse un
   * contexte suspendu sur le dos de l'onglet ; le créer ici garantit qu'on est
   * DANS un geste, donc que `resume()` aboutit.
   */
  function reveiller() {
    if (horsService) return;
    if (contexte === null) {
      const Constructeur = fenetre.AudioContext ?? fenetre.webkitAudioContext;
      if (Constructeur === undefined) { horsService = true; return; }
      try {
        contexte = new Constructeur();
        maitre = contexte.createGain();
        maitre.gain.value = 1;
        maitre.connect(contexte.destination);
        // Les cinq bus, aux niveaux de `data/sons.js`. Quatre familles n'ont
        // pas de bus nommé par le brief et sont posées sur le plus proche par
        // nature, en attendant l'arbitrage d'Ethan — voir `data/sons.js`.
        for (const [nom, db] of Object.entries(BUS)) {
          const noeud = contexte.createGain();
          noeud.gain.value = 10 ** (db / 20);
          noeud.connect(maitre);
          bus[nom] = noeud;
        }
      } catch {
        horsService = true;
        return;
      }
      // ⚠⚠ ET RIEN N'EST DÉCODÉ ICI. Le lot précédent décodait ses quatre
      // témoins au premier geste ; à 263 ce serait 64,7 Mo et le temps qui va
      // avec, pour des sons dont aucun ne sonnera peut-être jamais. Le
      // décodage part de `jouer`, et de lui seul.
    }
    // Un contexte peut retomber en `suspended` — l'onglet passe à l'arrière,
    // le système reprend la sortie audio. On le relance à chaque geste, et
    // l'échec ne remonte pas.
    if (contexte.state === 'suspended') contexte.resume().catch(() => {});
  }

  /**
   * Relâche les sons non résidents les moins récemment employés.
   *
   * ⚠⚠ IL FAUT UN PLAFOND, ET IL SE COMPTE EN SECONDES DÉCODÉES, PAS EN
   * FICHIERS. Un son dure de 44 ms à 8 s : plafonner leur NOMBRE bornerait la
   * mémoire à un facteur cent quatre-vingts près, ce qui n'est pas une borne.
   * `MEMOIRE.budgetSecondesDecodees` se traduit directement en octets —
   * `secondes × 48 000 × 4` — donc le plafond se lit comme une quantité de
   * mémoire, qui est la grandeur qu'on défend.
   *
   * ⚠ ÉVINCER UN SON QUI JOUE EST SANS EFFET SUR LUI. `AudioBufferSourceNode`
   * garde sa propre référence sur le tampon ; oublier le nôtre ne coupe rien,
   * ça libère seulement le jour où plus personne ne le tient.
   *
   * ⚠ ET LE DERNIER TAMPON NE S'ÉVINCE JAMAIS LUI-MÊME. Un son plus long que
   * tout le budget viderait la table puis se relâcherait aussitôt, donc se
   * redécoderait à chaque demande : la boucle s'arrête quand il ne reste plus
   * qu'un candidat, ce qui garantit qu'un son décodé sert au moins une fois.
   */
  function evincer() {
    while (secondesDecodees > MEMOIRE.budgetSecondesDecodees) {
      let vieux = null;
      let candidats = 0;
      for (const nom of tampons.keys()) {
        if (SONS[nom].residente === true) continue;
        candidats += 1;
        if (vieux === null || (usages.get(nom) ?? 0) < (usages.get(vieux) ?? 0)) vieux = nom;
      }
      if (vieux === null || candidats <= 1) return;
      tampons.delete(vieux);
      usages.delete(vieux);
      secondesDecodees -= SONS[vieux].dureeMs / 1000;
    }
  }

  /**
   * Décode un son s'il ne l'est pas déjà et qu'aucun décodage n'est en vol.
   *
   * ⚠⚠ À LA PREMIÈRE UTILISATION, JAMAIS AU DÉMARRAGE. Décoder les 263 à
   * l'ouverture ajouterait 64,7 Mo et le temps qui va avec, là où le démarrage
   * n'en prend aucun aujourd'hui. Rien ici n'est appelé par `reveiller` : le
   * seul appelant est `jouer`.
   *
   * ⚠ ET UN ÉCHEC SE TAIT. Le son reste absent de la table, les autres
   * continuent de sonner — la dégradation silencieuse du lot précédent, tenue
   * pour chacun des 263.
   */
  function decoderSiBesoin(nomDuSon) {
    if (tampons.has(nomDuSon) || enVol.has(nomDuSon)) return;
    const balise = doc.getElementById(idDuSon(nomDuSon));
    const octets = balise === null ? null : octetsDuDataUri(balise.getAttribute('src'));
    if (octets === null) return;
    let promesse;
    try {
      promesse = contexte.decodeAudioData(octets);
    } catch {
      // Un navigateur ancien lève au lieu de rejeter.
      return;
    }
    enVol.set(nomDuSon, promesse);
    promesse.then(
      (tampon) => {
        enVol.delete(nomDuSon);
        tampons.set(nomDuSon, tampon);
        usages.set(nomDuSon, rang);
        if (SONS[nomDuSon].residente !== true) {
          secondesDecodees += SONS[nomDuSon].dureeMs / 1000;
          evincer();
        }
      },
      () => { enVol.delete(nomDuSon); },
    );
  }

  /**
   * Demande à la politique, puis joue ce qu'elle accorde.
   *
   * @param {string} evenement une clé d'`EVENEMENTS`
   */
  function jouer(evenement) {
    reveiller();
    if (horsService || contexte === null) return;
    const decision = demanderUnSon(voix, evenement, contexte.currentTime * 1000, reglages);
    if (!decision.jouer) return;
    rang += 1;
    usages.set(decision.son, rang);
    decoderSiBesoin(decision.son);
    const tampon = tampons.get(decision.son);
    // Le décodage est asynchrone : la PREMIÈRE demande d'un son tombe toujours
    // avant lui, et le son ne sort pas. La politique a déjà compté l'instance —
    // c'est sans conséquence, elle expirera d'elle-même à la durée du son.
    // ⚠ C'est le prix du décodage paresseux, et il est déclaré : le premier
    // geste qui demande un son donné est muet, les suivants sonnent.
    if (tampon === undefined) return;
    try {
      const source = contexte.createBufferSource();
      source.buffer = tampon;
      const gain = contexte.createGain();
      gain.gain.value = decision.gain;
      source.connect(gain);
      gain.connect(bus[SONS[decision.son].bus]);
      source.start();
    } catch { /* la sortie audio a disparu sous nous : on se tait */ }
  }

  return { reveiller, jouer };
}
