package fr.freredoc.foyerzero.maj

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertNull

/** L'enchaînement des décisions d'un cycle complet, sans E/S. */
class CycleMiseAJourTest {

    private val html = "<html>v3</html>".toByteArray()
    private val manifesteValide =
        """{ "version": "0.3.0", "build": 3, "sha256": "${Empreinte.sha256Hex(html)}",
             "url": "https://freredoc.github.io/foyerzero/index.html" }"""

    @Test
    fun `cycle nominal - manifeste accepte puis contenu accepte`() {
        val (manifeste, refus) = CycleMiseAJour.evaluerManifeste(manifesteValide, buildInstalle = 2)
        assertNull(refus)
        assertNotNull(manifeste)
        assertNull(CycleMiseAJour.evaluerContenu(html, manifeste))
    }

    @Test
    fun `manifeste illisible, retour en arriere, url hors allowlist`() {
        assertEquals(
            CycleMiseAJour.Refus.MANIFESTE_ILLISIBLE,
            CycleMiseAJour.evaluerManifeste("pas du json", buildInstalle = 2).second,
        )
        assertEquals(
            CycleMiseAJour.Refus.RETOUR_EN_ARRIERE,
            CycleMiseAJour.evaluerManifeste(manifesteValide, buildInstalle = 3).second,
        )
        val detourne = manifesteValide.replace(
            "https://freredoc.github.io/foyerzero/index.html",
            "https://freredoc.github.io.evil.com/foyerzero/index.html",
        )
        assertEquals(
            CycleMiseAJour.Refus.URL_INTERDITE,
            CycleMiseAJour.evaluerManifeste(detourne, buildInstalle = 2).second,
        )
    }

    @Test
    fun `contenu altere refuse a l'empreinte`() {
        val (manifeste, _) = CycleMiseAJour.evaluerManifeste(manifesteValide, buildInstalle = 2)
        val altere = html.copyOf().also { it[3] = (it[3] + 1).toByte() }
        assertEquals(
            CycleMiseAJour.Refus.EMPREINTE_INVALIDE,
            CycleMiseAJour.evaluerContenu(altere, manifeste!!),
        )
    }
}
