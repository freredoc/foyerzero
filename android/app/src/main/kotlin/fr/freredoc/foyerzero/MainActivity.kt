package fr.freredoc.foyerzero

import android.annotation.SuppressLint
import android.app.Activity
import android.os.Bundle
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
        // Aucune interface JS native : chaque pont serait une surface d'attaque.

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

    companion object {
        // Origine STABLE pour le stockage local du jeu — domaine réservé par
        // Android au contenu applicatif local. Aucune requête n'y part
        // jamais : le contenu est fourni, et le client bloque tout le reste.
        // En changer plus tard changerait l'origine de localStorage, donc
        // perdrait les sauvegardes : ne pas y toucher sans migration.
        const val ORIGINE_LOCALE = "https://appassets.androidplatform.net/"
    }
}
