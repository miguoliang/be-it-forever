plugins {
    kotlin("jvm") version "2.3.0-RC"
    kotlin("plugin.allopen") version "2.3.0-RC"
    id("io.quarkus") version "3.29.4"
    // Code quality plugins
    id("dev.detekt") version "2.0.0-alpha.1"
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

    // Security - JWT Authentication
    implementation("io.quarkus:quarkus-smallrye-jwt")
    implementation("io.quarkus:quarkus-smallrye-jwt-build")
    implementation("io.quarkus:quarkus-security")

    // Health & Metrics
    implementation("io.quarkus:quarkus-smallrye-health")
    implementation("io.quarkus:quarkus-micrometer-registry-prometheus")

    // Observability - Distributed Tracing
    implementation("io.quarkus:quarkus-opentelemetry")

    // Kotlin
    implementation("org.jetbrains.kotlin:kotlin-stdlib-jdk8")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core")

    // Mutiny Kotlin Coroutines
    implementation("io.smallrye.reactive:mutiny-kotlin")

    // Hypersistence Utils for JSONB support
    implementation("io.hypersistence:hypersistence-utils-hibernate-63:3.7.3")

    // Qute - Quarkus reactive template engine
    implementation("io.quarkus:quarkus-qute")

    // Jackson Kotlin
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin")

    // Testing
    testImplementation("io.quarkus:quarkus-junit5")
    testImplementation("io.rest-assured:rest-assured")
    testImplementation("io.quarkus:quarkus-test-hibernate-reactive-panache")
    testImplementation("org.testcontainers:postgresql")
    testImplementation("io.quarkus:quarkus-test-security-jwt")
}

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(25)
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
        jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_25)
        freeCompilerArgs.addAll("-Xjsr305=strict")
    }
}

// Detekt 2.0.0-alpha.1 configuration
// Note: Custom config disabled due to breaking changes in 2.0
// TODO: Migrate detekt.yml to Detekt 2.0 config format
detekt {
    parallel = true
    ignoreFailures = true
    autoCorrect = false
}

// Configure JVM target for Detekt 2.0.0-alpha.1
tasks.withType<dev.detekt.gradle.Detekt>().configureEach {
    jvmTarget.set("24") // Detekt 2.0.0-alpha.1 supports up to JVM 24
    reports {
        html.required.set(true)
        sarif.required.set(true)
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
