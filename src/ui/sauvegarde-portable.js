// La sauvegarde portable — gzip, puis hexadécimal, et l'inverse.
//
// ⚠⚠ ELLE EXISTE PARCE QU'UNE SAUVEGARDE EST MORTE — Ethan, 19/09/2026. Le
// magasin de l'appareil est le SEUL exemplaire d'une partie ; le jeu est hors
// ligne, il n'y a ni compte ni nuage, et `CLE_SECOURS` ne sauve que d'une
// sauvegarde ILLISIBLE, pas d'une sauvegarde perdue. Ce module donne au joueur
// un exemplaire qu'il emporte.
//
// ⚠⚠ L'HEXADÉCIMAL SEUL FERAIT L'INVERSE DE CE QU'ON LUI DEMANDE, ET C'EST
// MESURÉ. `hex(JSON)` pèse DEUX FOIS le JSON : relevé sur une partie à trois
// rapports, 12 910 caractères de JSON deviennent 25 820. Ce qui raccourcit,
// c'est la COMPRESSION — les mêmes 12 910 tombent à 2 058 octets en gzip, donc
// 4 116 caractères une fois remis en hexadécimal, soit 32 % du JSON brut.
// L'ordre est donc gzip PUIS hex, jamais l'un sans l'autre.
//
// ⚠ ET L'HEXADÉCIMAL EST CHOISI CONTRE LE BASE64 EN LE SACHANT. Il coûte 33 %
// de plus — 4 116 contre 2 744 sur la même partie — et il les vaut : il est
// insensible à la casse et ne porte ni `+`, ni `/`, ni `=`, c'est-à-dire aucun
// des caractères qu'un champ de saisie, un clavier de téléphone ou une
// application de messagerie abîment en chemin. Ce texte-là est fait pour être
// copié-collé à la main.
//
// ⚠⚠ AUCUNE ADRESSE, AUCUN RÉSEAU, AUCUN FICHIER. `tools/build.js` refuse tout
// `https?://` dans le HTML produit et CLAUDE.md §6 interdit d'en assembler une
// à l'exécution ; ce module ne connaît que deux chaînes de caractères. Il
// n'ouvre pas non plus de sélecteur de fichiers : le texte passe par le
// presse-papier, qui marche dans la WebView comme dans un navigateur.

/** L'en-tête, DANS les octets — deux octets, avant la charge compressée. */
const MARQUE = [0xf0, 0x01];

/**
 * Le texte portable d'une sauvegarde JSON.
 *
 * ⚠⚠ LA MARQUE EST DANS LES OCTETS, PAS DEVANT LE TEXTE, et c'est ce qui garde
 * la sortie PUREMENT hexadécimale — « un truc facile à copier-coller et en
 * hexadécimal ». Un préfixe lisible du genre `FZ1:` aurait fait la même chose
 * en cassant la promesse : le joueur aurait vu deux caractères qui ne sont pas
 * des chiffres et se serait demandé s'il avait bien tout copié.
 *
 * ⚠ ELLE SERT À REFUSER TÔT ET À REFUSER BIEN. Sans elle, un texte collé de
 * travers ne se distingue d'une sauvegarde abîmée qu'au moment où gzip lève,
 * avec un message que personne ne peut lire. Deux octets valent une phrase.
 *
 * @param {string} json la sortie de `serialiser`
 * @returns {Promise<string>} hexadécimal minuscule, longueur paire
 */
export async function versLeTextePortable(json) {
  const brut = new TextEncoder().encode(json);
  const compresse = await parLeFlux(brut, new CompressionStream('gzip'));
  const octets = new Uint8Array(MARQUE.length + compresse.length);
  octets.set(MARQUE, 0);
  octets.set(compresse, MARQUE.length);
  return enHexadecimal(octets);
}

/**
 * Le JSON d'une sauvegarde, depuis son texte portable.
 *
 * ⚠⚠ ELLE LÈVE DES PHRASES FRANÇAISES, ET C'EST TOUT SON INTÉRÊT. L'écran
 * n'affiche pas « InvalidStateError » à quelqu'un qui vient de coller un texte
 * tronqué : il affiche ce que ce module a écrit. Les quatre refus sont nommés
 * ici, une fois, comme les `problemesDe…` du moteur.
 *
 * ⚠ LES BLANCS SONT RETIRÉS, LE RESTE NON. Un texte qui voyage par messagerie
 * revient coupé en lignes ; les espaces et retours à la ligne ne portent aucune
 * information, on les enlève. Tout AUTRE caractère fait refuser — nettoyer plus
 * loin reviendrait à deviner ce que le joueur a collé, et à « réparer » un
 * texte tronqué en une sauvegarde plausible et fausse.
 *
 * ⚠ ET LA CASSE EST TOLÉRÉE À L'ENTRÉE. On écrit en minuscules ; un
 * presse-papier qui remonte des majuscules n'est pas une erreur du joueur.
 *
 * @param {string} texte
 * @returns {Promise<string>} le JSON
 */
export async function depuisLeTextePortable(texte) {
  const propre = String(texte ?? '').replace(/\s+/g, '').toLowerCase();
  if (propre.length === 0) {
    throw new Error('Le texte collé est vide.');
  }
  if (!/^[0-9a-f]+$/.test(propre)) {
    throw new Error('Ce texte n\'est pas de l\'hexadécimal : il porte autre chose que des '
      + 'chiffres de 0 à 9 et des lettres de a à f.');
  }
  if (propre.length % 2 !== 0) {
    throw new Error('Ce texte est incomplet : il compte un nombre impair de caractères.');
  }
  const octets = depuisHexadecimal(propre);
  if (octets.length <= MARQUE.length
    || octets[0] !== MARQUE[0] || octets[1] !== MARQUE[1]) {
    throw new Error('Ce n\'est pas une sauvegarde de Foyer Zéro.');
  }
  let brut;
  try {
    brut = await parLeFlux(octets.subarray(MARQUE.length), new DecompressionStream('gzip'));
  } catch {
    // ⚠ GZIP PORTE SON PROPRE CRC32 : s'il lève, le texte est tronqué ou altéré,
    // et il n'y a pas de second contrôle à écrire au-dessus.
    throw new Error('Cette sauvegarde est abîmée ou incomplète : recopiez le texte en entier.');
  }
  return new TextDecoder().decode(brut);
}

/**
 * Pousse des octets dans un flux de (dé)compression et ramasse le résultat.
 *
 * ⚠ UNE SEULE ÉCRITURE PUIS `close`, et la lecture se fait jusqu'au bout. Un
 * `close` oublié laisse le dernier bloc dans le flux, et le manque ne se voit
 * que sur les grandes sauvegardes — c'est-à-dire précisément celles qu'on
 * exporte.
 *
 * @param {Uint8Array} octets
 * @param {{readable: ReadableStream, writable: WritableStream}} flux
 * @returns {Promise<Uint8Array>}
 */
async function parLeFlux(octets, flux) {
  const ecrivain = flux.writable.getWriter();
  // ⚠⚠ LA PROMESSE D'ÉCRITURE EST NEUTRALISÉE TOUT DE SUITE, ET CE N'EST PAS UN
  // `catch` DÉCORATIF. Sur un texte tronqué, le flux casse des DEUX côtés : la
  // lecture lève — c'est cette levée-là qu'on veut, elle porte la cause — et
  // l'écriture rejette de son côté, sans personne pour l'attendre. Le rejet
  // part alors en `unhandledRejection`, hors de tout `try`, et tue le processus
  // APRÈS que l'écran a affiché son refus. Mesuré : `Z_BUF_ERROR`, pile
  // illisible, cinq lignes après un message parfaitement correct.
  const ecriture = ecrivain.write(octets)
    .then(() => ecrivain.close())
    .catch(() => {});
  const morceaux = [];
  const lecteur = flux.readable.getReader();
  for (;;) {
    // eslint-disable-next-line no-await-in-loop
    const { value, done } = await lecteur.read();
    if (done) break;
    morceaux.push(value);
  }
  await ecriture;
  let total = 0;
  for (const m of morceaux) total += m.length;
  const sortie = new Uint8Array(total);
  let offset = 0;
  for (const m of morceaux) { sortie.set(m, offset); offset += m.length; }
  return sortie;
}

/** Des octets vers une chaîne hexadécimale minuscule, deux caractères par octet. */
function enHexadecimal(octets) {
  let texte = '';
  for (const o of octets) texte += o.toString(16).padStart(2, '0');
  return texte;
}

/** L'inverse — la chaîne est déjà validée par l'appelant. */
function depuisHexadecimal(texte) {
  const octets = new Uint8Array(texte.length / 2);
  for (let i = 0; i < octets.length; i += 1) {
    octets[i] = Number.parseInt(texte.slice(i * 2, i * 2 + 2), 16);
  }
  return octets;
}
