// Projet Android de Foyer Zéro — deux modules :
//   :maj  logique pure de mise à jour (Kotlin JVM, zéro dépendance Android),
//         testable partout en tests unitaires JVM, sans émulateur ;
//   :app  shell WebView. Nécessite le SDK Android : sans lui, le module est
//         exclu pour que les tests de :maj restent exécutables sur toute
//         machine (la CI, elle, a le SDK et configure les deux).
pluginManagement {
    repositories {
        mavenCentral()
        google()
        gradlePluginPortal()
    }
    // Versions de plugins centralisées : un seul endroit, un seul classloader.
    plugins {
        id("com.android.application") version "8.7.3"
        kotlin("jvm") version "2.0.21"
        kotlin("android") version "2.0.21"
    }
}

dependencyResolutionManagement {
    repositories {
        mavenCentral()
        google()
    }
}

rootProject.name = "foyerzero-android"

include(":maj")

val proprietesLocales = File(rootDir, "local.properties")
val sdkDisponible = System.getenv("ANDROID_HOME") != null ||
    System.getenv("ANDROID_SDK_ROOT") != null ||
    (proprietesLocales.exists() && proprietesLocales.readLines().any { it.trim().startsWith("sdk.dir=") })

if (sdkDisponible) {
    include(":app")
} else {
    logger.lifecycle("SDK Android absent : module :app exclu, seuls les tests JVM de :maj sont disponibles.")
}
