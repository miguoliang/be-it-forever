package com.miguoliang.englishlearning.resource

import com.miguoliang.englishlearning.common.PageRequest
import com.miguoliang.englishlearning.dto.InitializeCardsRequestDto
import com.miguoliang.englishlearning.dto.PageDto
import com.miguoliang.englishlearning.dto.PageInfoDto
import com.miguoliang.englishlearning.dto.ReviewRequestDto
import com.miguoliang.englishlearning.dto.toDto
import com.miguoliang.englishlearning.repository.AccountCardRepository
import com.miguoliang.englishlearning.service.AccountCardService
import com.miguoliang.englishlearning.service.CardTemplateService
import com.miguoliang.englishlearning.service.CardTypeService
import com.miguoliang.englishlearning.service.JwtService
import com.miguoliang.englishlearning.service.KnowledgeService
import io.quarkus.security.Authenticated
import io.quarkus.security.identity.SecurityIdentity
import jakarta.annotation.security.RolesAllowed
import jakarta.inject.Inject
import jakarta.validation.Valid
import jakarta.ws.rs.Consumes
import jakarta.ws.rs.DefaultValue
import jakarta.ws.rs.GET
import jakarta.ws.rs.POST
import jakarta.ws.rs.Path
import jakarta.ws.rs.PathParam
import jakarta.ws.rs.Produces
import jakarta.ws.rs.QueryParam
import jakarta.ws.rs.core.MediaType
import jakarta.ws.rs.core.Response

/**
 * REST resource for Account Card endpoints.
 *
 * Authentication & Authorization:
 * - All /me endpoints: Require authentication via JWT token. AccountId is extracted from JWT 'sub' claim.
 * - /{accountId} endpoints: Require 'operator' role for cross-account access.
 *
 * JWT Token Requirements:
 * - 'sub' claim: Must contain the account ID (numeric string)
 * - 'groups' claim: Must contain role(s): ["client"] for regular users, ["client", "operator"] for operators
 * - 'iss' claim: Must match configured issuer
 * - 'exp' claim: Token must not be expired
 *
 * Access Patterns:
 * - Client users can only access their own data via /me endpoints
 * - Operator users can access any account's data via /{accountId} endpoints
 */
@Path("/api/v1/accounts")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
class AccountCardResource(
    private val accountCardService: AccountCardService,
    private val knowledgeService: KnowledgeService,
    private val cardTypeService: CardTypeService,
    private val cardTemplateService: CardTemplateService,
    private val jwtService: JwtService,
) {
    @Inject
    lateinit var securityIdentity: SecurityIdentity

    /**
     * List current account's cards with optional filtering.
     * GET /api/v1/accounts/me/cards
     *
     * Requires: JWT authentication (accountId extracted from token 'sub' claim)
     */
    @GET
    @Path("/me/cards")
    @Authenticated
    suspend fun listMyCards(
        @QueryParam("card_type_code") cardTypeCode: String?,
        @QueryParam("status") status: AccountCardRepository.StatusFilter?,
        @QueryParam("page") @DefaultValue("0") page: Int,
        @QueryParam("size") @DefaultValue("20") size: Int,
    ): Response {
        val accountId = jwtService.extractAccountId(securityIdentity)

        val pageable = PageRequest.of(page, size)
        // OPTIMIZED: Use projection query to fetch data in single JOIN query
        val projections = accountCardService.getAccountCards(accountId, pageable, cardTypeCode, status)

        // Get total count for pagination metadata (still need this, but only 1 count query)
        val totalCount = accountCardService.getCountWithFilters(accountId, cardTypeCode, status)

        // Convert projections to DTOs (no additional queries needed)
        val dtos = projections.map { it.toDto() }

        return Response
            .ok(
                PageDto(
                    content = dtos,
                    page =
                        PageInfoDto(
                            number = page,
                            size = size,
                            totalElements = totalCount,
                            totalPages = ((totalCount + size - 1) / size).toInt(),
                        ),
                ),
            ).build()
    }

    /**
     * List specific account's cards (operator access).
     * GET /api/v1/accounts/{accountId}/cards
     *
     * Requires: JWT authentication with 'operator' role
     * Allows operators to access any account's data
     */
    @GET
    @Path("/{accountId}/cards")
    @RolesAllowed("operator")
    suspend fun listAccountCards(
        @PathParam("accountId") accountId: Long,
        @QueryParam("card_type_code") card_type_code: String?,
        @QueryParam("status") status: AccountCardRepository.StatusFilter?,
        @QueryParam("page") @DefaultValue("0") page: Int,
        @QueryParam("size") @DefaultValue("20") size: Int,
    ): Response {
        // Validate that operator can access this account
        jwtService.validateAccountAccess(securityIdentity, accountId)
        val pageable = PageRequest.of(page, size)
        val pageResult = accountCardService.getAccountCards(accountId, pageable, card_type_code, status)

        // Batch load knowledge and card types to avoid N+1
        val knowledgeCodes = pageResult.map { it.knowledgeCode }.distinct()
        val cardTypeCodes = pageResult.map { it.cardTypeCode }.distinct()

        val knowledgeMap = knowledgeService.getKnowledgeByCodes(knowledgeCodes)
        val cardTypeMap = cardTypeService.getCardTypesByCodes(cardTypeCodes)

        return Response
            .ok(
                pageResult,
            ).build()
    }

    /**
     * Get a specific card for current account.
     * GET /api/v1/accounts/me/cards/{cardId}
     *
     * Requires: JWT authentication (accountId extracted from token 'sub' claim)
     */
    @GET
    @Path("/me/cards/{cardId}")
    @Authenticated
    suspend fun getMyCard(
        @PathParam("cardId") cardId: Long,
    ): Response {
        val accountId = jwtService.extractAccountId(securityIdentity)

        val card =
            accountCardService.getCardById(accountId, cardId)
                ?: throw com.miguoliang.englishlearning.exception
                    .NotFoundException("Card", cardId.toString())

        val knowledge =
            knowledgeService.getKnowledgeByCode(card.knowledgeCode)
                ?: throw com.miguoliang.englishlearning.exception
                    .NotFoundException("Knowledge", card.knowledgeCode)
        val cardType =
            cardTypeService.getCardTypeByCode(card.cardTypeCode)
                ?: throw com.miguoliang.englishlearning.exception
                    .NotFoundException("CardType", card.cardTypeCode)

        return Response
            .ok(
                card.toDto(
                    knowledge = knowledge.toDto(),
                    cardType = cardType.toDto(),
                ),
            ).build()
    }

    /**
     * Get cards due for review for current account.
     * GET /api/v1/accounts/me/cards:due
     *
     * Requires: JWT authentication (accountId extracted from token 'sub' claim)
     */
    @GET
    @Path("/me/cards:due")
    @Authenticated
    suspend fun getDueCards(
        @QueryParam("card_type_code") card_type_code: String?,
        @QueryParam("page") @DefaultValue("0") page: Int,
        @QueryParam("size") @DefaultValue("20") size: Int,
    ): Response {
        val accountId = jwtService.extractAccountId(securityIdentity)

        val pageable = PageRequest.of(page, size)
        val pageResult = accountCardService.getDueCards(accountId, pageable, card_type_code)

        // Batch load knowledge and card types to avoid N+1
        val knowledgeCodes = pageResult.content.map { it.knowledgeCode }.distinct()
        val cardTypeCodes = pageResult.content.map { it.cardTypeCode }.distinct()

        val knowledgeMap = knowledgeService.getKnowledgeByCodes(knowledgeCodes)
        val cardTypeMap = cardTypeService.getCardTypesByCodes(cardTypeCodes)

        // Render templates for each card
        val dtos =
            pageResult.content.mapNotNull { card ->
                val knowledge = knowledgeMap[card.knowledgeCode]
                val cardType = cardTypeMap[card.cardTypeCode]
                if (knowledge != null && cardType != null) {
                    val front = cardTemplateService.renderByRole(cardType, knowledge, "front")
                    val back = cardTemplateService.renderByRole(cardType, knowledge, "back")
                    card.toDto(
                        knowledge = knowledge.toDto(),
                        cardType = cardType.toDto(),
                        front = front,
                        back = back,
                    )
                } else {
                    null
                }
            }

        return Response
            .ok(
                PageDto(
                    content = dtos,
                    page =
                        PageInfoDto(
                            number = pageResult.number,
                            size = pageResult.size,
                            totalElements = pageResult.totalElements,
                            totalPages = pageResult.totalPages,
                        ),
                ),
            ).build()
    }

    /**
     * Initialize cards for current account.
     * POST /api/v1/accounts/me/cards:initialize
     *
     * Requires: JWT authentication (accountId extracted from token 'sub' claim)
     * TODO: Trigger Temporal workflow for async card initialization
     */
    @POST
    @Path("/me/cards:initialize")
    @Authenticated
    suspend fun initializeCards(request: InitializeCardsRequestDto?): Response {
        val accountId = jwtService.extractAccountId(securityIdentity)

        val created = accountCardService.initializeCards(accountId, request?.cardTypeCodes)
        return Response.ok(mapOf("created" to created, "skipped" to 0)).build()
    }

    /**
     * Submit a review result and update SM-2 algorithm state.
     * POST /api/v1/accounts/me/cards/{cardId}:review
     *
     * Requires: JWT authentication (accountId extracted from token 'sub' claim)
     */
    @POST
    @Path("/me/cards/{cardId}:review")
    @Authenticated
    suspend fun reviewCard(
        @PathParam("cardId") cardId: Long,
        @Valid request: ReviewRequestDto,
    ): Response {
        val accountId = jwtService.extractAccountId(securityIdentity)

        // Validate quality range
        require(request.quality in 0..5) { "Quality must be between 0 and 5" }

        val card = accountCardService.reviewCard(accountId, cardId, request.quality)

        val knowledge =
            knowledgeService.getKnowledgeByCode(card.knowledgeCode)
                ?: throw com.miguoliang.englishlearning.exception
                    .NotFoundException("Knowledge", card.knowledgeCode)
        val cardType =
            cardTypeService.getCardTypeByCode(card.cardTypeCode)
                ?: throw com.miguoliang.englishlearning.exception
                    .NotFoundException("CardType", card.cardTypeCode)

        return Response
            .ok(
                card.toDto(
                    knowledge = knowledge.toDto(),
                    cardType = cardType.toDto(),
                ),
            ).build()
    }
}
