plugins {
    kotlin("jvm") version "2.2.21"
    kotlin("plugin.allopen") version "2.2.21"
    id("io.quarkus") version "3.29.4"
    // Code quality plugins
    id("io.gitlab.arturbosch.detekt") version "1.23.7"
    id("org.jlleitschuh.gradle.ktlint") version "12.1.2"
}

group = "com.miguoliang"
version = "0.0.1-SNAPSHOT"
description = "English Learning"

repositories {
    mavenCentral()
    mavenLocal()
}

val quarkusPlatformGroupId: String by project
val quarkusPlatformArtifactId: String by project
val quarkusPlatformVersion: String by project

dependencies {
    // Quarkus BOM
    implementation(enforcedPlatform("io.quarkus.platform:quarkus-bom:3.29.4"))

    // Quarkus Core
    implementation("io.quarkus:quarkus-kotlin")
    implementation("io.quarkus:quarkus-arc")

    // RESTEasy Reactive (JAX-RS)
    implementation("io.quarkus:quarkus-rest")
    implementation("io.quarkus:quarkus-rest-jackson")

    // Reactive PostgreSQL with Panache
    implementation("io.quarkus:quarkus-reactive-pg-client")
    implementation("io.quarkus:quarkus-hibernate-reactive-panache")
    implementation("io.quarkus:quarkus-hibernate-reactive-panache-kotlin")

    // Flyway
    implementation("io.quarkus:quarkus-flyway")
    implementation("io.quarkus:quarkus-jdbc-postgresql")

    // Validation
    implementation("io.quarkus:quarkus-hibernate-validator")

    // Health & Metrics
    implementation("io.quarkus:quarkus-smallrye-health")

    // Kotlin
    implementation("org.jetbrains.kotlin:kotlin-stdlib-jdk8")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core")

    // Mutiny Kotlin Coroutines
    implementation("io.smallrye.reactive:mutiny-kotlin")

    // Hypersistence Utils for JSONB support
    implementation("io.hypersistence:hypersistence-utils-hibernate-63:3.7.3")

    // FreeMarker template engine
    implementation("org.freemarker:freemarker:2.3.32")

    // Jackson Kotlin
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin")

    // Testing
    testImplementation("io.quarkus:quarkus-junit5")
    testImplementation("io.rest-assured:rest-assured")
    testImplementation("io.quarkus:quarkus-test-hibernate-reactive-panache")
    testImplementation("org.testcontainers:postgresql")
}

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

tasks.withType<Test> {
    systemProperty("java.util.logging.manager", "org.jboss.logmanager.LogManager")
}

allOpen {
    annotation("jakarta.ws.rs.Path")
    annotation("jakarta.enterprise.context.ApplicationScoped")
    annotation("jakarta.persistence.Entity")
    annotation("io.quarkus.test.junit.QuarkusTest")
}

kotlin {
    compilerOptions {
        jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_21)
        freeCompilerArgs.addAll("-Xjsr305=strict")
    }
}

// Detekt configuration
detekt {
    buildUponDefaultConfig = true
    allRules = false
    config.setFrom("$projectDir/config/detekt/detekt.yml")
    baseline = file("$projectDir/config/detekt/baseline.xml")
    parallel = true
    ignoreFailures = true
    autoCorrect = false
}

dependencies {
    detektPlugins("io.gitlab.arturbosch.detekt:detekt-formatting:1.23.7")
}

tasks.withType<io.gitlab.arturbosch.detekt.Detekt>().configureEach {
    jvmTarget = "21"
    reports {
        html.required.set(true)
        xml.required.set(true)
        sarif.required.set(true)
        md.required.set(true)
    }
}

// Ktlint configuration
ktlint {
    version.set("1.5.0")
    android.set(false)
    ignoreFailures.set(false)
    reporters {
        reporter(org.jlleitschuh.gradle.ktlint.reporter.ReporterType.PLAIN)
        reporter(org.jlleitschuh.gradle.ktlint.reporter.ReporterType.CHECKSTYLE)
        reporter(org.jlleitschuh.gradle.ktlint.reporter.ReporterType.HTML)
    }
    filter {
        exclude("**/generated/**")
        include("**/kotlin/**")
    }
}

// Remove compilation dependencies from ktlint tasks for faster feedback
tasks.matching { it.name.contains("Ktlint") || it.name.startsWith("ktlint") }.configureEach {
    dependsOn.removeIf { dep ->
        val name = (dep as? Task)?.name ?: dep.toString()
        name.contains("compile", ignoreCase = true) ||
            name.contains("process", ignoreCase = true) ||
            name.contains("classes", ignoreCase = true) ||
            name.contains("jar", ignoreCase = true)
    }
}

// Quality check task
tasks.register("qualityCheck") {
    group = "verification"
    description = "Run all code quality checks"
    dependsOn("detekt", "ktlintCheck")
}
