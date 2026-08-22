package fr.freredoc.foyerzero.maj

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNull

/** Parsing strict du manifeste : tout écart au format vaut refus. */
class ManifesteTest {

    private val sha = "a".repeat(64)

    @Test
    fun `manifeste valide - analyse complete`() {
        val m = Manifeste.analyser(
            """{ "version": "0.2.0", "build": 3, "sha256": "$sha",
                 "url": "https://freredoc.github.io/foyerzero/index.html" }""",
        )
        assertEquals(
            Manifeste("0.2.0", 3, sha, "https://freredoc.github.io/foyerzero/index.html"),
            m,
        )
    }

    @Test
    fun `champs inconnus scalaires ignores - un futur manifeste reste lisible`() {
        val m = Manifeste.analyser(
            """{ "version": "0.2.0", "build": 3, "sha256": "$sha",
                 "url": "https://freredoc.github.io/foyerzero/index.html",
                 "notes": "corrige la boucle", "urgent": false, "poids": 2.5, "canal": null }""",
        )
        assertEquals(3, m?.build)
    }

    @Test
    fun `deviations refusees`() {
        val urlOk = "https://freredoc.github.io/foyerzero/index.html"
        // Champ requis manquant.
        assertNull(Manifeste.analyser("""{ "version": "0.2.0", "build": 3, "sha256": "$sha" }"""))
        // build non entier ou non positif.
        assertNull(Manifeste.analyser("""{ "version": "0.2.0", "build": "3", "sha256": "$sha", "url": "$urlOk" }"""))
        assertNull(Manifeste.analyser("""{ "version": "0.2.0", "build": 3.5, "sha256": "$sha", "url": "$urlOk" }"""))
        assertNull(Manifeste.analyser("""{ "version": "0.2.0", "build": 0, "sha256": "$sha", "url": "$urlOk" }"""))
        assertNull(Manifeste.analyser("""{ "version": "0.2.0", "build": -2, "sha256": "$sha", "url": "$urlOk" }"""))
        // Empreinte au mauvais format.
        assertNull(Manifeste.analyser("""{ "version": "0.2.0", "build": 3, "sha256": "zz", "url": "$urlOk" }"""))
        assertNull(Manifeste.analyser("""{ "version": "0.2.0", "build": 3, "sha256": "${"g".repeat(64)}", "url": "$urlOk" }"""))
        // Valeur imbriquée : hors format.
        assertNull(Manifeste.analyser("""{ "version": "0.2.0", "build": 3, "sha256": "$sha", "url": "$urlOk", "extra": { "a": 1 } }"""))
        assertNull(Manifeste.analyser("""{ "version": "0.2.0", "build": 3, "sha256": "$sha", "url": "$urlOk", "extra": [1] }"""))
        // Clé en double.
        assertNull(Manifeste.analyser("""{ "build": 3, "build": 4, "version": "0.2.0", "sha256": "$sha", "url": "$urlOk" }"""))
        // Débris après l'objet, JSON tronqué, pas un objet.
        assertNull(Manifeste.analyser("""{ "version": "0.2.0", "build": 3, "sha256": "$sha", "url": "$urlOk" } x"""))
        assertNull(Manifeste.analyser("""{ "version": "0.2.0", "build": 3"""))
        assertNull(Manifeste.analyser("""["version", "0.2.0"]"""))
        assertNull(Manifeste.analyser(""))
    }
}
