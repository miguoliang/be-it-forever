package com.miguoliang.englishlearning.util

import io.smallrye.jwt.build.Jwt
import java.time.Instant
import java.time.temporal.ChronoUnit

/**
 * Utilities for generating JWT tokens in tests.
 *
 * This class uses SmallRye JWT Build to create test tokens that can be used
 * in integration tests without needing a real authentication provider.
 */
object JwtTestUtils {
    private const val ISSUER = "https://test.englishlearning.com"
    private const val DEFAULT_EXPIRATION_HOURS = 1L

    /**
     * Create a JWT token for a client user.
     *
     * Client users have the 'client' role and can access their own data via /me endpoints.
     *
     * @param accountId The account ID to use in the 'sub' claim
     * @param expirationHours How long the token should be valid (default: 1 hour)
     * @return JWT token as a string
     *
     * Example usage:
     * ```kotlin
     * val token = JwtTestUtils.createClientToken(123)
     * given()
     *     .header("Authorization", "Bearer $token")
     *     .when().get("/api/v1/accounts/me/cards")
     *     .then().statusCode(200)
     * ```
     */
    fun createClientToken(
        accountId: Long,
        expirationHours: Long = DEFAULT_EXPIRATION_HOURS,
    ): String =
        Jwt
            .issuer(ISSUER)
            .subject(accountId.toString())
            .groups(setOf("client"))
            .expiresAt(Instant.now().plus(expirationHours, ChronoUnit.HOURS))
            .issuedAt(Instant.now())
            .sign()

    /**
     * Create a JWT token for an operator user.
     *
     * Operator users have both 'client' and 'operator' roles.
     * They can access their own data and any other account's data.
     *
     * @param accountId The account ID to use in the 'sub' claim
     * @param expirationHours How long the token should be valid (default: 1 hour)
     * @return JWT token as a string
     *
     * Example usage:
     * ```kotlin
     * val token = JwtTestUtils.createOperatorToken(1)
     * given()
     *     .header("Authorization", "Bearer $token")
     *     .when().get("/api/v1/accounts/999/cards")  // Access other account
     *     .then().statusCode(200)
     * ```
     */
    fun createOperatorToken(
        accountId: Long,
        expirationHours: Long = DEFAULT_EXPIRATION_HOURS,
    ): String =
        Jwt
            .issuer(ISSUER)
            .subject(accountId.toString())
            .groups(setOf("client", "operator"))
            .expiresAt(Instant.now().plus(expirationHours, ChronoUnit.HOURS))
            .issuedAt(Instant.now())
            .sign()

    /**
     * Create an expired JWT token for testing expiration handling.
     *
     * @param accountId The account ID to use in the 'sub' claim
     * @return Expired JWT token as a string
     */
    fun createExpiredToken(accountId: Long): String =
        Jwt
            .issuer(ISSUER)
            .subject(accountId.toString())
            .groups(setOf("client"))
            .expiresAt(Instant.now().minus(1, ChronoUnit.HOURS))
            .issuedAt(Instant.now().minus(2, ChronoUnit.HOURS))
            .sign()

    /**
     * Create a JWT token with invalid issuer for testing issuer validation.
     *
     * @param accountId The account ID to use in the 'sub' claim
     * @return JWT token with invalid issuer
     */
    fun createTokenWithInvalidIssuer(accountId: Long): String =
        Jwt
            .issuer("https://invalid-issuer.com")
            .subject(accountId.toString())
            .groups(setOf("client"))
            .expiresAt(Instant.now().plus(1, ChronoUnit.HOURS))
            .issuedAt(Instant.now())
            .sign()

    /**
     * Create a JWT token with custom claims for advanced testing.
     *
     * @param accountId The account ID to use in the 'sub' claim
     * @param roles Set of role names
     * @param additionalClaims Map of additional claims to include
     * @return JWT token as a string
     */
    fun createCustomToken(
        accountId: Long,
        roles: Set<String>,
        additionalClaims: Map<String, Any> = emptyMap(),
    ): String {
        var builder =
            Jwt
                .issuer(ISSUER)
                .subject(accountId.toString())
                .groups(roles)
                .expiresAt(Instant.now().plus(DEFAULT_EXPIRATION_HOURS, ChronoUnit.HOURS))
                .issuedAt(Instant.now())

        additionalClaims.forEach { (key, value) ->
            builder = builder.claim(key, value)
        }

        return builder.sign()
    }
}
