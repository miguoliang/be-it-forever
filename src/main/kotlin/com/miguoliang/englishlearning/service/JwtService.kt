package com.miguoliang.englishlearning.service

import com.miguoliang.englishlearning.exception.ForbiddenException
import com.miguoliang.englishlearning.exception.UnauthorizedException
import io.quarkus.security.identity.SecurityIdentity
import jakarta.inject.Singleton
import org.eclipse.microprofile.jwt.JsonWebToken

/**
 * Service for JWT token operations.
 * Provides utilities to extract account information and validate access from JWT tokens.
 *
 * JWT Token Structure Expected:
 * - 'sub' claim: Account ID as string (must be convertible to Long)
 * - 'groups' or 'roles' claim: Array of role strings (e.g., ["client"], ["client", "operator"])
 * - 'iss' claim: Token issuer (validated by configuration)
 * - 'exp' claim: Expiration timestamp (validated automatically)
 */
@Singleton
class JwtService {
    /**
     * Extract account ID from JWT token 'sub' claim.
     *
     * The 'sub' (subject) claim in the JWT token must contain the account ID
     * as a string representation of a Long value.
     *
     * @param securityIdentity The security identity containing the JWT principal
     * @return Account ID as Long
     * @throws UnauthorizedException if token is invalid, missing 'sub' claim, or 'sub' is not a valid Long
     *
     * Example JWT payload:
     * ```json
     * {
     *   "sub": "12345",
     *   "groups": ["client"],
     *   "iss": "https://auth.englishlearning.com",
     *   "exp": 1735920000
     * }
     * ```
     */
    fun extractAccountId(securityIdentity: SecurityIdentity): Long {
        // Get the JWT from the security identity
        val jwt =
            securityIdentity.principal as? JsonWebToken
                ?: throw UnauthorizedException("Invalid or missing JWT token")

        // Extract the 'sub' claim
        val sub =
            jwt.subject
                ?: throw UnauthorizedException("JWT token missing 'sub' claim")

        // Parse to Long (account ID)
        return try {
            sub.toLong()
        } catch (e: NumberFormatException) {
            throw UnauthorizedException(
                "Invalid account ID in JWT 'sub' claim: $sub. Expected numeric value.",
            )
        }
    }

    /**
     * Check if the authenticated user has operator role.
     *
     * Operator role grants elevated privileges to access any account's data.
     *
     * @param securityIdentity The security identity
     * @return true if user has 'operator' role, false otherwise
     */
    fun hasOperatorRole(securityIdentity: SecurityIdentity): Boolean = securityIdentity.hasRole("operator")

    /**
     * Check if the authenticated user has client role.
     *
     * Client role is the standard role for authenticated users.
     *
     * @param securityIdentity The security identity
     * @return true if user has 'client' role, false otherwise
     */
    fun hasClientRole(securityIdentity: SecurityIdentity): Boolean = securityIdentity.hasRole("client")

    /**
     * Validate that the user can access the specified account.
     *
     * Access is granted if either:
     * 1. The user owns the account (accountId matches JWT 'sub' claim), OR
     * 2. The user has 'operator' role
     *
     * @param securityIdentity The security identity
     * @param accountId The account ID to check access for
     * @throws ForbiddenException if user doesn't own the account and doesn't have operator role
     * @throws UnauthorizedException if JWT is invalid
     *
     * Example usage in a Resource:
     * ```kotlin
     * @GET
     * @Path("/{accountId}/cards")
     * @RolesAllowed("operator")
     * suspend fun listAccountCards(@PathParam("accountId") accountId: Long): Response {
     *     // Operator can access any account, but let's validate anyway
     *     jwtService.validateAccountAccess(securityIdentity, accountId)
     *     // ... proceed with business logic
     * }
     * ```
     */
    fun validateAccountAccess(
        securityIdentity: SecurityIdentity,
        accountId: Long,
    ) {
        val userAccountId = extractAccountId(securityIdentity)
        val isOperator = hasOperatorRole(securityIdentity)

        if (userAccountId != accountId && !isOperator) {
            throw ForbiddenException(
                "Access denied: Account $accountId does not belong to user $userAccountId",
            )
        }
    }

    /**
     * Get all roles from the JWT token.
     *
     * @param securityIdentity The security identity
     * @return Set of role names
     */
    fun getRoles(securityIdentity: SecurityIdentity): Set<String> = securityIdentity.roles
}
