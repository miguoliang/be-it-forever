package com.miguoliang.englishlearning.resource

import com.miguoliang.englishlearning.util.JwtTestUtils
import io.quarkus.test.junit.QuarkusTest
import io.restassured.RestAssured.given
import io.restassured.http.ContentType
import org.junit.jupiter.api.Test

/**
 * Integration tests for JWT authentication in AccountCardResource.
 *
 * These tests verify that:
 * - /me endpoints require valid JWT authentication
 * - AccountId is correctly extracted from JWT 'sub' claim
 * - Operator endpoints require operator role
 * - Invalid/missing tokens return appropriate HTTP status codes
 */
@QuarkusTest
class AccountCardResourceJwtTest {
    // Test data: Use account ID 1 (assuming this exists in test database)
    private val testAccountId = 1L
    private val otherAccountId = 2L

    /**
     * Test that listMyCards endpoint requires authentication.
     * Requests without JWT token should return 401 Unauthorized.
     */
    @Test
    fun `listMyCards without JWT returns 401`() {
        given()
            .`when`()
            .get("/api/v1/accounts/me/cards")
            .then()
            .statusCode(401)
    }

    /**
     * Test that listMyCards works with valid client JWT token.
     * The accountId should be extracted from the token's 'sub' claim.
     */
    @Test
    fun `listMyCards with valid client JWT returns 200`() {
        val token = JwtTestUtils.createClientToken(testAccountId)

        given()
            .header("Authorization", "Bearer $token")
            .contentType(ContentType.JSON)
            .`when`()
            .get("/api/v1/accounts/me/cards")
            .then()
            .statusCode(200)
            .contentType(ContentType.JSON)
    }

    /**
     * Test that getStats endpoint requires authentication.
     */
    @Test
    fun `getStats without JWT returns 401`() {
        given()
            .`when`()
            .get("/api/v1/accounts/me/stats")
            .then()
            .statusCode(401)
    }

    /**
     * Test that getStats works with valid client JWT token.
     */
    @Test
    fun `getStats with valid client JWT returns 200`() {
        val token = JwtTestUtils.createClientToken(testAccountId)

        given()
            .header("Authorization", "Bearer $token")
            .contentType(ContentType.JSON)
            .`when`()
            .get("/api/v1/accounts/me/stats")
            .then()
            .statusCode(200)
            .contentType(ContentType.JSON)
    }

    /**
     * Test that getDueCards endpoint requires authentication.
     */
    @Test
    fun `getDueCards without JWT returns 401`() {
        given()
            .`when`()
            .get("/api/v1/accounts/me/cards:due")
            .then()
            .statusCode(401)
    }

    /**
     * Test that getDueCards works with valid client JWT token.
     */
    @Test
    fun `getDueCards with valid client JWT returns 200`() {
        val token = JwtTestUtils.createClientToken(testAccountId)

        given()
            .header("Authorization", "Bearer $token")
            .contentType(ContentType.JSON)
            .`when`()
            .get("/api/v1/accounts/me/cards:due")
            .then()
            .statusCode(200)
            .contentType(ContentType.JSON)
    }

    /**
     * Test that operator endpoint requires operator role.
     * Client users (without operator role) should get 403 Forbidden.
     */
    @Test
    fun `listAccountCards with client role returns 403`() {
        val token = JwtTestUtils.createClientToken(testAccountId)

        given()
            .header("Authorization", "Bearer $token")
            .contentType(ContentType.JSON)
            .`when`()
            .get("/api/v1/accounts/$otherAccountId/cards")
            .then()
            .statusCode(403)
    }

    /**
     * Test that operator endpoint works with operator role.
     * Operators can access any account's data.
     */
    @Test
    fun `listAccountCards with operator role returns 200`() {
        val token = JwtTestUtils.createOperatorToken(testAccountId)

        given()
            .header("Authorization", "Bearer $token")
            .contentType(ContentType.JSON)
            .`when`()
            .get("/api/v1/accounts/$otherAccountId/cards")
            .then()
            .statusCode(200)
            .contentType(ContentType.JSON)
    }

    /**
     * Test that operator can also access their own account data via operator endpoint.
     */
    @Test
    fun `listAccountCards with operator accessing own account returns 200`() {
        val token = JwtTestUtils.createOperatorToken(testAccountId)

        given()
            .header("Authorization", "Bearer $token")
            .contentType(ContentType.JSON)
            .`when`()
            .get("/api/v1/accounts/$testAccountId/cards")
            .then()
            .statusCode(200)
            .contentType(ContentType.JSON)
    }

    /**
     * Test that expired JWT tokens are rejected.
     * Should return 401 Unauthorized.
     */
    @Test
    fun `request with expired JWT returns 401`() {
        val expiredToken = JwtTestUtils.createExpiredToken(testAccountId)

        given()
            .header("Authorization", "Bearer $expiredToken")
            .contentType(ContentType.JSON)
            .`when`()
            .get("/api/v1/accounts/me/cards")
            .then()
            .statusCode(401)
    }

    /**
     * Test that JWT with invalid issuer is rejected.
     * Should return 401 Unauthorized.
     */
    @Test
    fun `request with invalid issuer JWT returns 401`() {
        val invalidToken = JwtTestUtils.createTokenWithInvalidIssuer(testAccountId)

        given()
            .header("Authorization", "Bearer $invalidToken")
            .contentType(ContentType.JSON)
            .`when`()
            .get("/api/v1/accounts/me/cards")
            .then()
            .statusCode(401)
    }

    /**
     * Test that malformed JWT tokens are rejected.
     */
    @Test
    fun `request with malformed JWT returns 401`() {
        given()
            .header("Authorization", "Bearer invalid.jwt.token")
            .contentType(ContentType.JSON)
            .`when`()
            .get("/api/v1/accounts/me/cards")
            .then()
            .statusCode(401)
    }

    /**
     * Test that Authorization header without "Bearer " prefix is rejected.
     */
    @Test
    fun `request without Bearer prefix returns 401`() {
        val token = JwtTestUtils.createClientToken(testAccountId)

        given()
            .header("Authorization", token) // Missing "Bearer " prefix
            .contentType(ContentType.JSON)
            .`when`()
            .get("/api/v1/accounts/me/cards")
            .then()
            .statusCode(401)
    }
}
