// Décodeur PNG 8 bits RVBA non entrelacé — partagé par les tests.
//
// ⚠ CE N'EST PAS UN FICHIER DE TEST : il ne déclare aucun `test(`, il est
// importé. Même statut que `prereglages-lot3a.js`, et `documentation.test.js`
// ne compte que les `*.test.js`.
//
// ⚠⚠ IL A ÉTÉ EXTRAIT DE `sprite.test.js` AU LOT ACCENT-CONFRONTÉ, parce qu'un
// SECOND test en avait besoin. Le dupliquer aurait donné deux décodeurs voisins,
// tous deux « PNG, à peu près », dont un seul serait éprouvé — c'est exactement
// ce que `hachageBrut` de `sim/peuplement.js` existe pour éviter côté moteur.
//
// ⚠⚠ IL LIT DEUX TYPES DE COULEUR DEPUIS LE LOT COULEUR — LE RVBA ET L'INDEXÉ —
// ET IL REND DU RVBA DANS LES DEUX CAS. Ce n'est pas un lecteur à tout faire qui
// devinerait : ce sont les DEUX SEULS formats que `tools/atlas.py` produise, et
// il bascule de l'un à l'autre selon le compte de teintes. Le commentaire
// précédent disait « il ne lit que le RVBA, les deux formats ne se recouvrent
// pas » : depuis que les atlas sont palettisés, ils se recouvrent, et laisser ce
// lecteur LEVER dessus aurait fait tomber la garde qui compare l'atlas cousu à
// ses sprites — pour un défaut qui n'existe pas.
//
// ⚠ `terrain.test.js` GARDE SON LECTEUR, ET CE N'EST PAS UNE DUPLICATION. Il ne
// rend pas des pixels mais des INDICES de palette, plus la palette elle-même :
// c'est ce qu'il mesure — que les cinq teintes de l'atlas du monde sont
// exactement la rampe du joueur, dans l'ordre. Un lecteur qui rendrait du RVBA
// ne pourrait pas répondre à cette question-là.
//
// Aucune dépendance ajoutée : `node:zlib` est dans la bibliothèque standard, et
// `esbuild` reste la seule dépendance de développement du dépôt.

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';

/**
 * Les pixels, en RVBA, d'un PNG 8 bits non entrelacé — RVBA (type 6) ou INDEXÉ
 * (type 3). Ce sont les deux seuls formats que `tools/atlas.py` produise, et
 * les sprites conditionnés sont tous du premier.
 *
 * Il LÈVE sur tout ce qu'il ne sait pas faire plutôt que de rendre une image
 * approchée : un atlas mal décodé ferait tomber la garde suivante sur un défaut
 * qui n'existe pas.
 *
 * ⚠ UN INDEXÉ SE REND EN RVBA, PAS EN INDICES. L'appelant compare des PIXELS —
 * une cellule d'atlas à son sprite source, un accent à sa teinte de fiche — et
 * les indices de deux fichiers différents ne sont pas comparables entre eux.
 * C'est aussi ce qui fait que la palettisation des atlas n'a demandé AUCUNE
 * retouche aux gardes qui les lisent.
 */
export function decoderRgba(chemin) {
  const octets = readFileSync(chemin);
  assert.equal(octets.readUInt32BE(0), 0x89504e47, `${chemin} n'est pas un PNG`);
  let position = 8;
  let largeur = 0;
  let hauteur = 0;
  let type = 6;
  let palette = null;
  let transparence = null;
  const morceaux = [];
  while (position < octets.length) {
    const taille = octets.readUInt32BE(position);
    const nom = octets.toString('ascii', position + 4, position + 8);
    const corps = octets.subarray(position + 8, position + 8 + taille);
    if (nom === 'IHDR') {
      largeur = corps.readUInt32BE(0);
      hauteur = corps.readUInt32BE(4);
      type = corps[9];
      assert.equal(corps[8], 8, `${chemin} : profondeur de bits inattendue`);
      assert.ok(type === 6 || type === 3, `${chemin} : type de couleur ${type} non géré`);
      assert.equal(corps[12], 0, `${chemin} : entrelacement non géré`);
    } else if (nom === 'PLTE') palette = Buffer.from(corps);
    else if (nom === 'tRNS') transparence = Buffer.from(corps);
    else if (nom === 'IDAT') morceaux.push(Buffer.from(corps));
    else if (nom === 'IEND') break;
    position += 12 + taille;
  }
  const brut = inflateSync(Buffer.concat(morceaux));
  const bpp = type === 6 ? 4 : 1;
  const pas = largeur * bpp;
  const pixels = Buffer.alloc(hauteur * pas);
  for (let y = 0; y < hauteur; y++) {
    const filtre = brut[y * (pas + 1)];
    const ligne = brut.subarray(y * (pas + 1) + 1, y * (pas + 1) + 1 + pas);
    for (let x = 0; x < pas; x++) {
      const a = x >= bpp ? pixels[y * pas + x - bpp] : 0;
      const b = y > 0 ? pixels[(y - 1) * pas + x] : 0;
      const c = x >= bpp && y > 0 ? pixels[(y - 1) * pas + x - bpp] : 0;
      let v = ligne[x];
      if (filtre === 1) v += a;
      else if (filtre === 2) v += b;
      else if (filtre === 3) v += (a + b) >> 1;
      else if (filtre === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      } else assert.equal(filtre, 0, `${chemin} : filtre ${filtre} inconnu`);
      pixels[y * pas + x] = v & 0xff;
    }
  }
  if (type === 6) return { largeur, hauteur, pixels };

  // ⚠ L'INDEXÉ SE DÉPLIE EN RVBA. `tRNS` donne l'alpha des PREMIÈRES entrées de
  // la palette, dans l'ordre ; celles qu'il ne couvre pas sont opaques. C'est
  // l'écriture de `tools/atlas.py`, qui réserve l'index 0 au transparent.
  assert.ok(palette !== null, `${chemin} : indexé sans PLTE`);
  const rvba = Buffer.alloc(hauteur * largeur * 4);
  for (let i = 0; i < largeur * hauteur; i++) {
    const indice = pixels[i];
    assert.ok(indice * 3 + 2 < palette.length, `${chemin} : index ${indice} hors palette`);
    rvba[i * 4] = palette[indice * 3];
    rvba[i * 4 + 1] = palette[indice * 3 + 1];
    rvba[i * 4 + 2] = palette[indice * 3 + 2];
    rvba[i * 4 + 3] = transparence !== null && indice < transparence.length
      ? transparence[indice] : 255;
  }
  return { largeur, hauteur, pixels: rvba };
}
