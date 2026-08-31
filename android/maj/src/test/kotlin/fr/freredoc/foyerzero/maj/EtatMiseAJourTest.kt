package fr.freredoc.foyerzero.maj

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

/**
 * Ce que le bouton « Vérifier les mises à jour » a le droit de dire.
 *
 * ⚠ CE MODULE EST LE SEUL DES DEUX QUI SOIT COMPILÉ ICI. Sans SDK Android,
 * `settings.gradle.kts` exclut `:app` : la logique de formulation vit donc dans
 * `:maj`, où elle se teste, et `:app` ne garde que le transport.
 */
class EtatMiseAJourTest {

    @Test
    fun `chaque etape a un message, et aucun ne reste vide`() {
        for (etape in EtatMiseAJour.Etape.values()) {
            val texte = EtatMiseAJour.message(etape, 57, null)
            assertTrue(texte.isNotBlank(), "étape $etape sans message")
            // ⚠ AUCUNE ADRESSE NE TRAVERSE LE PONT. `tools/build.js` refuse tout
            // `https?://` dans le HTML produit, et CLAUDE.md §6 interdit de
            // contourner la garde en assemblant l'adresse à l'exécution. Ce qui
            // remonte à la page est une PHRASE, jamais un lien.
            assertFalse(texte.contains("http"), "étape $etape fait remonter une adresse")
        }
    }

    @Test
    fun `a jour nomme le build servi`() {
        assertTrue(EtatMiseAJour.message(EtatMiseAJour.Etape.A_JOUR, 57, null).contains("57"))
    }

    @Test
    fun `installee dit que ca prendra effet au prochain lancement`() {
        // ⚠ CE N'EST PAS UNE PRÉCAUTION DE STYLE : `GestionnaireVersions` ne
        // remplace JAMAIS le jeu à chaud. Sans cette phrase, le joueur croirait
        // le bouton sans effet parce que rien ne change à l'écran.
        val texte = EtatMiseAJour.message(EtatMiseAJour.Etape.INSTALLEE, 58, null)
        assertTrue(texte.contains("prochain lancement"), texte)
    }

    @Test
    fun `chaque refus a son motif, et l absence de refus en a un aussi`() {
        for (refus in CycleMiseAJour.Refus.values()) {
            val motif = EtatMiseAJour.motif(refus)
            assertTrue(motif.isNotBlank(), "refus $refus sans motif")
        }
        // ⚠ `null` EST UN CAS RÉEL : le téléchargement peut échouer avant même
        // qu'un manifeste soit lu, et il n'y a alors aucun refus du cycle à
        // nommer. Rendre « null » à l'écran serait pire que ne rien dire.
        assertFalse(EtatMiseAJour.motif(null).contains("null"))
        assertTrue(EtatMiseAJour.motif(null).isNotBlank())
    }

    @Test
    fun `les motifs sont tous distincts - sinon deux pannes se liraient pareil`() {
        val motifs = CycleMiseAJour.Refus.values().map { EtatMiseAJour.motif(it) } + EtatMiseAJour.motif(null)
        assertEquals(motifs.size, motifs.toSet().size, "deux motifs identiques : $motifs")
    }

    @Test
    fun `le json porte l etape, le build et le message`() {
        val json = EtatMiseAJour.versJson(EtatMiseAJour.Etape.A_JOUR, 57, null)
        assertTrue(json.contains("\"etape\":\"A_JOUR\""), json)
        assertTrue(json.contains("\"build\":57"), json)
        assertTrue(json.contains("\"message\":\""), json)
        // Le build est un NOMBRE, pas une chaîne : la page l'affiche tel quel.
        assertFalse(json.contains("\"build\":\""), json)
    }

    @Test
    fun `le message est echappe - un guillemet ne casse pas le json`() {
        // ⚠ AUCUN MOTIF N'EN CONTIENT AUJOURD'HUI, et c'est justement pourquoi
        // la garde s'écrit maintenant : le jour où l'un en portera un, un JSON
        // cassé ferait taire le bouton sans que rien ne le dise.
        assertEquals("""a\"b""", EtatMiseAJour.echapper("""a"b"""))
        assertEquals("""a\\b""", EtatMiseAJour.echapper("""a\b"""))
        assertEquals("""a\nb""", EtatMiseAJour.echapper("a\nb"))
        // Un caractère de contrôle devient une séquence \u, il ne passe pas brut.
        assertEquals("""a\u0001b""", EtatMiseAJour.echapper("a\u0001b"))
        // Et ce qui n'a pas besoin d'échappement traverse intact — accents compris.
        assertEquals("à jour — build 57", EtatMiseAJour.echapper("à jour — build 57"))
    }
}
