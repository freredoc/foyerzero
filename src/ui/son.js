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

import { SONS, BUS } from '../data/sons.js';
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
  const tampons = new Map();
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
        // Les cinq bus, aux niveaux de `data/sons.js`. Trois n'ont aucun son
        // dans ce lot ; les poser quand même évite que le lot du catalogue les
        // improvise, chacun à sa mesure.
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
      decoder();
    }
    // Un contexte peut retomber en `suspended` — l'onglet passe à l'arrière,
    // le système reprend la sortie audio. On le relance à chaque geste, et
    // l'échec ne remonte pas.
    if (contexte.state === 'suspended') contexte.resume().catch(() => {});
  }

  /**
   * Décode les quatre `data:` de la page, une fois. Chaque son qui échoue reste
   * simplement absent de la table : les autres continuent de sonner.
   */
  function decoder() {
    for (const nomDuSon of Object.keys(SONS)) {
      const balise = doc.getElementById(idDuSon(nomDuSon));
      const octets = balise === null ? null : octetsDuDataUri(balise.getAttribute('src'));
      if (octets === null) continue;
      try {
        contexte.decodeAudioData(octets).then(
          (tampon) => { tampons.set(nomDuSon, tampon); },
          () => {},
        );
      } catch { /* un navigateur ancien lève au lieu de rejeter */ }
    }
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
    const tampon = tampons.get(decision.son);
    // Le décodage est asynchrone : les premiers gestes d'une page fraîche
    // peuvent tomber avant lui. La politique a déjà compté l'instance — c'est
    // sans conséquence, elle expirera d'elle-même à la durée du son.
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
