package com.miguoliang.englishlearning.resource

import com.miguoliang.englishlearning.common.PageRequest
import com.miguoliang.englishlearning.dto.InitializeCardsRequestDto
import com.miguoliang.englishlearning.dto.PageDto
import com.miguoliang.englishlearning.dto.PageInfoDto
import com.miguoliang.englishlearning.dto.ReviewRequestDto
import com.miguoliang.englishlearning.dto.toDto
import com.miguoliang.englishlearning.service.AccountCardService
import com.miguoliang.englishlearning.service.CardTemplateService
import com.miguoliang.englishlearning.service.CardTypeService
import com.miguoliang.englishlearning.service.KnowledgeService
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
import org.eclipse.microprofile.config.inject.ConfigProperty

/**
 * REST resource for Account Card endpoints.
 * Access: client role (for /me endpoints) or operator role (for {accountId} endpoints).
 *
 * Note: JWT authentication is not yet implemented. For MVP, accountId comes from configuration.
 * TODO: Implement JWT authentication and extract accountId from JWT token 'sub' claim for /me endpoints.
 * See: https://quarkus.io/guides/security-jwt
 */
@Path("/api/v1/accounts")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
class AccountCardResource(
    private val accountCardService: AccountCardService,
    private val knowledgeService: KnowledgeService,
    private val cardTypeService: CardTypeService,
    private val cardTemplateService: CardTemplateService,
    @ConfigProperty(name = "app.default.account.id") private val defaultAccountId: Long,
) {
    /**
     * List current account's cards with optional filtering.
     * GET /api/v1/accounts/me/cards
     * TODO: Extract accountId from JWT token 'sub' claim
     */
    @GET
    @Path("/me/cards")
    suspend fun listMyCards(
        @QueryParam("card_type_code") card_type_code: String?,
        @QueryParam("status") status: String?,
        @QueryParam("page") @DefaultValue("0") page: Int,
        @QueryParam("size") @DefaultValue("20") size: Int,
    ): Response {
        // TODO: Extract accountId from JWT token (see class-level documentation)
        val accountId = defaultAccountId

        val pageable = PageRequest.of(page, size)
        // OPTIMIZED: Use projection query to fetch data in single JOIN query
        val projections = accountCardService.getAccountCardsOptimized(accountId, pageable, card_type_code, status)

        // Get total count for pagination metadata (still need this, but only 1 count query)
        val totalCount = accountCardService.getCountWithFilters(accountId, card_type_code, status)

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
     * TODO: Validate operator role from JWT token
     */
    @GET
    @Path("/{accountId}/cards")
    suspend fun listAccountCards(
        @PathParam("accountId") accountId: Long,
        @QueryParam("card_type_code") card_type_code: String?,
        @QueryParam("status") status: String?,
        @QueryParam("page") @DefaultValue("0") page: Int,
        @QueryParam("size") @DefaultValue("20") size: Int,
    ): Response {
        val pageable = PageRequest.of(page, size)
        val pageResult = accountCardService.getAccountCards(accountId, pageable, card_type_code, status)

        // Batch load knowledge and card types to avoid N+1
        val knowledgeCodes = pageResult.content.map { it.knowledgeCode }.distinct()
        val cardTypeCodes = pageResult.content.map { it.cardTypeCode }.distinct()

        val knowledgeMap = knowledgeService.getKnowledgeByCodes(knowledgeCodes)
        val cardTypeMap = cardTypeService.getCardTypesByCodes(cardTypeCodes)

        val dtos =
            pageResult.content.mapNotNull { card ->
                val knowledge = knowledgeMap[card.knowledgeCode]
                val cardType = cardTypeMap[card.cardTypeCode]
                if (knowledge != null && cardType != null) {
                    card.toDto(
                        knowledge = knowledge.toDto(),
                        cardType = cardType.toDto(),
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
     * Get a specific card for current account.
     * GET /api/v1/accounts/me/cards/{cardId}
     * TODO: Extract accountId from JWT token 'sub' claim
     */
    @GET
    @Path("/me/cards/{cardId}")
    suspend fun getMyCard(
        @PathParam("cardId") cardId: Long,
    ): Response {
        // TODO: Extract accountId from JWT token (see class-level documentation)
        val accountId = defaultAccountId

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
     * TODO: Extract accountId from JWT token 'sub' claim
     */
    @GET
    @Path("/me/cards:due")
    suspend fun getDueCards(
        @QueryParam("card_type_code") card_type_code: String?,
        @QueryParam("page") @DefaultValue("0") page: Int,
        @QueryParam("size") @DefaultValue("20") size: Int,
    ): Response {
        // TODO: Extract accountId from JWT token (see class-level documentation)
        val accountId = defaultAccountId

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
     * TODO: Extract accountId from JWT token 'sub' claim, trigger Temporal workflow
     */
    @POST
    @Path("/me/cards:initialize")
    suspend fun initializeCards(request: InitializeCardsRequestDto?): Response {
        // TODO: Extract accountId from JWT token (see class-level documentation)
        val accountId = defaultAccountId

        val created = accountCardService.initializeCards(accountId, request?.cardTypeCodes)
        return Response.ok(mapOf("created" to created, "skipped" to 0)).build()
    }

    /**
     * Submit a review result and update SM-2 algorithm state.
     * POST /api/v1/accounts/me/cards/{cardId}:review
     * TODO: Extract accountId from JWT token 'sub' claim
     */
    @POST
    @Path("/me/cards/{cardId}:review")
    suspend fun reviewCard(
        @PathParam("cardId") cardId: Long,
        @Valid request: ReviewRequestDto,
    ): Response {
        // TODO: Extract accountId from JWT token (see class-level documentation)
        val accountId = defaultAccountId

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
