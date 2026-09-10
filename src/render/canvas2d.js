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
 *
 * ⚠ `atlas` EST OPTIONNEL, ET UNE PRIMITIVE `sprite` SANS LUI **LÈVE**. Une
 * liste qui n'en contient aucune s'exécute sans atlas, comme avant. Mais une
 * famille manquante ne se saute PAS en silence : une unité invisible est un
 * défaut qu'on doit voir à la première image, pas un trou que personne ne
 * remarque. C'est la même règle que `fondDuSprite`, qui lève sur un nom absent.
 *
 * ⚠ ET CE MODULE NE DÉCIDE TOUJOURS RIEN. La branche `sprite` appelle
 * `drawImage` avec les huit nombres que la primitive porte, et tourne le
 * contexte de l'angle qu'elle porte aussi — ni choix de nom, ni calcul de
 * position, ni lissage. `imageSmoothingEnabled` est une décision, elle se pose
 * chez celui qui crée le contexte.
 *
 * @param {object} ctx   Contexte 2D (ou enregistreur compatible).
 * @param {Array<object>} liste Primitives produites par scene.js.
 * @param {Record<string, CanvasImageSource>} [atlas] Une image par famille.
 */
export function executer(ctx, liste, atlas = null) {
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
      case 'texte':
        // `y` est le CENTRE vertical du texte : c'est le contrat de la
        // primitive, posé par scene.js, pas une décision prise ici.
        ctx.fillStyle = p.couleur;
        ctx.font = `${p.taille}px system-ui, sans-serif`;
        ctx.textBaseline = 'middle';
        ctx.fillText(p.texte, p.x, p.y);
        break;
      case 'sprite': {
        const image = atlas === null ? undefined : atlas[p.famille];
        if (image === undefined) {
          throw new Error(
            `canvas2d : la famille d'atlas « ${p.famille} » manque pour « ${p.nom} »`,
          );
        }
        // ⚠⚠ LA ROTATION SE FAIT AUTOUR DU CENTRE DU SPRITE, ET C'EST POUR ÇA
        // QUE LES ONZE TOURELLES DU JOUEUR SONT CARRÉES ET CENTRÉES SUR LEUR
        // PIVOT, avec la marge qui les empêche d'être rognées à 45°. Ne jamais
        // recadrer ces sprites — ni au conditionnement, ni ici : un recadrage à
        // la boîte englobante déplace le pivot et la tourelle se met à osciller.
        //
        // ⚠ ET CE N'EST PAS UNE DÉCISION PRISE ICI : l'angle est un champ de la
        // primitive, comme les six nombres de `drawImage`. Ce module ne fait que
        // le poser sur le contexte. Un angle nul ne touche pas au contexte du
        // tout — sinon toute la scène paierait un `save`/`restore` par primitive
        // pour une transformation identité.
        //
        // ⚠⚠ L'OPACITÉ SE POSE ET SE REMET À UN, ET C'EST LA MOITIÉ QUI COMPTE —
        // lot SON-ET-ARRIVÉE, 10/09. `globalAlpha` est un ÉTAT du contexte, pas
        // un argument de `drawImage` : oublier de le remettre repeindrait tout ce
        // que la liste dessine ENSUITE en translucide — la moitié de la scène,
        // barres et traits de tir compris. Et **aucun test sans navigateur ne le
        // verrait** : la liste d'affichage serait juste, seule l'image serait
        // fausse. `SB T6` lit donc les écritures de `globalAlpha` sur un
        // enregistreur et exige que la dernière vaille 1.
        //
        // ⚠ UNE OPACITÉ PLEINE NE TOUCHE PAS AU CONTEXTE DU TOUT, exactement
        // comme un angle nul : sinon la scène entière paierait deux écritures par
        // primitive pour une valeur qu'elle a déjà.
        //
        // ⚠ ET LE MILLIÈME SE DIVISE ICI, comme le degré se convertit en radians
        // trois lignes plus bas. La primitive porte des ENTIERS — c'est le
        // contrat de `sprite()` dans `scene.js` — et ce module les traduit dans
        // l'unité du contexte, sans rien décider.
        const translucide = p.alpha !== undefined && p.alpha < 1000;
        if (translucide) ctx.globalAlpha = p.alpha / 1000;
        if (p.angle) {
          const cx = p.x + p.l / 2;
          const cy = p.y + p.h / 2;
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate((p.angle * Math.PI) / 180);
          ctx.drawImage(image, p.sx, p.sy, p.sl, p.sh, -p.l / 2, -p.h / 2, p.l, p.h);
          ctx.restore();
        } else {
          ctx.drawImage(image, p.sx, p.sy, p.sl, p.sh, p.x, p.y, p.l, p.h);
        }
        // ⚠ APRÈS le `restore` de la branche tournante, et non avant : `save`
        // capture `globalAlpha` avec le reste, donc `restore` le REMET à la
        // valeur translucide qu'on venait de poser. C'est ici, et ici seulement,
        // que le contexte redevient opaque.
        if (translucide) ctx.globalAlpha = 1;
        break;
      }
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
