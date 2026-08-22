package fr.freredoc.foyerzero.maj

import java.security.MessageDigest

/** Vérification d'empreinte SHA-256 du HTML téléchargé, AVANT installation. */
object Empreinte {

    /** SHA-256 en hexadécimal minuscule. */
    fun sha256Hex(octets: ByteArray): String =
        MessageDigest.getInstance("SHA-256").digest(octets)
            .joinToString("") { "%02x".format(it) }

    /**
     * Le contenu correspond-il à l'empreinte annoncée par le manifeste ?
     * Comparaison à temps constant, par principe.
     */
    fun conforme(octets: ByteArray, attendue: String): Boolean =
        MessageDigest.isEqual(
            sha256Hex(octets).toByteArray(Charsets.US_ASCII),
            attendue.lowercase().toByteArray(Charsets.US_ASCII),
        )
}
