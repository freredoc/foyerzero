package fr.freredoc.foyerzero

import android.annotation.SuppressLint
import android.app.Activity
import android.os.Bundle
import android.webkit.JavascriptInterface
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import fr.freredoc.foyerzero.maj.GestionnaireVersions
import java.io.ByteArrayInputStream
import java.io.File

/**
 * Le shell de Foyer Zéro : une WebView qui sert le HTML autonome depuis le
 * stockage interne de l'application, jamais depuis le réseau.
 *
 * Le HTML est CHARGÉ (contenu fourni à la WebView), jamais VISITÉ (aucune
 * URL distante) ni INJECTÉ (aucun evaluateJavascript). Le client bloque
 * toute navigation et toute sous-requête : le HTML étant autonome par
 * construction (garde offline du build), rien de légitime n'a besoin de
 * sortir.
 */
class MainActivity : Activity() {

    private lateinit var gestionnaire: GestionnaireVersions

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        gestionnaire = GestionnaireVersions(
            repertoire = File(filesDir, "jeu"),
            copieEmbarquee = { assets.open("index.html").use { it.readBytes() } },
            buildEmbarque = BuildConfig.VERSION_CODE,
        )

        val web = WebView(this)
        with(web.settings) {
            javaScriptEnabled = true // le jeu est une application JS
            domStorageEnabled = true // sa sauvegarde locale
            allowFileAccess = false
            allowFileAccessFromFileURLs = false
            allowUniversalAccessFromFileURLs = false
            allowContentAccess = false
            mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
            setGeolocationEnabled(false)
        }
        // ⚠⚠ UN PONT JS, ET UN SEUL — ET IL RETOURNE UNE DÉCISION ÉCRITE ICI.
        // Cette ligne disait « aucune interface JS native : chaque pont serait
        // une surface d'attaque », et elle avait raison dans l'absolu. Ethan a
        // demandé le 31/08 un bouton « vérifier maj » dans les Options ; sans
        // pont, la page ne PEUT pas le faire — `tools/build.js` refuse toute URL
        // dans le HTML produit, et CLAUDE.md §6 interdit d'assembler l'adresse à
        // l'exécution pour passer sous la garde. Le manifeste doit donc rester
        // côté Kotlin, et la page doit pouvoir le lui demander.
        //
        // ⚠ CE QUI REND CE PONT-CI ACCEPTABLE, ET IL FAUT QUE ÇA RESTE VRAI :
        //   — la WebView ne charge QUE le HTML autonome, fourni en mémoire
        //     (`loadDataWithBaseURL`), jamais visité ni injecté ;
        //   — `shouldOverrideUrlLoading` refuse toute navigation et
        //     `shouldInterceptRequest` vide toute sous-requête, donc aucun code
        //     tiers ne peut s'exécuter dans cette page ;
        //   — les deux méthodes exposées ne prennent AUCUN argument. Rien venu
        //     de la page ne traverse le pont : il n'y a rien à injecter.
        //   — elles ne rendent qu'un état déjà réduit à une phrase et un entier
        //     par `EtatMiseAJour`, jamais une adresse ni un chemin.
        // Le jour où l'une de ces quatre lignes cesse d'être vraie, ce pont
        // redevient ce que le commentaire d'origine décrivait.
        web.addJavascriptInterface(PontMiseAJour(gestionnaire), "FoyerZeroMaj")

        web.webViewClient = object : WebViewClient() {
            // La WebView ne navigue jamais, vers rien.
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean = true

            // Aucune sous-requête ne sort : réponse vide pour toutes.
            override fun shouldInterceptRequest(view: WebView?, request: WebResourceRequest?): WebResourceResponse =
                WebResourceResponse("text/plain", "utf-8", ByteArrayInputStream(ByteArray(0)))

            // La page a démarré : la tentative comptée par htmlAuDemarrage()
            // est soldée, le compteur de rollback retombe à zéro.
            override fun onPageFinished(view: WebView?, url: String?) {
                gestionnaire.signalerDemarrageReussi()
            }
        }
        setContentView(web)

        val html = gestionnaire.htmlAuDemarrage()
        web.loadDataWithBaseURL(ORIGINE_LOCALE, String(html, Charsets.UTF_8), "text/html", "utf-8", null)

        // Vérification de mise à jour en arrière-plan ; si une version plus
        // récente est validée, elle sera servie AU PROCHAIN LANCEMENT —
        // jamais de remplacement à chaud du jeu en cours.
        Thread { MiseAJour.verifierEnArrierePlan(gestionnaire) }.start()
    }

    /**
     * Le pont, réduit au strict nécessaire : demander, et lire où ça en est.
     *
     * ⚠ AUCUNE MÉTHODE NE PREND D'ARGUMENT. C'est ce qui fait qu'il n'y a rien à
     * injecter depuis la page : le pont ne transporte pas de données vers le
     * natif, il en rend.
     *
     * ⚠ ET `@JavascriptInterface` EST OBLIGATOIRE SUR CHACUNE. Sans
     * l'annotation, la méthode n'est pas exposée du tout depuis l'API 17 — le
     * bouton resterait muet sans qu'aucune erreur ne le dise.
     *
     * ⚠⚠ LA CLASSE EST PUBLIQUE, ET CE N'EST PAS UN OUBLI DE `private`.
     * `addJavascriptInterface` énumère les méthodes annotées PAR RÉFLEXION :
     * sous une classe non publique, elles ne sont pas atteignables et le pont
     * est silencieusement mort. Ça compile, ça se déploie, et le bouton ne
     * répond simplement jamais — exactement le genre de défaut que ce lot-ci
     * existe pour retirer (une classe basculée que la feuille ignore).
     */
    class PontMiseAJour(private val gestionnaire: GestionnaireVersions) {

        /** Lance une vérification, ou ne fait rien si une tourne déjà. */
        @JavascriptInterface
        fun verifier() = MiseAJour.demanderUneVerification(gestionnaire)

        /** L'état de la dernière vérification, en JSON — voir `EtatMiseAJour`. */
        @JavascriptInterface
        fun etat(): String = MiseAJour.etatJson(gestionnaire)
    }

    companion object {
        // Origine STABLE pour le stockage local du jeu — domaine réservé par
        // Android au contenu applicatif local. Aucune requête n'y part
        // jamais : le contenu est fourni, et le client bloque tout le reste.
        // En changer plus tard changerait l'origine de localStorage, donc
        // perdrait les sauvegardes : ne pas y toucher sans migration.
        const val ORIGINE_LOCALE = "https://appassets.androidplatform.net/"
    }
}
