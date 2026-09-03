package fr.freredoc.foyerzero.maj

/**
 * Où en est la vérification de mise à jour — ce que l'écran Options affiche.
 *
 * ⚠⚠ POURQUOI CETTE CLASSE EXISTE. Ethan, le 31/08 : « auto update pour foyer
 * zéro. Bouton vérifier maj dans option. » L'auto-update EXISTE depuis
 * longtemps — `MiseAJour.verifierEnArrierePlan` part à chaque lancement — mais
 * il est entièrement MUET : rien ne dit s'il a trouvé quelque chose, rien ne dit
 * qu'il a échoué, et rien ne permet de le relancer sans tuer l'application. Un
 * bouton a besoin de répondre ; il fallait donc d'abord une réponse.
 *
 * ⚠ ELLE EST DANS `:maj` ET PAS DANS `:app`, ET C'EST DÉLIBÉRÉ. Sans SDK
 * Android, `settings.gradle.kts` EXCLUT `:app` : tout ce qui vit là-bas n'est
 * compilé par personne ici, et la CI ne le voit pas non plus (CLAUDE.md §6, « les
 * types de package.json »). Ce qui se décide et se formule vit donc dans le
 * module testé en JVM ; `:app` ne garde que le transport et le pont.
 *
 * ⚠ AUCUNE E/S, AUCUNE DÉPENDANCE ANDROID. Comme le reste de `:maj`.
 */
object EtatMiseAJour {

    /** Les états qu'une vérification peut traverser, du repos au verdict. */
    enum class Etape {
        /** Rien n'a encore été demandé depuis le lancement. */
        JAMAIS,

        /** Une vérification est partie et n'a pas rendu son verdict. */
        EN_COURS,

        /** Le manifeste a été lu : la version SERVIE est la plus récente. */
        A_JOUR,

        /** Une version plus récente a été installée ; elle sert au prochain lancement. */
        INSTALLEE,

        // ⚠⚠ CET ÉTAT MANQUAIT, ET SON ABSENCE FAISAIT MENTIR L'ÉCRAN. Une
        // version plus récente peut être INSTALLÉE sur le disque pendant que la
        // page qui tourne est l'ancienne — c'est le fonctionnement voulu, le jeu
        // n'est jamais remplacé à chaud. Mais la vérification SUIVANTE lisait
        // alors le disque, y trouvait le build du manifeste, et concluait
        // `A_JOUR`. Ethan, le 03/09 : « le jeu détecte la mise à jour mais refuse
        // de l'implanter » — l'écran affichait « v0.67.0 b68 » et, deux lignes
        // plus bas, « À jour — build 70 ». Les deux nombres se contredisaient et
        // rien n'expliquait l'écart.
        //
        // ⚠ IL SE DISTINGUE D'`INSTALLEE`, ET LES DEUX SONT UTILES. `INSTALLEE`
        // dit « je viens de l'installer » ; celui-ci dit « elle est là depuis un
        // moment et tu ne l'as toujours pas lancée ». Les confondre ferait
        // réafficher « je viens de l'installer » à chaque vérification.
        EN_ATTENTE_DE_RELANCE,

        /** La vérification n'a pas abouti — réseau, manifeste, empreinte. */
        ECHOUEE,
    }

    /**
     * Ce que l'écran affiche, en français, sans jamais nommer une adresse.
     *
     * ⚠⚠ AUCUNE URL NE REMONTE JUSQU'À LA PAGE, ET C'EST UNE CONTRAINTE DURE.
     * `tools/build.js` refuse tout `https?://` dans le HTML produit, et
     * CLAUDE.md §6 interdit de contourner la garde en assemblant l'adresse à
     * l'exécution. Le manifeste et son adresse restent donc côté Kotlin ; ce qui
     * traverse le pont, c'est une PHRASE et un numéro de build, jamais un lien.
     *
     * ⚠⚠ DEUX BUILDS, ET C'EST TOUT LE CORRECTIF DU 03/09. Le message ne prenait
     * que celui du DISQUE et l'annonçait comme « à jour » ; il prend maintenant
     * aussi celui qui TOURNE, et quand les deux diffèrent il le DIT. Un seul
     * nombre ne peut pas décrire deux fichiers.
     *
     * @param etape où en est la vérification
     * @param buildServi le build de la page qui tourne, ou 0 s'il est inconnu
     * @param buildInstalle le build posé sur le disque, ou 0 s'il est inconnu
     * @param refus le motif quand la vérification a échoué, sinon `null`
     */
    fun message(
        etape: Etape,
        buildServi: Int,
        buildInstalle: Int,
        refus: CycleMiseAJour.Refus?,
    ): String = when (etape) {
        Etape.JAMAIS -> "Aucune vérification depuis le lancement."
        Etape.EN_COURS -> "Vérification en cours…"
        Etape.A_JOUR -> "À jour — build $buildServi."
        // ⚠ « AU PROCHAIN LANCEMENT » N'EST PAS UNE PRÉCAUTION DE STYLE : c'est
        // ce que fait vraiment `GestionnaireVersions`. Le jeu en cours n'est
        // JAMAIS remplacé à chaud, sans quoi la partie ouverte perdrait son
        // contexte au milieu d'un geste. Le dire évite qu'on croie le bouton
        // sans effet parce que rien ne change à l'écran.
        Etape.INSTALLEE -> "Mise à jour installée — elle sera active au prochain lancement."
        // ⚠ LE MESSAGE NOMME LES DEUX NOMBRES, et il dit quoi FAIRE. « Build 70
        // installé » seul laisserait le joueur devant le même écart inexpliqué
        // que le 03/09 ; c'est « relance le jeu » qui transforme un constat en
        // geste.
        Etape.EN_ATTENTE_DE_RELANCE ->
            "Build $buildInstalle installé — relance le jeu pour l'activer (build $buildServi en cours)."
        Etape.ECHOUEE -> "Échec : ${motif(refus)}."
    }

    /**
     * Le verdict d'une vérification qui n'a rien eu à télécharger.
     *
     * ⚠⚠ « RIEN À TÉLÉCHARGER » NE VEUT PAS DIRE « À JOUR », ET C'EST LE DÉFAUT
     * DU 03/09 EN UNE PHRASE. Le manifeste refusé pour retour en arrière est le
     * cas NORMAL quand le disque porte déjà le build publié — mais le disque
     * n'est pas ce qui tourne. Si une version plus récente y attend une relance,
     * le verdict est `EN_ATTENTE_DE_RELANCE`, pas `A_JOUR`.
     *
     * ⚠ ELLE EST ICI, DANS `:maj`, ET PAS DANS `:app`. Sans SDK Android,
     * `settings.gradle.kts` EXCLUT `:app` : une décision écrite là-bas n'est
     * compilée par personne ici et la CI ne la voit pas non plus. Ce qui se
     * décide vit dans le module testé en JVM.
     */
    fun verdictSansTelechargement(buildServi: Int, buildInstalle: Int): Etape =
        if (buildInstalle > buildServi) Etape.EN_ATTENTE_DE_RELANCE else Etape.A_JOUR

    /**
     * Le motif d'un refus, en clair.
     *
     * ⚠ `null` EST UN CAS RÉEL, PAS UN OUBLI : la vérification échoue aussi
     * quand rien n'a pu être téléchargé, et il n'y a alors aucun refus du cycle
     * à nommer — le manifeste n'a même pas été lu.
     */
    fun motif(refus: CycleMiseAJour.Refus?): String = when (refus) {
        CycleMiseAJour.Refus.MANIFESTE_ILLISIBLE -> "le manifeste publié est illisible"
        CycleMiseAJour.Refus.URL_INTERDITE -> "l'adresse annoncée n'est pas autorisée"
        CycleMiseAJour.Refus.RETOUR_EN_ARRIERE -> "la version publiée est plus ancienne que celle installée"
        CycleMiseAJour.Refus.EMPREINTE_INVALIDE -> "l'empreinte du fichier téléchargé ne correspond pas"
        null -> "aucune réponse du réseau"
    }

    /**
     * L'état, sérialisé pour le pont JavaScript.
     *
     * ⚠ ÉCRIT À LA MAIN, ET C'EST ASSUMÉ : `:maj` n'a aucune dépendance, pas même
     * un analyseur JSON — `Manifeste.analyser` en fait autant de son côté. Deux
     * champs et une chaîne échappée ne justifient pas d'en faire entrer une.
     *
     * ⚠⚠ `build` GARDE SON SENS — LE DISQUE — ET `buildServi` ENTRE À CÔTÉ. Le
     * renommer aurait fait taire la page sans qu'elle le dise : elle lit `build`
     * depuis le premier jour, et un champ absent y devient `null`. C'est le
     * COUPLE qui porte l'information, pas l'un des deux.
     *
     * ⚠ ET LE MESSAGE EST ÉCHAPPÉ, sans exception. Il porte des mots français
     * choisis ici, donc aucun guillemet aujourd'hui ; le jour où un motif en
     * contiendra un, un JSON cassé ferait taire le bouton sans rien dire.
     */
    fun versJson(
        etape: Etape,
        buildServi: Int,
        buildInstalle: Int,
        refus: CycleMiseAJour.Refus?,
    ): String {
        val texte = echapper(message(etape, buildServi, buildInstalle, refus))
        return """{"etape":"${etape.name}","build":$buildInstalle,"buildServi":$buildServi,"message":"$texte"}"""
    }

    /** L'échappement JSON minimal : ce que cette classe peut produire. */
    fun echapper(texte: String): String {
        val sortie = StringBuilder(texte.length + 8)
        for (c in texte) {
            when {
                c == '"' -> sortie.append("\\\"")
                c == '\\' -> sortie.append("\\\\")
                c == '\n' -> sortie.append("\\n")
                c == '\r' -> sortie.append("\\r")
                c == '\t' -> sortie.append("\\t")
                c < ' ' -> sortie.append(String.format("\\u%04x", c.code))
                else -> sortie.append(c)
            }
        }
        return sortie.toString()
    }
}
