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
            val texte = EtatMiseAJour.message(etape, 57, 58, null)
            assertTrue(texte.isNotBlank(), "étape $etape sans message")
            // ⚠ AUCUNE ADRESSE NE TRAVERSE LE PONT. `tools/build.js` refuse tout
            // `https?://` dans le HTML produit, et CLAUDE.md §6 interdit de
            // contourner la garde en assemblant l'adresse à l'exécution. Ce qui
            // remonte à la page est une PHRASE, jamais un lien.
            assertFalse(texte.contains("http"), "étape $etape fait remonter une adresse")
        }
    }

    @Test
    fun `a jour nomme le build SERVI, pas celui du disque`() {
        // ⚠⚠ C'EST LE DÉFAUT DU 03/09, PRIS PAR SON BOUT LE PLUS COURT. Le message
        // nommait le build du DISQUE : l'écran affichait « À jour — build 70 »
        // sous « v0.67.0 b68 ». Ce qu'on annonce à jour, c'est ce qui TOURNE.
        val texte = EtatMiseAJour.message(EtatMiseAJour.Etape.A_JOUR, 57, 57, null)
        assertTrue(texte.contains("57"), texte)
        assertFalse(EtatMiseAJour.message(EtatMiseAJour.Etape.A_JOUR, 57, 70, null).contains("70"))
    }

    @Test
    fun `une version qui attend une relance n est jamais dite a jour`() {
        // ⚠⚠ LE VERDICT SE DÉCIDE ICI, PAS DANS L'ENVELOPPE. « Rien à télécharger »
        // ne veut pas dire « à jour » : le disque peut porter une version plus
        // récente que celle qui tourne, et c'est exactement ce que le joueur voyait
        // sans pouvoir se l'expliquer.
        assertEquals(
            EtatMiseAJour.Etape.EN_ATTENTE_DE_RELANCE,
            EtatMiseAJour.verdictSansTelechargement(68, 70),
        )
        assertEquals(EtatMiseAJour.Etape.A_JOUR, EtatMiseAJour.verdictSansTelechargement(70, 70))
        // ⚠ ET UN DISQUE EN RETARD RESTE « À JOUR ». Le cas n'arrive pas par le
        // jeu — on n'installe jamais plus vieux — mais rendre « en attente » sur
        // un build inférieur enverrait relancer pour revenir en arrière.
        assertEquals(EtatMiseAJour.Etape.A_JOUR, EtatMiseAJour.verdictSansTelechargement(70, 68))
    }

    @Test
    fun `le message d attente nomme les deux builds et dit quoi faire`() {
        val texte = EtatMiseAJour.message(EtatMiseAJour.Etape.EN_ATTENTE_DE_RELANCE, 68, 70, null)
        assertTrue(texte.contains("70"), texte)
        assertTrue(texte.contains("68"), texte)
        // ⚠ UN CONSTAT NE SUFFIT PAS : c'est le geste qui manquait au joueur.
        assertTrue(texte.contains("relance"), texte)
    }

    @Test
    fun `installee dit que ca prendra effet au prochain lancement`() {
        // ⚠ CE N'EST PAS UNE PRÉCAUTION DE STYLE : `GestionnaireVersions` ne
        // remplace JAMAIS le jeu à chaud. Sans cette phrase, le joueur croirait
        // le bouton sans effet parce que rien ne change à l'écran.
        val texte = EtatMiseAJour.message(EtatMiseAJour.Etape.INSTALLEE, 57, 58, null)
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
    fun `le json porte l etape, les DEUX builds et le message`() {
        val json = EtatMiseAJour.versJson(EtatMiseAJour.Etape.A_JOUR, 57, 58, null)
        assertTrue(json.contains("\"etape\":\"A_JOUR\""), json)
        // ⚠⚠ `build` GARDE SON SENS — LE DISQUE — ET `buildServi` ENTRE À CÔTÉ. La
        // page lit `build` depuis le premier jour ; le renommer l'aurait fait
        // taire sans qu'elle le dise. C'est le COUPLE qui porte l'information.
        assertTrue(json.contains("\"build\":58"), json)
        assertTrue(json.contains("\"buildServi\":57"), json)
        assertTrue(json.contains("\"message\":\""), json)
        // Les builds sont des NOMBRES, pas des chaînes : la page les affiche tels quels.
        assertFalse(json.contains("\"build\":\""), json)
        assertFalse(json.contains("\"buildServi\":\""), json)
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
