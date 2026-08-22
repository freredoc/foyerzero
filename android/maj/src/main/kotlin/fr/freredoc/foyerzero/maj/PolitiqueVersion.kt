package fr.freredoc.foyerzero.maj

/**
 * Refus des retours en arrière : un manifeste annonçant un build inférieur
 * OU ÉGAL à l'installé est ignoré. Empêche qu'un ancien manifeste rejoué
 * réinstalle une version obsolète.
 */
object PolitiqueVersion {

    fun miseAJourAcceptable(buildInstalle: Int, buildManifeste: Int): Boolean =
        buildManifeste > buildInstalle
}
