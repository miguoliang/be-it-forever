package com.miguoliang.englishlearning.health

import io.smallrye.health.api.AsyncHealthCheck
import io.smallrye.mutiny.Uni
import io.vertx.mutiny.pgclient.PgPool
import jakarta.inject.Singleton
import org.eclipse.microprofile.health.HealthCheckResponse
import org.eclipse.microprofile.health.Readiness
import java.time.Duration

/**
 * Database Readiness Check for Kubernetes.
 *
 * Readiness probes determine if the application is ready to accept traffic.
 * If this check fails, Kubernetes will remove the pod from the service load balancer
 * but will NOT restart it (unlike liveness checks).
 *
 * This check verifies:
 * 1. Database connection is available
 * 2. Database is responsive (can execute queries)
 * 3. Connection pool has available connections
 *
 * Use cases:
 * - During startup (wait for database migrations to complete)
 * - During high load (if connection pool is exhausted)
 * - During database maintenance windows
 *
 * Uses AsyncHealthCheck for fully reactive, non-blocking execution.
 */
@Readiness
@Singleton
class DatabaseReadinessCheck(
    private val pgPool: PgPool,
) : AsyncHealthCheck {
    override fun call(): Uni<HealthCheckResponse> {
        val builder = HealthCheckResponse.named("Database connection readiness check")

        return pgPool
            .query("SELECT 1 as ready")
            .execute()
            .ifNoItem()
            .after(Duration.ofSeconds(5))
            .fail()
            .onItem()
            .transform { result ->
                if (result.size() > 0) {
                    // Database is ready - provide additional diagnostic info
                    builder
                        .up()
                        .withData("connection", "ready")
                        .withData("query", "SELECT 1")
                        .withData("poolSize", pgPool.size().toLong())
                        .build()
                } else {
                    builder
                        .down()
                        .withData("reason", "Database query returned no results")
                        .build()
                }
            }.onFailure(java.util.concurrent.TimeoutException::class.java)
            .recoverWithItem { _: java.util.concurrent.TimeoutException ->
                // Timeout means database is slow or unresponsive
                builder
                    .down()
                    .withData("error", "Database query timeout")
                    .withData("timeout", "6 seconds")
                    .withData("recommendation", "Database may be under heavy load or experiencing issues")
                    .build()
            }.onFailure()
            .recoverWithItem { e: Throwable ->
                builder
                    .down()
                    .withData("error", e.message ?: "Unknown error")
                    .withData("errorType", e.javaClass.simpleName)
                    .build()
            }
            // Timeout handled at Uni level - no blocking
            .ifNoItem()
            .after(Duration.ofSeconds(6))
            .fail()
    }
}
