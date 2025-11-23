package com.miguoliang.englishlearning.controller

import com.miguoliang.englishlearning.service.StatsService
import jakarta.ws.rs.*
import jakarta.ws.rs.core.MediaType
import jakarta.ws.rs.core.Response

/**
 * REST controller for Statistics endpoints.
 * Access: client role (for /me endpoints).
 *
 * Note: JWT authentication is not yet implemented. For MVP, accountId is extracted from path.
 * TODO: Extract accountId from JWT token 'sub' claim for /me endpoints.
 */
@Path("/api/v1/accounts")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
class StatsController(
    private val statsService: StatsService,
) {
    /**
     * Get learning statistics for current account.
     * GET /api/v1/accounts/me/stats
     * TODO: Extract accountId from JWT token 'sub' claim
     */
    @GET
    @Path("/me/stats")
    suspend fun getStats(): Response {
        // TODO: Extract accountId from JWT token
        val accountId = 1L // Placeholder

        val stats = statsService.getStats(accountId)
        return Response.ok(stats).build()
    }
}
