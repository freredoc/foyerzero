package fr.freredoc.foyerzero.maj

import org.junit.Rule
import org.junit.rules.TemporaryFolder
import java.io.File
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

/**
 * Test 8 du brief : interruption avant renommage → l'ancienne version reste
 * servie, intacte. Le découpage écrireTemporaire/finaliser rend l'interruption
 * observable au lieu de la simuler.
 */
class InstallationAtomiqueTest {

    @get:Rule
    val dossier = TemporaryFolder()

    @Test
    fun `test 8 - interruption avant renommage laisse l'ancienne version intacte`() {
        val cible = File(dossier.root, "index.html")
        cible.writeBytes("ancienne version".toByteArray())

        // Étape 1 seule : le téléchargement vérifié est posé en temporaire,
        // puis « interruption » — finaliser n'est jamais appelé.
        val temporaire = InstallationAtomique.ecrireTemporaire("nouvelle version".toByteArray(), cible)

        assertEquals("ancienne version", cible.readText(), "la cible a été altérée avant la bascule")
        assertTrue(temporaire.isFile, "le temporaire devrait exister à côté de la cible")
        assertEquals(dossier.root, temporaire.parentFile, "le temporaire doit être dans le même répertoire (sinon le renommage n'est pas atomique)")

        // Reprise : la bascule rend la nouvelle version visible d'un coup.
        InstallationAtomique.finaliser(temporaire, cible)
        assertEquals("nouvelle version", cible.readText())
        assertTrue(!temporaire.exists(), "le temporaire devrait avoir disparu après la bascule")
    }

    @Test
    fun `installer - cycle complet, y compris premiere installation sans cible`() {
        val cible = File(dossier.root, "jeu/index.html")
        InstallationAtomique.installer("v1".toByteArray(), cible)
        assertEquals("v1", cible.readText())
        InstallationAtomique.installer("v2".toByteArray(), cible)
        assertEquals("v2", cible.readText())
        val restes = cible.parentFile.listFiles()!!.filter { it.name.endsWith(".tmp") }
        assertEquals(emptyList(), restes, "aucun temporaire ne doit survivre au cycle")
    }
}
