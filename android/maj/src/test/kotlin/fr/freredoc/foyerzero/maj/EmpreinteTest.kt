package fr.freredoc.foyerzero.maj

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

/** Test 7 du brief : un octet modifié dans le HTML → installation refusée. */
class EmpreinteTest {

    @Test
    fun `vecteur connu - sha256 de la chaine vide et de abc`() {
        // Vecteurs publics FIPS 180-2 : le calcul lui-même est vérifié, pas
        // seulement la comparaison.
        assertEquals(
            "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            Empreinte.sha256Hex(ByteArray(0)),
        )
        assertEquals(
            "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
            Empreinte.sha256Hex("abc".toByteArray()),
        )
    }

    @Test
    fun `test 7 - un octet modifie vaut refus`() {
        val html = "<!doctype html><title>Foyer Zéro</title>".toByteArray()
        val empreinte = Empreinte.sha256Hex(html)
        assertTrue(Empreinte.conforme(html, empreinte), "le contenu intact devrait passer")
        assertTrue(Empreinte.conforme(html, empreinte.uppercase()), "la casse de l'empreinte est indifférente")

        val altere = html.copyOf().also { it[10] = (it[10] + 1).toByte() }
        assertFalse(Empreinte.conforme(altere, empreinte), "un octet modifié devrait être refusé")

        val tronque = html.copyOf(html.size - 1)
        assertFalse(Empreinte.conforme(tronque, empreinte), "un contenu tronqué devrait être refusé")
    }
}
