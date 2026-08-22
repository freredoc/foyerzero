package fr.freredoc.foyerzero.maj

/**
 * Évaluation d'un cycle de mise à jour : toutes les décisions, aucune E/S.
 * Le téléchargement et l'installation restent à la charge de l'appelant,
 * qui doit respecter l'ordre : évaluer le manifeste AVANT de télécharger,
 * évaluer le contenu AVANT d'installer.
 */
object CycleMiseAJour {

    enum class Refus {
        MANIFESTE_ILLISIBLE,
        URL_INTERDITE,
        RETOUR_EN_ARRIERE,
        EMPREINTE_INVALIDE,
    }

    /**
     * Étape 1 — le manifeste téléchargé autorise-t-il un téléchargement ?
     * Renvoie le manifeste validé, ou le motif de refus.
     */
    fun evaluerManifeste(json: String, buildInstalle: Int): Pair<Manifeste?, Refus?> {
        val manifeste = Manifeste.analyser(json)
            ?: return null to Refus.MANIFESTE_ILLISIBLE
        if (!PolitiqueVersion.miseAJourAcceptable(buildInstalle, manifeste.build)) {
            return null to Refus.RETOUR_EN_ARRIERE
        }
        if (!Allowlist.urlAutorisee(manifeste.url)) {
            return null to Refus.URL_INTERDITE
        }
        return manifeste to null
    }

    /**
     * Étape 2 — le contenu téléchargé peut-il être installé ?
     * null = oui ; sinon le motif de refus (on jette, on garde l'ancien).
     */
    fun evaluerContenu(contenu: ByteArray, manifeste: Manifeste): Refus? =
        if (Empreinte.conforme(contenu, manifeste.sha256)) null else Refus.EMPREINTE_INVALIDE
}
