package com.miguoliang.englishlearning.resource

import com.miguoliang.englishlearning.service.JwtService
import com.miguoliang.englishlearning.service.StatsService
import io.quarkus.security.Authenticated
import io.quarkus.security.identity.SecurityIdentity
import jakarta.inject.Inject
import jakarta.ws.rs.Consumes
import jakarta.ws.rs.GET
import jakarta.ws.rs.Path
import jakarta.ws.rs.Produces
import jakarta.ws.rs.core.MediaType
import jakarta.ws.rs.core.Response

/**
 * REST resource for Statistics endpoints.
 *
 * Authentication & Authorization:
 * - All endpoints require JWT authentication
 * - AccountId is extracted from JWT token 'sub' claim
 * - All users can access their own statistics
 *
 * JWT Token Requirements:
 * - 'sub' claim: Must contain the account ID (numeric string)
 * - 'groups' claim: Must contain 'client' role at minimum
 * - 'iss' claim: Must match configured issuer
 * - 'exp' claim: Token must not be expired
 */
@Path("/api/v1/accounts")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
class StatsResource(
    private val statsService: StatsService,
    private val jwtService: JwtService,
) {
    @Inject
    lateinit var securityIdentity: SecurityIdentity

    /**
     * Get learning statistics for current account.
     * GET /api/v1/accounts/me/stats
     *
     * Requires: JWT authentication (accountId extracted from token 'sub' claim)
     */
    @GET
    @Path("/me/stats")
    @Authenticated
    suspend fun getStats(): Response {
        val accountId = jwtService.extractAccountId(securityIdentity)
        val stats = statsService.getStats(accountId)
        return Response.ok(stats).build()
    }
}
