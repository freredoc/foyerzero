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
        return if (installe.isFile) installe.readBytes() else copieEmbarquee()
    }

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
