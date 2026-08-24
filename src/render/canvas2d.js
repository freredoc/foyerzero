// Exécution d'une liste d'affichage sur un contexte 2D — lot 3A.
//
// Module MINCE, volontairement bête : il parcourt la liste et appelle
// fillRect, strokeRect, arc et consorts. AUCUNE décision de dessin ne se
// prend ici — ni couleur, ni cote, ni ordre : tout vient de scene.js. C'est
// ce que prouve le test au contexte enregistreur (T7) : le même nombre
// d'appels, dans le même ordre, que de primitives.
//
// Le contexte reçu est n'importe quel objet qui porte les méthodes du
// CanvasRenderingContext2D utilisées ici — un vrai canvas dans la page, un
// enregistreur dans les tests. C'est ce qui permet de tester sans DOM.

/**
 * Exécute une liste d'affichage.
 * @param {object} ctx   Contexte 2D (ou enregistreur compatible).
 * @param {Array<object>} liste Primitives produites par scene.js.
 */
export function executer(ctx, liste) {
  for (const p of liste) {
    switch (p.forme) {
      case 'rect':
        ctx.fillStyle = p.couleur;
        ctx.fillRect(p.x, p.y, p.l, p.h);
        break;
      case 'cadre':
        ctx.strokeStyle = p.couleur;
        ctx.lineWidth = p.epaisseur;
        ctx.strokeRect(p.x, p.y, p.l, p.h);
        break;
      case 'disque':
        ctx.fillStyle = p.couleur;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.rayon, 0, 2 * Math.PI);
        ctx.fill();
        break;
      case 'ligne':
        ctx.strokeStyle = p.couleur;
        ctx.lineWidth = p.epaisseur;
        ctx.beginPath();
        ctx.moveTo(p.x1, p.y1);
        ctx.lineTo(p.x2, p.y2);
        ctx.stroke();
        break;
      default:
        throw new Error(`canvas2d : forme inconnue « ${p.forme} »`);
    }
  }
}
