// L'écran Mission — le tutoriel, et rien d'autre.
//
// ⚠ IL NE DÉCIDE RIEN. Ce qui est fait ou non se décide dans `sim/missions.js`,
// qui LIT la base ; cet écran n'ajoute qu'une coche, une mise en avant et un
// compte. Réimplémenter ici un « le joueur a bien posé sa Raffinerie » ferait
// une seconde lecture des règles, et elle finirait par dire autre chose que la
// première — c'est la faute que le dépôt évite déjà pour la pose et pour le
// voisinage.
//
// ⚠ IL SE PEINT À L'OUVERTURE, ET SEULEMENT LÀ. Rien ne peut changer pendant
// qu'on le regarde : aucune mission ne dépend d'une grandeur qui court toute
// seule — elles portent toutes sur ce que le joueur a POSÉ ou AMÉLIORÉ, et ces
// gestes-là se font sur l'écran de la base, donc ailleurs. Le brancher sur le
// rafraîchissement à 10 Hz de la session réécrirait cinq lignes de texte dix
// fois par seconde pour rien.
// ⚠ CE N'EST VRAI QUE TANT QU'AUCUNE MISSION NE LIT L'ÉCONOMIE. Une mission
// « accumule 100 quartz » avancerait sans geste du joueur, et resterait figée
// sous les yeux de celui qui la regarde. Un test le garde de face plutôt que
// de compter sur ce commentaire.

import { etatDesMissions, missionCourante } from '../sim/missions.js';

/** La coche d'une mission faite, et la puce d'une mission à faire. */
export const MARQUE_FAITE = '✔';
export const MARQUE_A_FAIRE = '·';

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
 *
 * @param {object} etat
 * @returns {Array<{id: string, titre: string, explication: string, faite: boolean, courante: boolean}>}
 */
export function lignesDeMission(etat) {
  const missions = etatDesMissions(etat);
  const courante = missionCourante(etat);
  return missions.map((m) => ({ ...m, courante: courante !== null && m.id === courante.id }));
}

/**
 * Ce que la ligne d'en-tête annonce.
 *
 * ⚠ ELLE DIT « TERMINÉ », PAS « 5 / 5 ». Un compte plein se lit comme un
 * compteur qui pourrait encore monter ; le tutoriel, lui, s'arrête.
 */
export function libelleAvancement(etat) {
  const lignes = lignesDeMission(etat);
  const faites = lignes.filter((m) => m.faite).length;
  return faites === lignes.length
    ? 'Tutoriel terminé'
    : `Mission ${faites} / ${lignes.length}`;
}

/**
 * Câble l'écran Mission dans une page qui porte le balisage attendu.
 *
 * @param {Document} doc
 * @returns {{peindre: (etat: object) => void}}
 */
export function initialiserEcranMission(doc) {
  const $ = (id) => doc.getElementById(id);
  const avancement = $('mission-avancement');
  const liste = $('mission-liste');

  function peindre(etat) {
    avancement.textContent = libelleAvancement(etat);
    liste.textContent = '';
    for (const m of lignesDeMission(etat)) {
      const item = doc.createElement('li');
      item.className = 'mission';
      item.classList.toggle('faite', m.faite);
      item.classList.toggle('courante', m.courante);

      const marque = doc.createElement('span');
      marque.className = 'marque';
      marque.textContent = m.faite ? MARQUE_FAITE : MARQUE_A_FAIRE;

      const corps = doc.createElement('div');
      const titre = doc.createElement('b');
      titre.textContent = m.titre;
      const explication = doc.createElement('span');
      explication.textContent = m.explication;
      corps.append(titre, explication);

      item.append(marque, corps);
      liste.appendChild(item);
    }
  }

  return { peindre };
}
