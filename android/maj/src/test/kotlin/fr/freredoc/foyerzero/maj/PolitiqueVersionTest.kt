package fr.freredoc.foyerzero.maj

import kotlin.test.Test
import kotlin.test.assertFalse
import kotlin.test.assertTrue

/** Test 9 du brief : un build inférieur OU ÉGAL à l'installé est ignoré. */
class PolitiqueVersionTest {

    @Test
    fun `test 9 - anti-retour`() {
        assertFalse(PolitiqueVersion.miseAJourAcceptable(buildInstalle = 5, buildManifeste = 4), "un build inférieur doit être ignoré")
        assertFalse(PolitiqueVersion.miseAJourAcceptable(buildInstalle = 5, buildManifeste = 5), "un build égal doit être ignoré")
        assertTrue(PolitiqueVersion.miseAJourAcceptable(buildInstalle = 5, buildManifeste = 6), "un build strictement supérieur doit passer")
        assertTrue(PolitiqueVersion.miseAJourAcceptable(buildInstalle = 0, buildManifeste = 1))
    }
}
