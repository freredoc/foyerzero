package fr.freredoc.foyerzero.maj

/**
 * Manifeste de mise à jour, publié par la CI dans le même job que le HTML
 * qu'il décrit :
 *
 *   { "version": "0.2.0", "build": 2, "sha256": "…64 hex…", "url": "https://…" }
 *
 * Le parseur est volontairement maison et STRICT : l'entrée est produite par
 * notre propre CI, le format est un objet JSON plat, et tout écart vaut refus
 * (un refus de parsing = pas de mise à jour, comportement sûr par défaut).
 * Les champs inconnus à valeur scalaire sont ignorés, pour qu'un manifeste
 * enrichi plus tard reste lisible par les anciens clients ; toute valeur
 * imbriquée (objet, tableau) est hors format et vaut refus.
 */
data class Manifeste(
    val version: String,
    val build: Int,
    val sha256: String,
    val url: String,
) {
    companion object {

        private val MOTIF_SHA256 = Regex("^[0-9a-f]{64}$")

        /** Analyse le JSON du manifeste. Renvoie null si quoi que ce soit dévie. */
        fun analyser(json: String): Manifeste? {
            val champs = analyserObjetPlat(json) ?: return null

            val version = champs["version"] as? String ?: return null
            val build = champs["build"] as? Long ?: return null
            val sha256 = champs["sha256"] as? String ?: return null
            val url = champs["url"] as? String ?: return null

            if (build <= 0 || build > Int.MAX_VALUE) return null
            if (!MOTIF_SHA256.matches(sha256.lowercase())) return null
            if (version.isEmpty() || url.isEmpty()) return null

            return Manifeste(version, build.toInt(), sha256.lowercase(), url)
        }

        // -- mini-parseur d'objet JSON plat : { "clé": scalaire, ... } --------

        private fun analyserObjetPlat(texte: String): Map<String, Any?>? {
            val lecteur = Lecteur(texte)
            lecteur.sauterBlancs()
            if (!lecteur.consommer('{')) return null
            val champs = LinkedHashMap<String, Any?>()
            lecteur.sauterBlancs()
            if (lecteur.consommer('}')) {
                lecteur.sauterBlancs()
                return if (lecteur.finie()) champs else null
            }
            while (true) {
                lecteur.sauterBlancs()
                val cle = lecteur.chaine() ?: return null
                if (champs.containsKey(cle)) return null // doublon = refus
                lecteur.sauterBlancs()
                if (!lecteur.consommer(':')) return null
                lecteur.sauterBlancs()
                val valeur = lecteur.scalaire() ?: return null
                champs[cle] = valeur.contenu
                lecteur.sauterBlancs()
                if (lecteur.consommer(',')) continue
                if (lecteur.consommer('}')) break
                return null
            }
            lecteur.sauterBlancs()
            return if (lecteur.finie()) champs else null
        }

        /** Boîte pour distinguer « null JSON » (valeur licite) d'un échec de parsing. */
        private class Scalaire(val contenu: Any?)

        private class Lecteur(private val s: String) {
            private var i = 0

            fun finie() = i >= s.length

            fun sauterBlancs() {
                while (i < s.length && s[i] in " \t\r\n") i++
            }

            fun consommer(c: Char): Boolean {
                if (i < s.length && s[i] == c) {
                    i++
                    return true
                }
                return false
            }

            /** Chaîne JSON entre guillemets, échappements standards. */
            fun chaine(): String? {
                if (!consommer('"')) return null
                val sb = StringBuilder()
                while (i < s.length) {
                    when (val c = s[i++]) {
                        '"' -> return sb.toString()
                        '\\' -> {
                            if (i >= s.length) return null
                            when (s[i++]) {
                                '"' -> sb.append('"')
                                '\\' -> sb.append('\\')
                                '/' -> sb.append('/')
                                'b' -> sb.append('\b')
                                'f' -> sb.append('\u000C')
                                'n' -> sb.append('\n')
                                'r' -> sb.append('\r')
                                't' -> sb.append('\t')
                                'u' -> {
                                    if (i + 4 > s.length) return null
                                    val code = s.substring(i, i + 4).toIntOrNull(16) ?: return null
                                    sb.append(code.toChar())
                                    i += 4
                                }
                                else -> return null
                            }
                        }
                        else -> {
                            if (c.code < 0x20) return null
                            sb.append(c)
                        }
                    }
                }
                return null // guillemet fermant manquant
            }

            /** Scalaire JSON : chaîne, entier, flottant, booléen, null.
             *  Objet ou tableau imbriqué = hors format = échec. */
            fun scalaire(): Scalaire? {
                if (i >= s.length) return null
                return when (s[i]) {
                    '"' -> chaine()?.let { Scalaire(it) }
                    '{', '[' -> null
                    't' -> if (s.startsWith("true", i)) { i += 4; Scalaire(true) } else null
                    'f' -> if (s.startsWith("false", i)) { i += 5; Scalaire(false) } else null
                    'n' -> if (s.startsWith("null", i)) { i += 4; Scalaire(null) } else null
                    else -> nombre()
                }
            }

            private fun nombre(): Scalaire? {
                val debut = i
                if (i < s.length && s[i] == '-') i++
                while (i < s.length && s[i].isDigit()) i++
                var flottant = false
                if (i < s.length && s[i] == '.') {
                    flottant = true
                    i++
                    while (i < s.length && s[i].isDigit()) i++
                }
                if (i < s.length && (s[i] == 'e' || s[i] == 'E')) {
                    flottant = true
                    i++
                    if (i < s.length && (s[i] == '+' || s[i] == '-')) i++
                    while (i < s.length && s[i].isDigit()) i++
                }
                val brut = s.substring(debut, i)
                if (brut.isEmpty() || brut == "-") return null
                return if (flottant) {
                    brut.toDoubleOrNull()?.let { Scalaire(it) }
                } else {
                    brut.toLongOrNull()?.let { Scalaire(it) }
                }
            }
        }
    }
}
