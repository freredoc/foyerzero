package fr.freredoc.foyerzero

import fr.freredoc.foyerzero.maj.Allowlist
import fr.freredoc.foyerzero.maj.CycleMiseAJour
import fr.freredoc.foyerzero.maj.EtatMiseAJour
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

    // ⚠⚠ L'ÉTAT DE LA DERNIÈRE VÉRIFICATION — il n'existait pas, et c'est ce qui
    // rendait l'auto-update MUET. `verifierEnArrierePlan` partait à chaque
    // lancement et ne disait rien : ni « à jour », ni « échec réseau », ni « une
    // version t'attend au prochain démarrage ». Ethan a demandé un bouton le
    // 31/08 ; un bouton doit répondre, donc il fallait d'abord une réponse.
    //
    // ⚠ `@Volatile` PARCE QUE DEUX FILS LE TOUCHENT : la vérification tourne sur
    // un fil à elle, la page le lit depuis le fil de l'interface. Sans lui, le
    // fil d'interface pourrait lire indéfiniment une valeur périmée.
    @Volatile
    private var etape: EtatMiseAJour.Etape = EtatMiseAJour.Etape.JAMAIS

    @Volatile
    private var refus: CycleMiseAJour.Refus? = null

    /** L'état courant, sérialisé pour l'écran Options. */
    fun etatJson(gestionnaire: GestionnaireVersions): String =
        EtatMiseAJour.versJson(etape, gestionnaire.buildInstalle(), refus)

    /**
     * Lance une vérification si aucune ne tourne déjà.
     *
     * ⚠ ELLE REND TOUT DE SUITE — la vérification part sur son propre fil. Le
     * pont JavaScript est appelé depuis le fil de l'interface, et y faire une
     * requête réseau gèlerait le jeu (Android la refuserait, d'ailleurs).
     * L'écran relit `etatJson` ensuite, à son rythme.
     *
     * ⚠ ET DEUX APPUIS N'EN LANCENT QU'UNE. Sans ce garde-fou, tapoter le bouton
     * lancerait autant de téléchargements que de touchers.
     */
    @Synchronized
    fun demanderUneVerification(gestionnaire: GestionnaireVersions) {
        if (etape == EtatMiseAJour.Etape.EN_COURS) return
        etape = EtatMiseAJour.Etape.EN_COURS
        refus = null
        Thread { verifierEnArrierePlan(gestionnaire) }.start()
    }

    // Manifeste publié par la CI sur GitHub Pages, dans le même job que le
    // HTML qu'il décrit. L'URL du HTML vient du manifeste et repasse par
    // l'allowlist avant tout téléchargement.
    const val URL_MANIFESTE = "https://freredoc.github.io/foyerzero/manifest.json"

    private const val TAILLE_MAX = 16 * 1024 * 1024

    fun verifierEnArrierePlan(gestionnaire: GestionnaireVersions) {
        // ⚠⚠ CHAQUE SORTIE POSE UN ÉTAT, IL N'Y A PLUS DE `return` MUET. Les
        // cinq chemins d'abandon rendaient tous `Unit` sans rien dire : côté
        // écran, « pas de réseau » et « déjà à jour » se ressemblaient
        // exactement, c'est-à-dire à rien du tout.
        //
        // ⚠ L'ÉCHEC RESTE SILENCIEUX POUR LE JEU : rien n'est jeté, la version
        // en place continue d'être servie. Ce qui change, c'est qu'on peut le
        // LIRE. C'est la même discipline que « rien ne se retire en silence ».
        try {
            val manifesteBrut = telecharger(URL_MANIFESTE)
            if (manifesteBrut == null) { conclure(EtatMiseAJour.Etape.ECHOUEE, null); return }
            val (manifeste, motif) = CycleMiseAJour.evaluerManifeste(
                String(manifesteBrut, Charsets.UTF_8),
                gestionnaire.buildInstalle(),
            )
            if (manifeste == null) {
                // ⚠ UN RETOUR EN ARRIÈRE REFUSÉ N'EST PAS UNE PANNE : c'est le
                // cas NORMAL quand on est déjà à jour — le manifeste annonce le
                // build qu'on a déjà, et la politique anti-retour le rejette.
                // Le compter comme un échec ferait dire « erreur » à une
                // vérification parfaitement réussie.
                conclure(
                    if (motif == CycleMiseAJour.Refus.RETOUR_EN_ARRIERE) EtatMiseAJour.Etape.A_JOUR
                    else EtatMiseAJour.Etape.ECHOUEE,
                    motif,
                )
                return
            }
            val contenu = telecharger(manifeste.url)
            if (contenu == null) { conclure(EtatMiseAJour.Etape.ECHOUEE, null); return }
            val refusContenu = CycleMiseAJour.evaluerContenu(contenu, manifeste)
            if (refusContenu != null) { conclure(EtatMiseAJour.Etape.ECHOUEE, refusContenu); return }
            gestionnaire.installerNouvelleVersion(contenu, manifeste.build)
            conclure(EtatMiseAJour.Etape.INSTALLEE, null)
        } catch (_: Exception) {
            // Silencieux pour le JEU : l'ancienne version reste servie, intacte.
            conclure(EtatMiseAJour.Etape.ECHOUEE, null)
        }
    }

    private fun conclure(nouvelle: EtatMiseAJour.Etape, motif: CycleMiseAJour.Refus?) {
        refus = motif
        etape = nouvelle
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
