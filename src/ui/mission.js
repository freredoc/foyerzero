// L'écran Mission et la mini-fenêtre du tutoriel — deux vues, une seule lecture.
//
// ⚠ AUCUNE DES DEUX NE DÉCIDE RIEN. Ce qui est fait ou non se décide dans
// `sim/missions.js`, qui LIT la base ; ces vues n'ajoutent qu'une coche, une
// mise en avant et un compte. Réimplémenter ici un « le joueur a bien posé sa
// Raffinerie » ferait une seconde lecture des règles, et elle finirait par dire
// autre chose que la première — c'est la faute que le dépôt évite déjà pour la
// pose et pour le voisinage.
//
// ⚠ ET C'EST POURQUOI LES DEUX VUES VIVENT DANS LE MÊME FICHIER. La
// mini-fenêtre est posée sur l'écran de la base, l'onglet Mission est un écran
// à lui ; les écrire séparément aurait donné deux formatages du même compteur,
// et le premier ajustement les aurait fait diverger sous les yeux du joueur.
//
// ⚠ L'ONGLET SE PEINT À L'OUVERTURE, LA MINI-FENÊTRE À CHAQUE TICK. La
// différence est voulue : l'onglet, on l'ouvre exprès, et rien ne bouge pendant
// qu'on le regarde. La mini-fenêtre, elle, est sous les yeux du joueur PENDANT
// qu'il pose et qu'il améliore — un compteur qui n'avancerait qu'à la
// navigation suivante ne servirait à rien.
// ⚠ MAIS ELLE NE SE RECONSTRUIT QUE QUAND SON CONTENU CHANGE. `rafraichir`
// passe dix fois par seconde ; refaire les nœuds à chaque passage les ferait
// clignoter sous le doigt, exactement comme la palette que le lot
// GARNISON-ET-ARMÉE a dû cesser de reconstruire. La signature ci-dessous est ce
// qui décide, et elle porte tout ce qui s'affiche — rien de plus, rien de moins.

import { etatDesMissions, missionCourante, avancement } from '../sim/missions.js';
import { tutorielEstFerme } from '../sim/state.js';

/** La coche d'une mission faite, la puce d'une mission à faire. */
export const MARQUE_FAITE = '✔';
export const MARQUE_A_FAIRE = '·';
/** ⚠ NI COCHE NI PUCE POUR CE QU'ON NE SAIT PAS OBSERVER : un sablier le dit. */
export const MARQUE_A_VENIR = '⋯';

/**
 * Les lignes à dessiner : les missions, plus la mise en avant de la première
 * qui reste à faire.
 *
 * ⚠ UNE SEULE LIGNE PORTE `courante`, ET AUCUNE QUAND C'EST FINI. Marquer
 * plusieurs lignes « à faire suivante » ne voudrait rien dire, et en marquer
 * une alors que tout est fait renverrait le joueur vers une tâche accomplie.
 *
 * ⚠ ET C'EST `missionCourante` QUI TRANCHE, PAS UN SECOND CALCUL ICI. La
 * première écriture refaisait le choix sur place — `findIndex((m) => !m.faite)`
 * — ce qui marchait, et c'était quand même une SECONDE lecture de la même
 * règle : la falsification l'a montrée en remplaçant ce choix par « la suivante
 * de la dernière faite » dans ce fichier-ci, sans qu'aucun test ne tombe. Le
 * moteur décide, l'écran désigne la ligne qui porte cet identifiant.
 */
export function lignesDeMission(etat) {
  const missions = etatDesMissions(etat);
  const courante = missionCourante(etat);
  return missions.map((m) => ({ ...m, courante: courante !== null && m.id === courante.id }));
}

/**
 * Ce que la ligne d'en-tête annonce.
 *
 * ⚠ ELLE DIT « TERMINÉ », PAS « 13 / 13 ». Un compte plein se lit comme un
 * compteur qui pourrait encore monter ; le tutoriel, lui, s'arrête.
 *
 * ⚠ ET LE DÉNOMINATEUR EST CELUI DES MISSIONS VÉRIFIABLES. Quatre lignes de la
 * chaîne d'Ethan attendent un moteur qui n'existe pas (le raid, le
 * redéploiement, la seconde base) ; les compter donnerait un compteur qui
 * n'atteint jamais son plafond, ce qui est la définition d'un tutoriel
 * infinissable.
 */
export function libelleAvancement(etat) {
  const { faites, total } = avancement(etat);
  return faites === total ? 'Tutoriel terminé' : `Mission ${faites} / ${total}`;
}

/** « 2 / 3 », tel que les deux vues l'écrivent. */
export function compteDObjectif(objectif) {
  return `${objectif.fait} / ${objectif.total}`;
}

/**
 * Ce que la mini-fenêtre montre — ou `null` quand elle n'a rien à dire.
 *
 * ⚠ TROIS RAISONS DE NE RIEN MONTRER, ET UNE SEULE FONCTION LES PORTE : le
 * joueur a fermé la fenêtre, le tutoriel est fini, ou il ne reste que des
 * missions sans moteur. Les disperser dans le câblage aurait mis une condition
 * dans l'écran et une autre dans la session.
 */
export function vueDuTutoriel(etat) {
  if (tutorielEstFerme(etat)) return null;
  const courante = missionCourante(etat);
  if (courante === null) return null;
  return {
    avancement: libelleAvancement(etat),
    titre: courante.titre,
    explication: courante.explication,
    objectifs: courante.objectifs.map((o) => ({
      libelle: o.libelle,
      compte: compteDObjectif(o),
      atteint: o.fait >= o.total,
    })),
  };
}

/**
 * La signature de ce qui est affiché. Deux vues égales par signature donnent le
 * même dessin, donc il n'y a rien à refaire.
 *
 * ⚠ ELLE PORTE LES LIBELLÉS, PAS SEULEMENT LES NOMBRES. Un objectif dont le
 * dénominateur bouge — « chaque bâtiment au niveau 3 » compte les bâtiments
 * POSÉS — change de texte sans changer de mission ; une signature réduite à
 * l'identifiant l'aurait figée à l'écran.
 */
export function signatureDuTutoriel(vue) {
  if (vue === null) return '';
  return [vue.avancement, ...vue.objectifs.map((o) => `${o.libelle}=${o.compte}`)].join('|');
}

/**
 * Câble la mini-fenêtre posée en bas de l'écran de la base.
 *
 * @param {Document} doc
 * @param {{auxMissions: () => void, surFermeture: () => void}} rappels
 * @returns {{rafraichir: (etat: object) => void}}
 */
export function initialiserMiniTutoriel(doc, { surFermeture } = {}) {
  const $ = (id) => doc.getElementById(id);
  const boite = $('chantier-tuto');
  const enTete = $('tuto-avancement');
  const liste = $('tuto-objectifs');
  const explication = $('tuto-explication');

  // ⚠ FERMÉE EXPLICITEMENT AU CÂBLAGE. Le `hidden` du balisage suffit
  // aujourd'hui, mais il serait la SEULE chose à la tenir fermée au démarrage :
  // un attribut oublié à la prochaine reprise du HTML l'ouvrirait par-dessus la
  // grille avant même qu'un état existe. Même raisonnement que le panneau de
  // détail.
  boite.hidden = true;

  // ⚠ LA CROIX NE FAIT QUE PRÉVENIR. Écrire dans l'état est le travail de
  // `sim/state.js`, et la sauvegarde celui de la session : la fenêtre dit
  // « fermée », on lui répond en la repeignant.
  $('tuto-fermer').addEventListener('click', () => {
    if (surFermeture !== undefined) surFermeture();
  });

  let signaturePeinte = null;

  function rafraichir(etat) {
    const vue = vueDuTutoriel(etat);
    const signature = signatureDuTutoriel(vue);
    if (signature === signaturePeinte) return;
    signaturePeinte = signature;

    boite.hidden = vue === null;
    if (vue === null) return;

    enTete.textContent = vue.avancement;
    explication.textContent = vue.explication;
    liste.textContent = '';
    for (const o of vue.objectifs) {
      const item = doc.createElement('li');
      item.classList.toggle('atteint', o.atteint);
      const quoi = doc.createElement('span');
      quoi.className = 'quoi';
      quoi.textContent = o.libelle;
      const compte = doc.createElement('span');
      compte.className = 'compte';
      compte.textContent = o.compte;
      item.append(quoi, compte);
      liste.appendChild(item);
    }
  }

  return { rafraichir };
}

/**
 * Câble l'écran Mission dans une page qui porte le balisage attendu.
 *
 * @param {Document} doc
 * @param {{surReouverture: () => void}} rappels
 * @returns {{peindre: (etat: object) => void}}
 */
export function initialiserEcranMission(doc, { surReouverture } = {}) {
  const $ = (id) => doc.getElementById(id);
  const avancementLigne = $('mission-avancement');
  const liste = $('mission-liste');
  const rouvrir = $('mission-rouvrir');

  rouvrir.addEventListener('click', () => {
    if (surReouverture !== undefined) surReouverture();
  });

  function peindre(etat) {
    avancementLigne.textContent = libelleAvancement(etat);
    // ⚠ LE BOUTON NE PARAÎT QUE S'IL A QUELQUE CHOSE À FAIRE. Il rouvre la
    // mini-fenêtre ; s'il n'y a plus de mission à y montrer, il ne rouvrirait
    // rien, et un bouton qui ne fait rien apprend une fausse règle.
    rouvrir.hidden = !tutorielEstFerme(etat) || missionCourante(etat) === null;
    liste.textContent = '';
    for (const m of lignesDeMission(etat)) {
      const item = doc.createElement('li');
      item.className = 'mission';
      item.classList.toggle('faite', m.faite);
      item.classList.toggle('courante', m.courante);
      item.classList.toggle('a-venir', !m.verifiable);

      const marque = doc.createElement('span');
      marque.className = 'marque';
      if (!m.verifiable) marque.textContent = MARQUE_A_VENIR;
      else marque.textContent = m.faite ? MARQUE_FAITE : MARQUE_A_FAIRE;

      const corps = doc.createElement('div');

      // ⚠ LE TITRE NE SE RÉPÈTE PAS AU-DESSUS DE SES PROPRES OBJECTIFS. Il est
      // COMPOSÉ de leurs libellés : l'écrire puis les lister donnait
      // « Collecteur sur quartz / Collecteur sur quartz 0 / 1 », vu à l'essai
      // dans un navigateur et pas à la relecture. Les lignes d'objectif SONT le
      // titre, avec leur compteur.
      //
      // ⚠⚠ SAUF POUR LES QUATRE QUI PORTENT LE LEUR, DE LA MAIN D'ETHAN — et la
      // condition a changé au lot BASES-1. L'écran les reconnaissait à `!
      // verifiable`, ce qui était vrai par COÏNCIDENCE : c'étaient les quatre
      // sans moteur. Elles en ont un, donc la question posée est celle qui
      // compte — « ce titre est-il écrit, ou dérivé ? ». Sans ce changement,
      // « Attaquer et détruire un camp » aurait disparu de l'écran au profit de
      // « Camp détruit 0 / 1 ».
      if (m.titreEcrit) {
        const titre = doc.createElement('b');
        titre.textContent = m.titre;
        corps.appendChild(titre);
      }
      {
        for (const o of m.objectifs) {
          const ligne = doc.createElement('div');
          ligne.className = 'objectif';
          const quoi = doc.createElement('b');
          quoi.className = 'quoi';
          quoi.textContent = o.libelle;
          const compte = doc.createElement('span');
          compte.className = 'compte';
          compte.textContent = compteDObjectif(o);
          ligne.append(quoi, compte);
          corps.appendChild(ligne);
        }
      }

      const explication = doc.createElement('span');
      explication.textContent = m.explication;
      corps.appendChild(explication);

      // ⚠ LES PRÉREQUIS SONT DÉRIVÉS DES TABLES, pas écrits à la main. Ils
      // disent au joueur pourquoi sa palette reste grise — le niveau
      // d'apparition d'une pièce et le bâtiment qui la produit — sans quoi il
      // chercherait la faute chez lui.
      if (m.prerequis.length > 0) {
        const note = doc.createElement('div');
        note.className = 'prerequis';
        note.textContent = m.prerequis.join(' · ');
        corps.appendChild(note);
      }

      item.append(marque, corps);
      liste.appendChild(item);
    }
  }

  return { peindre };
}
