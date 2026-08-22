package fr.freredoc.foyerzero

import fr.freredoc.foyerzero.maj.Allowlist
import fr.freredoc.foyerzero.maj.CycleMiseAJour
import fr.freredoc.foyerzero.maj.GestionnaireVersions
import java.io.InputStream
import java.net.HttpURLConnection
import java.net.URL

/**
 * Vérification de mise à jour en arrière-plan. Toutes les DÉCISIONS —
 * allowlist, anti-retour, empreinte — vivent dans le module :maj, testé en
 * JVM ; ici il n'y a que le transport. Toute erreur est silencieuse : la
 * version en place reste servie, on réessaiera au prochain lancement.
 */
object MiseAJour {

    // Manifeste publié par la CI sur GitHub Pages, dans le même job que le
    // HTML qu'il décrit. L'URL du HTML vient du manifeste et repasse par
    // l'allowlist avant tout téléchargement.
    const val URL_MANIFESTE = "https://freredoc.github.io/foyerzero/manifest.json"

    private const val TAILLE_MAX = 16 * 1024 * 1024

    fun verifierEnArrierePlan(gestionnaire: GestionnaireVersions) {
        try {
            val manifesteBrut = telecharger(URL_MANIFESTE) ?: return
            val (manifeste, _) = CycleMiseAJour.evaluerManifeste(
                String(manifesteBrut, Charsets.UTF_8),
                gestionnaire.buildInstalle(),
            )
            if (manifeste == null) return
            val contenu = telecharger(manifeste.url) ?: return
            if (CycleMiseAJour.evaluerContenu(contenu, manifeste) != null) return
            gestionnaire.installerNouvelleVersion(contenu, manifeste.build)
        } catch (_: Exception) {
            // Silencieux : l'ancienne version reste servie, intacte.
        }
    }

    /** Télécharge une URL, qui doit passer l'allowlist. */
    private fun telecharger(url: String): ByteArray? {
        if (!Allowlist.urlAutorisee(url)) return null
        val connexion = URL(url).openConnection() as HttpURLConnection
        // Une redirection pourrait sortir de l'allowlist : on n'en suit
        // aucune — tout autre code que 200 vaut abandon.
        connexion.instanceFollowRedirects = false
        connexion.connectTimeout = 10_000
        connexion.readTimeout = 30_000
        return try {
            if (connexion.responseCode != HttpURLConnection.HTTP_OK) {
                null
            } else {
                connexion.inputStream.use { lirePlafonne(it, TAILLE_MAX) }
            }
        } finally {
            connexion.disconnect()
        }
    }

    /** Lecture plafonnée : au-delà de la limite, on jette sans finir de lire. */
    private fun lirePlafonne(flux: InputStream, limite: Int): ByteArray? {
        val tampon = ByteArray(64 * 1024)
        var sortie = ByteArray(0)
        var total = 0
        while (true) {
            val lus = flux.read(tampon)
            if (lus < 0) return sortie.copyOf(total)
            if (total + lus > limite) return null
            if (total + lus > sortie.size) {
                sortie = sortie.copyOf(maxOf(sortie.size * 2, total + lus, 128 * 1024))
            }
            System.arraycopy(tampon, 0, sortie, total, lus)
            total += lus
        }
    }
}
