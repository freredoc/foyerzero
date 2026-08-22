import groovy.json.JsonSlurper

// Shell Android de Foyer Zéro : une WebView verrouillée qui sert le HTML du
// stockage interne, jamais le réseau. Toutes les décisions de mise à jour
// vivent dans :maj (logique pure, testée en JVM) ; ici, transport et cycle
// de vie seulement.
plugins {
    id("com.android.application")
    kotlin("android")
}

// Source unique de version : package.json à la racine du dépôt. versionCode
// et versionName suivent le jeu, rien n'est saisi deux fois.
val paquet = JsonSlurper().parse(rootProject.file("../package.json")) as Map<*, *>
val versionJeu = paquet["version"] as String
val buildJeu = ((paquet["config"] as Map<*, *>)["build"] as String).toInt()

android {
    namespace = "fr.freredoc.foyerzero"
    compileSdk = 35

    defaultConfig {
        // Package confirmé par Ethan le 22/08/2026.
        applicationId = "fr.freredoc.foyerzero"
        minSdk = 26
        targetSdk = 35
        versionCode = buildJeu
        versionName = versionJeu
    }

    buildTypes {
        release {
            // Fermé d'emblée — pas d'arbitrage ouvert comme sur Archipel.
            isDebuggable = false
            isMinifyEnabled = false
        }
    }

    buildFeatures {
        buildConfig = true
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }
}

// Signature : exclusivement depuis l'environnement (secrets CI) — jamais un
// keystore dans le dépôt, ni en clair ni chiffré. Sans secrets, le build
// release sort non signé : un contributeur sans secrets doit pouvoir
// vérifier que tout compile.
val cheminKeystore = System.getenv("FOYERZERO_KEYSTORE")
if (!cheminKeystore.isNullOrEmpty()) {
    android.signingConfigs.create("release") {
        storeFile = file(cheminKeystore)
        storePassword = System.getenv("FOYERZERO_KEYSTORE_PASSWORD")
        keyAlias = System.getenv("FOYERZERO_KEY_ALIAS")
        keyPassword = System.getenv("FOYERZERO_KEY_PASSWORD")
    }
    android.buildTypes.getByName("release").signingConfig =
        android.signingConfigs.getByName("release")
}

// L'APK embarque une copie du HTML buildé : première ouverture pleinement
// fonctionnelle sans réseau. dist/ n'est jamais commité, donc l'asset est
// copié depuis le build local juste avant compilation, et ignoré par git.
val copierHtmlDansAssets = tasks.register("copierHtmlDansAssets") {
    val source = rootProject.file("../dist/index.html")
    val cible = layout.projectDirectory.file("src/main/assets/index.html").asFile
    inputs.files(source)
    outputs.file(cible)
    doLast {
        require(source.isFile) {
            "dist/index.html absent — lancer « npm run build » à la racine du dépôt d'abord."
        }
        source.copyTo(cible, overwrite = true)
    }
}
tasks.named("preBuild") {
    dependsOn(copierHtmlDansAssets)
}

dependencies {
    implementation(project(":maj"))
}
