package fr.freredoc.foyerzero.maj

import org.junit.Rule
import org.junit.rules.TemporaryFolder
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNull
import kotlin.test.assertFalse
import kotlin.test.assertTrue

/**
 * Tests 10 et 11 du brief : rollback après échecs de démarrage consécutifs,
 * premier lancement hors ligne sur la copie embarquée.
 *
 * Un lancement de l'application = un appel à htmlAuDemarrage(), suivi de
 * signalerDemarrageReussi() seulement si la page a effectivement chargé.
 */
class GestionnaireVersionsTest {

    @get:Rule
    val dossier = TemporaryFolder()

    private val embarque = "<html>version embarquée dans l'APK</html>".toByteArray()

    private fun gestionnaire(seuil: Int = 2) = GestionnaireVersions(
        repertoire = dossier.root,
        copieEmbarquee = { embarque },
        buildEmbarque = 2,
        seuilEchecs = seuil,
    )

    @Test
    fun `test 11 - premier lancement hors ligne - la copie embarquee est servie`() {
        // Répertoire vierge, aucun réseau nulle part dans la décision :
        // le gestionnaire ne connaît que le disque et l'asset injecté.
        val g = gestionnaire()
        assertEquals(String(embarque), String(g.htmlAuDemarrage()))
        assertEquals(2, g.buildInstalle(), "sans installation, le build est celui de l'APK")
    }

    @Test
    fun `le build SERVI et le build INSTALLE divergent des qu une maj attend une relance`() {
        // ⚠⚠ C'EST LE DÉFAUT DU 03/09, REPRODUIT EN JVM. Ethan voyait
        // « v0.67.0 b68 » et, deux lignes plus bas, « À jour — build 70 ». Le
        // verdict lisait le DISQUE ; or une vérification qui aboutit remplace le
        // fichier pendant que la page tourne, et ne remplace jamais la page.
        val g = gestionnaire()
        assertNull(g.buildServi(), "aucune version n'est servie avant le premier démarrage")

        g.htmlAuDemarrage()
        assertEquals(2, g.buildServi(), "c'est la copie embarquée qui tourne")

        // La vérification aboutit PENDANT que la page tourne.
        g.installerNouvelleVersion("<html>v3</html>".toByteArray(), build = 3)
        assertEquals(3, g.buildInstalle(), "le disque porte la nouvelle version")
        assertEquals(2, g.buildServi(), "la page qui tourne, elle, n'a pas changé")
        assertEquals(
            EtatMiseAJour.Etape.EN_ATTENTE_DE_RELANCE,
            EtatMiseAJour.verdictSansTelechargement(g.buildServi()!!, g.buildInstalle()),
        )

        // Et la relance les réconcilie — c'est la seule chose qui le fasse.
        g.htmlAuDemarrage()
        assertEquals(3, g.buildServi())
        assertEquals(
            EtatMiseAJour.Etape.A_JOUR,
            EtatMiseAJour.verdictSansTelechargement(g.buildServi()!!, g.buildInstalle()),
        )
    }

    @Test
    fun `mise a jour installee - servie au lancement suivant, build persiste`() {
        val g = gestionnaire()
        g.installerNouvelleVersion("<html>v3</html>".toByteArray(), build = 3)
        assertEquals("<html>v3</html>", String(g.htmlAuDemarrage()))
        assertEquals(3, g.buildInstalle(), "le build installé doit être persisté (sinon la même version se réinstalle en boucle)")
    }

    @Test
    fun `test 10 - apres N echecs de demarrage consecutifs, la copie embarquee est restauree`() {
        val g = gestionnaire(seuil = 2)
        g.installerNouvelleVersion("<html>version corrompue qui ne démarre pas</html>".toByteArray(), build = 3)

        // Lancements 1 et 2 : la version installée est servie et ne démarre
        // jamais — signalerDemarrageReussi() n'est pas appelé.
        assertTrue(String(g.htmlAuDemarrage()).contains("corrompue"))
        assertEquals(1, g.echecsConsecutifs())
        assertTrue(String(g.htmlAuDemarrage()).contains("corrompue"))
        assertEquals(2, g.echecsConsecutifs())

        // Lancement 3 : le seuil est atteint, rollback.
        val servi = g.htmlAuDemarrage()
        assertEquals(String(embarque), String(servi), "après 2 échecs consécutifs, l'embarqué doit être restauré")
        assertFalse(g.fichierInstalle.exists(), "la version fautive doit avoir été écartée")
        assertEquals(2, g.buildInstalle(), "le build doit être redescendu à celui de l'APK")
        assertEquals(1, g.echecsConsecutifs(), "seule la tentative courante doit rester comptée après le rollback")

        // La copie embarquée démarre : la série est soldée.
        g.signalerDemarrageReussi()
        assertEquals(0, g.echecsConsecutifs())
    }

    @Test
    fun `un demarrage reussi remet le compteur a zero - pas de rollback sur echecs non consecutifs`() {
        val g = gestionnaire(seuil = 2)
        g.installerNouvelleVersion("<html>v3</html>".toByteArray(), build = 3)

        g.htmlAuDemarrage() // lancement 1 : jamais abouti — échec n° 1
        g.htmlAuDemarrage() // lancement 2 : aboutit
        g.signalerDemarrageReussi() // la série d'échecs est brisée

        assertEquals("<html>v3</html>", String(g.htmlAuDemarrage()), "des échecs non consécutifs ne doivent pas déclencher le rollback")
        assertTrue(g.fichierInstalle.exists())
    }
}
