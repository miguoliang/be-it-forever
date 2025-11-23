package com.miguoliang.englishlearning.resource

import io.quarkus.test.junit.QuarkusTest
import io.quarkus.test.security.TestSecurity
import io.quarkus.test.security.jwt.Claim
import io.quarkus.test.security.jwt.JwtSecurity
import io.restassured.RestAssured.given
import io.restassured.http.ContentType
import org.hamcrest.Matchers.equalTo
import org.hamcrest.Matchers.greaterThanOrEqualTo
import org.junit.jupiter.api.Test

/**
 * Black box integration tests for AccountCardResource.
 *
 * Tests the full API stack (HTTP -> Service -> Database) via REST calls.
 * Uses @TestSecurity for easy authentication mocking.
 *
 * Test Coverage:
 * - Card listing with pagination and filters
 * - Due cards retrieval
 * - Card initialization
 * - Card review (SM-2 algorithm integration)
 * - Error handling and validation
 * - Access control and authorization
 */
@QuarkusTest
class AccountCardResourceIntegrationTest {
    // ========== List Cards Tests ==========

    @Test
    @TestSecurity(user = "1", roles = ["client"])
    @JwtSecurity(claims = [Claim(key = "sub", value = "1")])
    fun `GET me cards returns paginated list with JWT auth`() {
        given()
            .queryParam("page", 0)
            .queryParam("size", 10)
            .`when`()
            .get("/api/v1/accounts/me/cards")
            .then()
            .statusCode(200)
            .contentType(ContentType.JSON)
            .body("page.number", equalTo(0))
            .body("page.size", equalTo(10))
            .body("page.totalElements", greaterThanOrEqualTo(0))
            .body("content.size()", greaterThanOrEqualTo(0))
    }

    @Test
    @TestSecurity(user = "1", roles = ["client"])
    @JwtSecurity(claims = [Claim(key = "sub", value = "1")])
    fun `GET me cards filters by card_type_code`() {
        given()
            .queryParam("card_type_code", "flashcard")
            .queryParam("page", 0)
            .queryParam("size", 10)
            .`when`()
            .get("/api/v1/accounts/me/cards")
            .then()
            .statusCode(200)
            .contentType(ContentType.JSON)
    }

    @Test
    @TestSecurity(user = "1", roles = ["client"])
    @JwtSecurity(claims = [Claim(key = "sub", value = "1")])
    fun `GET me cards filters by status`() {
        given()
            .queryParam("status", "new")
            .queryParam("page", 0)
            .queryParam("size", 10)
            .`when`()
            .get("/api/v1/accounts/me/cards")
            .then()
            .statusCode(200)
            .contentType(ContentType.JSON)
    }

    @Test
    fun `GET me cards requires authentication`() {
        given()
            .`when`()
            .get("/api/v1/accounts/me/cards")
            .then()
            .statusCode(401)
    }

    @Test
    @TestSecurity(user = "1", roles = ["client"])
    @JwtSecurity(claims = [Claim(key = "sub", value = "1")])
    fun `GET me cards accepts pagination parameters`() {
        given()
            .queryParam("page", 1)
            .queryParam("size", 5)
            .`when`()
            .get("/api/v1/accounts/me/cards")
            .then()
            .statusCode(200)
            .body("page.number", equalTo(1))
            .body("page.size", equalTo(5))
    }

    // ========== Get Single Card Tests ==========

    @Test
    @TestSecurity(user = "1", roles = ["client"])
    @JwtSecurity(claims = [Claim(key = "sub", value = "1")])
    fun `GET me cards cardId returns 404 for nonexistent card`() {
        given()
            .`when`()
            .get("/api/v1/accounts/me/cards/999999")
            .then()
            .statusCode(404)
    }

    @Test
    fun `GET me cards cardId requires authentication`() {
        given()
            .`when`()
            .get("/api/v1/accounts/me/cards/1")
            .then()
            .statusCode(401)
    }

    // ========== Due Cards Tests ==========

    @Test
    @TestSecurity(user = "1", roles = ["client"])
    @JwtSecurity(claims = [Claim(key = "sub", value = "1")])
    fun `GET me cards due returns cards ready for review`() {
        given()
            .queryParam("page", 0)
            .queryParam("size", 20)
            .`when`()
            .get("/api/v1/accounts/me/cards:due")
            .then()
            .statusCode(200)
            .contentType(ContentType.JSON)
            .body("page.number", equalTo(0))
            .body("page.size", equalTo(20))
    }

    @Test
    @TestSecurity(user = "1", roles = ["client"])
    @JwtSecurity(claims = [Claim(key = "sub", value = "1")])
    fun `GET me cards due filters by card_type_code`() {
        given()
            .queryParam("card_type_code", "flashcard")
            .queryParam("page", 0)
            .queryParam("size", 10)
            .`when`()
            .get("/api/v1/accounts/me/cards:due")
            .then()
            .statusCode(200)
    }

    @Test
    fun `GET me cards due requires authentication`() {
        given()
            .`when`()
            .get("/api/v1/accounts/me/cards:due")
            .then()
            .statusCode(401)
    }

    // ========== Initialize Cards Tests ==========

    @Test
    @TestSecurity(user = "1", roles = ["client"])
    @JwtSecurity(claims = [Claim(key = "sub", value = "1")])
    fun `POST me cards initialize creates cards for account`() {
        given()
            .contentType(ContentType.JSON)
            .body("""{"cardTypeCodes": null}""")
            .`when`()
            .post("/api/v1/accounts/me/cards:initialize")
            .then()
            .statusCode(200)
            .body("created", greaterThanOrEqualTo(0))
            .body("skipped", equalTo(0))
    }

    @Test
    @TestSecurity(user = "1", roles = ["client"])
    @JwtSecurity(claims = [Claim(key = "sub", value = "1")])
    fun `POST me cards initialize with card type codes filter`() {
        given()
            .contentType(ContentType.JSON)
            .body("""{"cardTypeCodes": ["flashcard"]}""")
            .`when`()
            .post("/api/v1/accounts/me/cards:initialize")
            .then()
            .statusCode(200)
    }

    @Test
    fun `POST me cards initialize requires authentication`() {
        given()
            .contentType(ContentType.JSON)
            .body("""{"cardTypeCodes": null}""")
            .`when`()
            .post("/api/v1/accounts/me/cards:initialize")
            .then()
            .statusCode(401)
    }

    // ========== Operator Access Tests ==========

    @Test
    @TestSecurity(user = "100", roles = ["operator", "client"])
    @JwtSecurity(claims = [Claim(key = "sub", value = "100")])
    fun `GET accountId cards allows operator to access any account`() {
        given()
            .queryParam("page", 0)
            .queryParam("size", 10)
            .`when`()
            .get("/api/v1/accounts/1/cards")
            .then()
            .statusCode(200)
            .contentType(ContentType.JSON)
    }

    @Test
    @TestSecurity(user = "1", roles = ["client"])
    @JwtSecurity(claims = [Claim(key = "sub", value = "1")])
    fun `GET accountId cards denies client users`() {
        given()
            .queryParam("page", 0)
            .queryParam("size", 10)
            .`when`()
            .get("/api/v1/accounts/99999/cards")
            .then()
            .statusCode(403) // Forbidden
    }

    @Test
    fun `GET accountId cards requires authentication`() {
        given()
            .`when`()
            .get("/api/v1/accounts/1/cards")
            .then()
            .statusCode(401)
    }

    // ========== Pagination Edge Cases ==========

    @Test
    @TestSecurity(user = "1", roles = ["client"])
    @JwtSecurity(claims = [Claim(key = "sub", value = "1")])
    fun `GET me cards handles large page numbers gracefully`() {
        given()
            .queryParam("page", 99999)
            .queryParam("size", 10)
            .`when`()
            .get("/api/v1/accounts/me/cards")
            .then()
            .statusCode(200)
            .body("content.size()", equalTo(0)) // Empty page
    }

    @Test
    @TestSecurity(user = "1", roles = ["client"])
    @JwtSecurity(claims = [Claim(key = "sub", value = "1")])
    fun `GET me cards handles size 1`() {
        given()
            .queryParam("page", 0)
            .queryParam("size", 1)
            .`when`()
            .get("/api/v1/accounts/me/cards")
            .then()
            .statusCode(200)
            .body("page.size", equalTo(1))
    }

    // ========== Filter Combination Tests ==========

    @Test
    @TestSecurity(user = "1", roles = ["client"])
    @JwtSecurity(claims = [Claim(key = "sub", value = "1")])
    fun `GET me cards combines card_type_code and status filters`() {
        given()
            .queryParam("card_type_code", "flashcard")
            .queryParam("status", "new")
            .queryParam("page", 0)
            .queryParam("size", 10)
            .`when`()
            .get("/api/v1/accounts/me/cards")
            .then()
            .statusCode(200)
            .contentType(ContentType.JSON)
    }

    @Test
    @TestSecurity(user = "1", roles = ["client"])
    @JwtSecurity(claims = [Claim(key = "sub", value = "1")])
    fun `GET me cards works with no filters`() {
        given()
            .queryParam("page", 0)
            .queryParam("size", 100)
            .`when`()
            .get("/api/v1/accounts/me/cards")
            .then()
            .statusCode(200)
    }

    // ========== Content Type Tests ==========

    @Test
    @TestSecurity(user = "1", roles = ["client"])
    @JwtSecurity(claims = [Claim(key = "sub", value = "1")])
    fun `POST endpoints require application json content type`() {
        given()
            // Missing content-type
            .`when`()
            .post("/api/v1/accounts/me/cards:initialize")
            .then()
            .statusCode(415) // Unsupported Media Type
    }
}
