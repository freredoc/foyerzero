package fr.freredoc.foyerzero.maj

import kotlin.test.Test
import kotlin.test.assertFalse
import kotlin.test.assertTrue

/**
 * Tests 1 à 6 du brief. Les tests 2 à 5 sont le cœur du lot : ce sont
 * exactement les URL qu'une comparaison de chaînes (startsWith/contains)
 * laisse passer — vérifié par sabotage, résultat au rapport.
 */
class AllowlistTest {

    private fun autorisee(url: String) = Allowlist.urlAutorisee(url)

    @Test
    fun `test 1 - hote exact accepte`() {
        assertTrue(autorisee("https://freredoc.github.io/foyerzero/index.html"))
        assertTrue(autorisee("https://freredoc.github.io/foyerzero/manifest.json"))
        // Casse indifférente sur schéma et hôte, port https explicite toléré.
        assertTrue(autorisee("HTTPS://FREREDOC.GITHUB.IO/foyerzero/index.html"))
        assertTrue(autorisee("https://freredoc.github.io:443/foyerzero/index.html"))
    }

    @Test
    fun `test 2 - suffixe trompeur rejete`() {
        // L'hôte officiel utilisé comme PRÉFIXE d'un domaine hostile :
        // c'est le test qui prouve qu'on ne fait pas de startsWith.
        assertFalse(autorisee("https://freredoc.github.io.evil.com/foyerzero/index.html"))
        assertFalse(autorisee("https://freredoc.github.io-cdn.evil.com/foyerzero/index.html"))
    }

    @Test
    fun `test 3 - prefixe trompeur rejete`() {
        // L'hôte officiel enfoui dans le CHEMIN d'un domaine hostile.
        assertFalse(autorisee("https://evil.com/freredoc.github.io/foyerzero/index.html"))
        assertFalse(autorisee("https://evil.com/https://freredoc.github.io/foyerzero/"))
    }

    @Test
    fun `test 4 - schema http rejete`() {
        assertFalse(autorisee("http://freredoc.github.io/foyerzero/index.html"))
        assertFalse(autorisee("ftp://freredoc.github.io/foyerzero/index.html"))
        assertFalse(autorisee("file:///foyerzero/index.html"))
    }

    @Test
    fun `test 5 - userinfo rejete`() {
        // L'hôte officiel placé en userinfo : le véritable hôte est evil.com.
        assertFalse(autorisee("https://freredoc.github.io@evil.com/foyerzero/index.html"))
        assertFalse(autorisee("https://freredoc.github.io:mdp@evil.com/foyerzero/index.html"))
    }

    @Test
    fun `test 6 - chemin hors prefixe rejete, y compris par remontee`() {
        assertFalse(autorisee("https://freredoc.github.io/autre-depot/index.html"))
        assertFalse(autorisee("https://freredoc.github.io/index.html"))
        // Préfixe sans sa barre finale : un dépôt jumeau ne passe pas.
        assertFalse(autorisee("https://freredoc.github.io/foyerzero-evil/index.html"))
        // Remontée textuelle, résolue par la normalisation.
        assertFalse(autorisee("https://freredoc.github.io/foyerzero/../autre/index.html"))
        // Remontée encodée, décodée par getPath() après normalisation.
        assertFalse(autorisee("https://freredoc.github.io/foyerzero/%2e%2e/autre/index.html"))
        // Une remontée qui RESTE dans le préfixe est licite.
        assertTrue(autorisee("https://freredoc.github.io/foyerzero/a/../index.html"))
    }

    @Test
    fun `divers - port non standard, relative, illisible - rejetes`() {
        assertFalse(autorisee("https://freredoc.github.io:8443/foyerzero/index.html"))
        assertFalse(autorisee("/foyerzero/index.html"))
        assertFalse(autorisee("freredoc.github.io/foyerzero/index.html"))
        assertFalse(autorisee(""))
        assertFalse(autorisee("https://"))
        assertFalse(autorisee("https://freredoc github.io/foyerzero/"))
    }
}
