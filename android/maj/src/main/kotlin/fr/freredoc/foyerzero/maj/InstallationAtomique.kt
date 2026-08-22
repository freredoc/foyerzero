package fr.freredoc.foyerzero.maj

import java.io.File
import java.nio.file.Files
import java.nio.file.StandardCopyOption

/**
 * Écriture atomique : le contenu (déjà vérifié) est écrit dans un fichier
 * temporaire DU MÊME RÉPERTOIRE, puis renommé sur la cible. Jamais d'écriture
 * en place sur le fichier servi : une interruption entre les deux étapes
 * laisse l'ancienne version intacte.
 *
 * Les deux étapes sont exposées séparément pour que l'atomicité soit
 * PROUVABLE en test (test 8) : on peut s'interrompre entre elles et observer
 * la cible.
 */
object InstallationAtomique {

    /** Étape 1 : écrit le contenu dans un temporaire à côté de la cible. */
    fun ecrireTemporaire(contenu: ByteArray, cible: File): File {
        val repertoire = cible.absoluteFile.parentFile
            ?: throw IllegalArgumentException("cible sans répertoire parent : $cible")
        repertoire.mkdirs()
        val temporaire = File.createTempFile("${cible.name}.", ".tmp", repertoire)
        temporaire.writeBytes(contenu)
        return temporaire
    }

    /** Étape 2 : bascule le temporaire sur la cible, atomiquement. */
    fun finaliser(temporaire: File, cible: File) {
        Files.move(
            temporaire.toPath(),
            cible.toPath(),
            StandardCopyOption.REPLACE_EXISTING,
            StandardCopyOption.ATOMIC_MOVE,
        )
    }

    /** Le cycle complet ; nettoie le temporaire si la bascule échoue. */
    fun installer(contenu: ByteArray, cible: File) {
        val temporaire = ecrireTemporaire(contenu, cible)
        try {
            finaliser(temporaire, cible)
        } finally {
            temporaire.delete() // sans effet si la bascule a réussi
        }
    }
}
