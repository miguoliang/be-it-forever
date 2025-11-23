package com.miguoliang.englishlearning.resource

import com.miguoliang.englishlearning.service.StatsService
import jakarta.ws.rs.Consumes
import jakarta.ws.rs.GET
import jakarta.ws.rs.Path
import jakarta.ws.rs.Produces
import jakarta.ws.rs.core.MediaType
import jakarta.ws.rs.core.Response
import org.eclipse.microprofile.config.inject.ConfigProperty

/**
 * REST resource for Statistics endpoints.
 * Access: client role (for /me endpoints).
 *
 * Note: JWT authentication is not yet implemented. For MVP, accountId comes from configuration.
 * TODO: Implement JWT authentication and extract accountId from JWT token 'sub' claim for /me endpoints.
 * See: https://quarkus.io/guides/security-jwt
 */
@Path("/api/v1/accounts")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
class StatsResource(
    private val statsService: StatsService,
    @ConfigProperty(name = "app.default.account.id") private val defaultAccountId: Long,
) {
    /**
     * Get learning statistics for current account.
     * GET /api/v1/accounts/me/stats
     * TODO: Extract accountId from JWT token 'sub' claim
     */
    @GET
    @Path("/me/stats")
    suspend fun getStats(): Response {
        // TODO: Extract accountId from JWT token (see class-level documentation)
        val accountId = defaultAccountId

        val stats = statsService.getStats(accountId)
        return Response.ok(stats).build()
    }
}
