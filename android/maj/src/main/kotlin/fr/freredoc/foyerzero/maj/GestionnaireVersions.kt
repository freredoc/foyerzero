package fr.freredoc.foyerzero.maj

import java.io.File

/**
 * Gestion des versions du HTML sur le stockage interne : sélection de la
 * source à démarrer, installation des mises à jour, rollback vers la copie
 * embarquée dans l'APK.
 *
 * Aucune dépendance Android : le répertoire de travail et le fournisseur de
 * la copie embarquée sont injectés, ce qui rend toute la logique testable en
 * JVM pure (tests 8, 10, 11). Côté application, `copieEmbarquee` lit l'asset
 * de l'APK et `buildEmbarque` est le versionCode.
 *
 * Rollback : htmlAuDemarrage() est l'unique point d'entrée du lancement —
 * il décide le rollback, compte la tentative courante et sert le contenu,
 * dans cet ordre, pour qu'aucun appelant ne puisse se tromper de séquence.
 * signalerDemarrageReussi(), appelé une fois la page chargée, remet le
 * compteur à zéro ; un compteur qui atteint le seuil — autant de lancements
 * consécutifs jamais aboutis — déclenche le retour à la copie embarquée.
 */
class GestionnaireVersions(
    private val repertoire: File,
    private val copieEmbarquee: () -> ByteArray,
    private val buildEmbarque: Int,
    private val seuilEchecs: Int = 2,
) {

    val fichierInstalle = File(repertoire, "index.html")
    private val fichierBuild = File(repertoire, "build-installe")
    private val fichierEchecs = File(repertoire, "echecs-demarrage")

    // ⚠⚠ LE BUILD RÉELLEMENT SERVI À CE LANCEMENT — ET IL N'EXISTAIT PAS.
    // `buildInstalle()` lit le DISQUE ; or une vérification qui aboutit remplace
    // le fichier PENDANT que la page tourne, sans jamais remplacer la page (voir
    // `htmlAuDemarrage`). Les deux divergent donc dès qu'une mise à jour attend
    // une relance, et c'est exactement ce qu'Ethan a vu le 03/09 : l'écran
    // affichait « v0.67.0 b68 » sous « À jour — build 70 ». Le verdict était
    // calculé sur le disque, donc il annonçait à jour une version qui ne tournait
    // pas.
    //
    // ⚠ IL EST EN MÉMOIRE, PAS SUR LE DISQUE, et c'est délibéré : il décrit CE
    // LANCEMENT-CI. Le persister ferait un troisième nombre à tenir d'accord avec
    // les deux autres, et il mentirait au premier redémarrage manqué.
    //
    // ⚠ `@Volatile` PARCE QUE DEUX FILS LE TOUCHENT : `htmlAuDemarrage` tourne
    // sur le fil de l'interface, la vérification sur le sien.
    @Volatile
    private var buildServi: Int? = null

    // -- lancement -----------------------------------------------------------

    /**
     * Le HTML à charger pour ce lancement — l'unique point d'entrée du
     * démarrage. Dans l'ordre : si les lancements précédents ont accumulé
     * assez d'échecs consécutifs, la version installée est écartée et la
     * copie embarquée restaurée (test 10) ; puis la tentative courante est
     * comptée (elle restera un échec tant que signalerDemarrageReussi()
     * n'aura pas été appelé) ; enfin le contenu est servi. Sans version
     * installée — premier lancement, y compris hors ligne — la copie
     * embarquée est servie telle quelle (test 11) : aucun réseau n'entre
     * jamais dans cette décision.
     */
    fun htmlAuDemarrage(): ByteArray {
        if (echecsConsecutifs() >= seuilEchecs) {
            restaurerEmbarque()
        }
        ecrireEntier(fichierEchecs, echecsConsecutifs() + 1)
        val installe = fichierInstalle
        // ⚠ ON RETIENT CE QU'ON SERT, AU MOMENT OÙ ON LE SERT. Le relire plus
        // tard donnerait le disque, qui peut avoir changé entre-temps — c'est
        // précisément la divergence que ce champ existe pour dire.
        buildServi = buildInstalle()
        return if (installe.isFile) installe.readBytes() else copieEmbarquee()
    }

    /**
     * Le build de la version qui TOURNE, ou `null` avant tout démarrage.
     *
     * ⚠ `null` N'EST PAS ZÉRO ET N'EST PAS `buildInstalle()`. Tant que
     * `htmlAuDemarrage()` n'a pas été appelé, aucune version n'est servie ;
     * répondre le disque ferait croire que la version du disque tourne, ce qui
     * est exactement le mensonge qu'on retire.
     */
    fun buildServi(): Int? = buildServi

    /** À appeler quand la page a effectivement démarré. */
    fun signalerDemarrageReussi() {
        ecrireEntier(fichierEchecs, 0)
    }

    fun echecsConsecutifs(): Int = lireEntier(fichierEchecs) ?: 0

    // -- versions ------------------------------------------------------------

    /** Build de la version actuellement servie (installée, sinon embarquée). */
    fun buildInstalle(): Int =
        if (fichierInstalle.isFile) lireEntier(fichierBuild) ?: buildEmbarque else buildEmbarque

    /**
     * Installe une nouvelle version DÉJÀ VÉRIFIÉE (allowlist, anti-retour,
     * empreinte : voir CycleMiseAJour). HTML d'abord, marqueur de build
     * ensuite : une interruption entre les deux laisse un build sous-évalué,
     * dont le seul effet est de réinstaller la même version — idempotent.
     */
    fun installerNouvelleVersion(contenu: ByteArray, build: Int) {
        InstallationAtomique.installer(contenu, fichierInstalle)
        ecrireEntier(fichierBuild, build)
    }

    /** Écarte la version installée et repart de la copie embarquée. */
    fun restaurerEmbarque() {
        fichierInstalle.delete()
        fichierBuild.delete()
        ecrireEntier(fichierEchecs, 0)
    }

    // -- petits entiers persistés -------------------------------------------

    private fun lireEntier(fichier: File): Int? =
        if (fichier.isFile) fichier.readText().trim().toIntOrNull() else null

    private fun ecrireEntier(fichier: File, valeur: Int) {
        repertoire.mkdirs()
        fichier.writeText(valeur.toString())
    }
}
