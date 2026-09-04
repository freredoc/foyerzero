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

import { SONS, BUS, MEMOIRE, RAMPE_BOUCLE_MS } from '../data/sons.js';
import { creerVoix, demanderUnSon, reconcilierLesBoucles, boucleDeLEvenement } from '../son/politique.js';

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
  // Les BOUCLES en cours : nom d'événement → la source qui la joue.
  // ⚠ Une entrée est posée AVANT que le décodage rende, et c'est ce qui évite le
  // double démarrage : la réconciliation suivante voit la boucle « en cours » et
  // ne la redemande pas, alors qu'aucun son ne sort encore.
  const boucles = new Map();
  // ⚠⚠ LES TAMPONS QU'UNE SOURCE LIT ENCORE — la moitié qui garde la
  // comptabilité honnête. Voir `evincer`.
  const tenus = new Map();
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
   * ⚠⚠ UN TAMPON QU'UNE SOURCE LIT NE S'ÉVINCE PAS, ET C'EST LE POINT DUR DU
   * LOT SON-CÂBLAGE. `AudioBufferSourceNode` garde sa propre référence : oublier
   * la nôtre ne coupe pas le son et ne libère pas un octet — mais
   * `secondesDecodees` retomberait, alors que la mémoire, elle, n'a pas bougé.
   * **La comptabilité cesserait de décrire la mémoire réelle**, et elle est la
   * seule chose qui tient les 64,7 Mo du pack à distance. Sans boucle le défaut
   * restait borné à la durée d'un coup ; une ambiance de huit secondes rejouée
   * sans fin le rendrait permanent.
   *
   * ⚠⚠ DES DEUX ISSUES, ON RETIENT LA PROTECTION, ET LE MOTIF EST DANS LES
   * INTERDITS. L'autre — « ne décompter que ce qui est réellement libéré » —
   * demande de savoir QUAND le navigateur relâche un `AudioBuffer`, c'est-à-dire
   * d'observer son ramasse-miettes : un mécanisme qu'on ne peut pas ouvrir, et
   * « ne pas justifier une propriété par un mécanisme qu'on n'a pas ouvert ».
   * `tenus` compte les sources en lecture, `source.onended` les relâche, et
   * `secondesDecodees` reste un MAJORANT exact de ce qui est décodé et référencé.
   *
   * ⚠ ET LA PROTECTION VAUT AUSSI POUR LES COUPS, PAS SEULEMENT POUR LES
   * BOUCLES. Le même raisonnement les couvre, et un invariant qui vaudrait pour
   * 35 sons sur 263 serait le premier à être oublié.
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
        if (tenus.has(nom)) continue;
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
   * Le compte des sources qui lisent encore un tampon.
   *
   * ⚠⚠ C'EST LUI QUI REND `secondesDecodees` HONNÊTE. Un tampon tenu ne peut pas
   * être évincé — voir `evincer` —, donc la table des secondes ne décompte
   * jamais une mémoire qui n'a pas été rendue.
   */
  function tenir(nomDuSon) {
    tenus.set(nomDuSon, (tenus.get(nomDuSon) ?? 0) + 1);
  }

  function relacher(nomDuSon) {
    const reste = (tenus.get(nomDuSon) ?? 0) - 1;
    if (reste <= 0) tenus.delete(nomDuSon);
    else tenus.set(nomDuSon, reste);
    // Ce qui vient d'être rendu redevient évinçable : on repasse le budget.
    evincer();
  }

  /**
   * Décode un son s'il ne l'est pas déjà, et rend son tampon.
   *
   * ⚠⚠ À LA PREMIÈRE UTILISATION, JAMAIS AU DÉMARRAGE. Décoder les 263 à
   * l'ouverture ajouterait 64,7 Mo et le temps qui va avec, là où le démarrage
   * n'en prend aucun aujourd'hui. Rien ici n'est appelé par `reveiller` : les
   * seuls appelants sont `jouer` et `demarrerUneBoucle`.
   *
   * ⚠ ET UN ÉCHEC SE TAIT. Le son reste absent de la table, les autres
   * continuent de sonner — la dégradation silencieuse du lot précédent, tenue
   * pour chacun des 263.
   *
   * @returns {Promise<AudioBuffer|null>} le tampon, ou null si rien n'a pu être
   *   décodé. La promesse d'un décodage EN VOL est partagée, jamais relancée.
   */
  function assurerLeTampon(nomDuSon) {
    const dejaLa = tampons.get(nomDuSon);
    if (dejaLa !== undefined) return Promise.resolve(dejaLa);
    const enCours = enVol.get(nomDuSon);
    if (enCours !== undefined) return enCours;
    const balise = doc.getElementById(idDuSon(nomDuSon));
    const octets = balise === null ? null : octetsDuDataUri(balise.getAttribute('src'));
    if (octets === null) return Promise.resolve(null);
    let promesse;
    try {
      promesse = contexte.decodeAudioData(octets);
    } catch {
      // Un navigateur ancien lève au lieu de rejeter.
      return Promise.resolve(null);
    }
    const partagee = promesse.then(
      (tampon) => {
        enVol.delete(nomDuSon);
        tampons.set(nomDuSon, tampon);
        usages.set(nomDuSon, rang);
        if (SONS[nomDuSon].residente !== true) {
          secondesDecodees += SONS[nomDuSon].dureeMs / 1000;
          evincer();
        }
        return tampon;
      },
      () => { enVol.delete(nomDuSon); return null; },
    );
    enVol.set(nomDuSon, partagee);
    return partagee;
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
    assurerLeTampon(decision.son);
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
      tenir(decision.son);
      source.onended = () => relacher(decision.son);
      try {
        source.start();
      } catch (erreur) {
        // ⚠ UNE SOURCE QUI NE DÉMARRE PAS NE RENDRA JAMAIS SON TAMPON. Sans
        // cette ligne, `onended` ne partirait jamais et le tampon resterait
        // protégé pour toujours : le budget se réduirait d'autant, une fois
        // pour toutes, sans que rien ne le dise.
        relacher(decision.son);
        throw erreur;
      }
    } catch { /* la sortie audio a disparu sous nous : on se tait */ }
  }

  /**
   * Démarre une boucle : décode si besoin, puis monte le gain sur la rampe.
   *
   * ⚠⚠ L'ENTRÉE EST POSÉE AVANT LE DÉCODAGE, ET C'EST CE QUI EMPÊCHE LE DOUBLE
   * DÉMARRAGE. `decodeAudioData` est asynchrone : entre la demande et le tampon
   * il passe plusieurs images, donc plusieurs réconciliations. Sans une entrée
   * posée tout de suite, chacune verrait la boucle absente et en lancerait une
   * de plus — un roulement joué cinq fois par-dessus lui-même.
   *
   * ⚠ ET SI L'ARRÊT ARRIVE PENDANT LE DÉCODAGE, ON NE DÉMARRE PAS. L'entrée a
   * déjà été retirée de `boucles` ; on le constate au retour et on s'en va.
   */
  function demarrerUneBoucle(evenement) {
    const { son, gain } = boucleDeLEvenement(evenement, reglages);
    const entree = { son, source: null, noeud: null, gainPose: gain };
    boucles.set(evenement, entree);
    rang += 1;
    usages.set(son, rang);
    assurerLeTampon(son).then((tampon) => {
      if (tampon === null || boucles.get(evenement) !== entree) return;
      try {
        const source = contexte.createBufferSource();
        source.buffer = tampon;
        // ⚠ LES BORNES DU FICHIER, À L'ÉCHANTILLON PRÈS. `loop` sans
        // `loopStart`/`loopEnd` rejoue le tampon entier, ce que le README du
        // pack demande — « leurs bornes exactes sont fournies en échantillons ».
        source.loop = true;
        const noeud = contexte.createGain();
        const debut = contexte.currentTime;
        noeud.gain.setValueAtTime(0, debut);
        noeud.gain.linearRampToValueAtTime(gain, debut + RAMPE_BOUCLE_MS / 1000);
        source.connect(noeud);
        noeud.connect(bus[SONS[son].bus]);
        tenir(son);
        source.onended = () => relacher(son);
        try {
          source.start();
        } catch (erreur) {
          // Même raison que dans `jouer` : un tampon tenu par une source qui
          // n'a jamais démarré ne serait jamais relâché.
          relacher(son);
          throw erreur;
        }
        entree.source = source;
        entree.noeud = noeud;
      } catch {
        boucles.delete(evenement);
      }
    });
  }

  /**
   * Arrête une boucle : descend le gain, PUIS libère la source.
   *
   * ⚠⚠ L'ARRÊT ATTEND LA FIN DE SA RAMPE. Couper au milieu produit exactement le
   * claquement que la rampe existe pour éviter : `stop()` immédiat laisse la
   * forme d'onde à sa valeur courante et la met à zéro en un échantillon.
   * `stop(fin)` est donné à l'horloge du contexte audio, qui est la seule qui
   * sache quand la rampe est finie — un `setTimeout` dériverait de l'audio.
   *
   * ⚠ ET LE TAMPON N'EST RELÂCHÉ QU'À `onended`, donc après l'arrêt réel. Le
   * relâcher ici le rendrait évinçable pendant qu'il joue encore, c'est-à-dire
   * la faute même que `evincer` refuse.
   */
  function arreterUneBoucle(evenement) {
    const entree = boucles.get(evenement);
    boucles.delete(evenement);
    if (entree === undefined || entree.source === null) return;
    try {
      // ⚠ ON LIT LA VALEUR AVANT D'ANNULER, ET L'ORDRE N'EST PAS LIBRE : on
      // repart d'où la rampe de démarrage en était, sinon un arrêt qui tombe
      // pendant la montée ferait sauter le gain à sa valeur pleine avant de
      // redescendre — un claquement, exactement ce qu'on évite.
      const courant = entree.noeud.gain.value;
      const fin = contexte.currentTime + RAMPE_BOUCLE_MS / 1000;
      entree.noeud.gain.cancelScheduledValues(contexte.currentTime);
      entree.noeud.gain.setValueAtTime(courant, contexte.currentTime);
      entree.noeud.gain.linearRampToValueAtTime(0, fin);
      entree.source.stop(fin);
    } catch { /* la source était déjà partie : rien à couper */ }
  }

  /**
   * Suit le curseur de volume sur les boucles DÉJÀ en cours.
   *
   * ⚠⚠ SANS ÇA, LE CURSEUR NE TOUCHERAIT PAS CE QUI TOURNE. Une boucle prend son
   * gain au démarrage et le garde ; le joueur qui bouge le curseur verrait les
   * clics suivre et l'ambiance rester où elle était, jusqu'à ce qu'il change
   * d'écran. Le défaut ne se voit pas à la relecture — il faut avoir le curseur
   * sous le doigt.
   *
   * ⚠ ET LE GAIN VIENT DE LA POLITIQUE, PAS D'UN CALCUL D'ICI. C'est la même
   * fonction qui l'a donné au démarrage ; en écrire un second ferait deux
   * conversions décibels → linéaire, dont une seule serait éprouvée.
   *
   * ⚠ ON RAMPE PLUTÔT QUE D'ÉCRIRE `value`, et on ne touche à rien quand rien
   * n'a changé : un `gain.value = x` posé pendant la rampe de démarrage la
   * couperait net, et cette fonction passe dix fois par seconde.
   */
  function suivreLeVolume() {
    for (const [evenement, entree] of boucles) {
      if (entree.noeud === null) continue;
      const { gain } = boucleDeLEvenement(evenement, reglages);
      if (gain === entree.gainPose) continue;
      entree.gainPose = gain;
      try {
        const debut = contexte.currentTime;
        entree.noeud.gain.cancelScheduledValues(debut);
        entree.noeud.gain.setValueAtTime(entree.noeud.gain.value, debut);
        entree.noeud.gain.linearRampToValueAtTime(gain, debut + RAMPE_BOUCLE_MS / 1000);
      } catch { /* la sortie audio a disparu sous nous */ }
    }
  }

  /**
   * Met les boucles en cours d'accord avec ce que l'état demande.
   *
   * ⚠⚠ LA DIFFÉRENCE SE CALCULE DANS LA POLITIQUE, PAS ICI. Ce fichier exécute
   * deux listes ; il ne décide ni ce qui doit sonner, ni ce que le muet fait aux
   * boucles en cours. C'est ce qui rend la mécanique éprouvable dans Node, où il
   * n'y a pas de Web Audio.
   *
   * ⚠⚠ ET ELLE NE RÉVEILLE PAS LE CONTEXTE. La session l'appelle dix fois par
   * seconde, y compris avant le premier geste du joueur ; créer un
   * `AudioContext` hors d'un geste le laisserait suspendu sur le dos de
   * l'onglet. Tant qu'il n'y a pas de contexte, rien ne sonne et rien ne se
   * perd : la réconciliation suivante démarrera tout ce qui manque.
   *
   * @param {string[]} desire les événements de boucle que l'état demande
   */
  function reconcilier(desire) {
    if (horsService || contexte === null) return;
    const { demarrer, arreter } = reconcilierLesBoucles(desire, boucles.keys(), reglages);
    for (const nom of arreter) arreterUneBoucle(nom);
    for (const nom of demarrer) demarrerUneBoucle(nom);
    suivreLeVolume();
  }

  return {
    reveiller,
    jouer,
    reconcilier,
    /**
     * La mesure de la mémoire décodée — pour les tests, et pour eux seuls.
     *
     * ⚠⚠ SANS ELLE, L'INVARIANT DU LOT EST INVÉRIFIABLE, ET LA FALSIFICATION L'A
     * DIT. Retirer la protection de l'éviction ne change RIEN d'observable de
     * l'extérieur : la boucle continue de jouer — sa source tient le tampon —,
     * elle n'est pas redemandée, donc elle n'est pas redécodée. Le seul dégât
     * est que `secondesDecodees` cesse de décrire la mémoire réelle, et un test
     * qui ne mesure que les décodages est VERT sur le code fautif. Mesuré :
     * 23 pass / 0 fail avec la ligne de protection retirée.
     *
     * ⚠ ELLE NE DÉCIDE DE RIEN ET N'EXPOSE AUCUN RÉGLAGE : trois nombres et deux
     * listes de noms, en lecture. Même motif que `mesureImages` de
     * `src/ui/raid.js`, qui existe pour la mesure M2 et pour rien d'autre.
     */
    mesureMemoire() {
      return {
        secondesDecodees,
        decodes: [...tampons.keys()].sort(),
        tenus: [...tenus.keys()].sort(),
      };
    },
  };
}
