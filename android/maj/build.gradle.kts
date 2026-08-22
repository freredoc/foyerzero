// Logique pure de mise à jour : allowlist, manifeste, empreinte, anti-retour,
// installation atomique, rollback. Kotlin JVM, zéro dépendance runtime —
// exécutable et testable sans SDK Android ni émulateur.
plugins {
    kotlin("jvm")
}

// Bytecode 17, compilé par la JVM courante (>= 17) : aucun toolchain à
// provisionner, le module se construit avec le JDK présent, ici comme en CI.
java {
    sourceCompatibility = JavaVersion.VERSION_17
    targetCompatibility = JavaVersion.VERSION_17
}

kotlin {
    compilerOptions {
        jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17)
    }
}

dependencies {
    testImplementation(kotlin("test-junit"))
    testImplementation("junit:junit:4.13.2")
}

tasks.test {
    testLogging {
        events("passed", "failed", "skipped")
    }
}
