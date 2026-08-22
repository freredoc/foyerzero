package fr.freredoc.foyerzero.maj

import java.net.URI

/**
 * Allowlist stricte de l'origine de mise à jour.
 *
 * Une seule origine autorisée, écrite en dur, comparée APRÈS parsing d'URL :
 * schéma https seul, hôte en égalité exacte, port par défaut, aucun userinfo,
 * chemin normalisé sous le préfixe autorisé. Jamais de startsWith/contains
 * sur la chaîne brute — c'est exactement ce que les tests 2 à 5 vérifient
 * par sabotage.
 *
 * L'origine découle du nom RÉEL du dépôt (freredoc/foyerzero, lu via l'API,
 * pas supposé) : GitHub Pages le sert sous https://freredoc.github.io/foyerzero/.
 */
object Allowlist {

    const val SCHEMA_AUTORISE = "https"
    const val HOTE_AUTORISE = "freredoc.github.io"
    const val PREFIXE_CHEMIN_AUTORISE = "/foyerzero/"

    /**
     * Décide si une URL de mise à jour est autorisée. Toute anomalie de
     * parsing vaut refus : on ne télécharge jamais dans le doute.
     */
    fun urlAutorisee(brute: String): Boolean {
        val uri = try {
            URI(brute)
        } catch (_: Exception) {
            return false
        }

        // URL absolue exigée : une relative n'a ni schéma ni hôte à vérifier.
        if (!uri.isAbsolute) return false

        // Schéma : https, rien d'autre (test 4).
        if (!SCHEMA_AUTORISE.equals(uri.scheme, ignoreCase = true)) return false

        // Userinfo : interdit. « https://hôte-officiel@evil.com/ » place
        // l'hôte officiel en userinfo et evil.com en hôte (test 5).
        if (uri.rawUserInfo != null) return false

        // Hôte : égalité exacte, pas un préfixe ni un suffixe (tests 2 et 3).
        val hote = uri.host ?: return false
        if (!HOTE_AUTORISE.equals(hote, ignoreCase = true)) return false

        // Port : celui par défaut de https uniquement.
        if (uri.port != -1 && uri.port != 443) return false

        // Chemin : normalisé (les segments « .. » textuels sont résolus),
        // puis exigé sous le préfixe (test 6). Le préfixe se termine par « / »,
        // donc « /foyerzero-evil/x » ne passe pas.
        val chemin = uri.normalize().path ?: return false
        if (!chemin.startsWith(PREFIXE_CHEMIN_AUTORISE)) return false

        // Ceinture : le chemin décodé ne doit plus contenir de remontée.
        // normalize() traite « .. » mais pas « %2e%2e », que getPath() décode.
        if (chemin.contains("..")) return false

        return true
    }
}
