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
// ⚠ IL LIT LE RVBA, ET LE RVB DEPUIS LE LOT ANCRES-ZÉNITH (19/09) — les
// sources d'`art/sources/` sont en RVB sans alpha, et `ancres-zenith.test.js`
// confronte une table à ces DESSINS-là, pas aux sprites cousus. Un pixel RVB
// est rendu avec un alpha de 255, si bien qu'aucun lecteur n'a changé.
// `terrain.test.js` porte un décodeur d'INDEXÉ pour l'atlas de la carte du
// monde ; les formats ne se recouvrent pas, d'où deux lecteurs et non un
// lecteur à tout faire qui devinerait.
//
// Aucune dépendance ajoutée : `node:zlib` est dans la bibliothèque standard, et
// `esbuild` reste la seule dépendance de développement du dépôt.

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';

/**
 * Les pixels d'un PNG 8 bits RVBA ou RVB non entrelacé — le premier est le
 * seul format que `tools/atlas.py` produise, et celui de tous les sprites
 * conditionnés ; le second est celui des sources. Le résultat est TOUJOURS du
 * RVBA, quatre octets par pixel, alpha 255 quand le fichier n'en porte pas.
 *
 * Il LÈVE sur tout ce qu'il ne sait pas faire plutôt que de rendre une image
 * approchée : un atlas mal décodé ferait tomber la garde suivante sur un défaut
 * qui n'existe pas. Même discipline que le décodeur de `terrain.test.js`, qui
 * lit les PNG INDEXÉS de la carte du monde — les deux formats ne se recouvrent
 * pas, d'où deux lecteurs et non un lecteur à tout faire.
 */
export function decoderRgba(chemin) {
  const octets = readFileSync(chemin);
  assert.equal(octets.readUInt32BE(0), 0x89504e47, `${chemin} n'est pas un PNG`);
  let position = 8;
  let largeur = 0;
  let hauteur = 0;
  let typeCouleur = 0;
  const morceaux = [];
  while (position < octets.length) {
    const taille = octets.readUInt32BE(position);
    const nom = octets.toString('ascii', position + 4, position + 8);
    const corps = octets.subarray(position + 8, position + 8 + taille);
    if (nom === 'IHDR') {
      largeur = corps.readUInt32BE(0);
      hauteur = corps.readUInt32BE(4);
      assert.equal(corps[8], 8, `${chemin} : profondeur de bits inattendue`);
      typeCouleur = corps[9];
      assert.ok(typeCouleur === 6 || typeCouleur === 2,
        `${chemin} : type de couleur ${typeCouleur}, ni RVBA (6) ni RVB (2)`);
      assert.equal(corps[12], 0, `${chemin} : entrelacement non géré`);
    } else if (nom === 'IDAT') morceaux.push(Buffer.from(corps));
    else if (nom === 'IEND') break;
    position += 12 + taille;
  }
  const brut = inflateSync(Buffer.concat(morceaux));
  // Le défiltrage se fait dans le format DU FICHIER — `a`, `b`, `c` sont à un
  // pixel de distance, donc à `bpp` octets —, la conversion en RVBA vient après.
  const bpp = typeCouleur === 6 ? 4 : 3;
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
  if (bpp === 4) return { largeur, hauteur, pixels };
  const rgba = Buffer.alloc(largeur * hauteur * 4, 255);
  for (let i = 0, j = 0; i < pixels.length; i += 3, j += 4) {
    rgba[j] = pixels[i];
    rgba[j + 1] = pixels[i + 1];
    rgba[j + 2] = pixels[i + 2];
  }
  return { largeur, hauteur, pixels: rgba };
}
