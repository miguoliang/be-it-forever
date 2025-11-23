package com.miguoliang.englishlearning.health

import io.smallrye.health.api.AsyncHealthCheck
import io.smallrye.mutiny.Uni
import io.vertx.mutiny.pgclient.PgPool
import jakarta.inject.Singleton
import org.eclipse.microprofile.health.HealthCheckResponse
import org.eclipse.microprofile.health.Liveness
import java.time.Duration

/**
 * Database Liveness Check for Kubernetes.
 *
 * Liveness probes determine if the application is alive and functioning.
 * If this check fails repeatedly, Kubernetes will restart the pod.
 *
 * This check performs a simple database query to verify the connection is alive.
 * Uses AsyncHealthCheck for fully reactive, non-blocking execution.
 */
@Liveness
@Singleton
class DatabaseLivenessCheck(
    private val pgPool: PgPool,
) : AsyncHealthCheck {
    override fun call(): Uni<HealthCheckResponse> {
        val builder = HealthCheckResponse.named("Database connection liveness check")

        return pgPool
            .query("SELECT 1")
            .execute()
            .ifNoItem()
            .after(Duration.ofSeconds(2))
            .fail()
            .onItem()
            .transform { result ->
                // If we got a result, database is alive
                if (result.size() > 0) {
                    builder
                        .up()
                        .withData("connection", "alive")
                        .withData("query", "SELECT 1")
                        .build()
                } else {
                    builder
                        .down()
                        .withData("reason", "Query returned no results")
                        .build()
                }
            }.onFailure()
            .recoverWithItem { e ->
                builder
                    .down()
                    .withData("error", e.message ?: "Unknown error")
                    .withData("errorType", e.javaClass.simpleName)
                    .build()
            }
            // Timeout handled at Uni level - no blocking
            .ifNoItem()
            .after(Duration.ofSeconds(3))
            .fail()
    }
}
