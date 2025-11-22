package com.miguoliang.englishlearning.controller

import com.miguoliang.englishlearning.dto.*
import com.miguoliang.englishlearning.dto.PageInfoDto
import com.miguoliang.englishlearning.service.AccountCardService
import com.miguoliang.englishlearning.service.CardTemplateService
import com.miguoliang.englishlearning.service.CardTypeService
import com.miguoliang.englishlearning.service.KnowledgeService
import jakarta.validation.Valid
import org.springframework.data.domain.Pageable
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

/**
 * REST controller for Account Card endpoints.
 * Access: client role (for /me endpoints) or operator role (for {accountId} endpoints).
 * 
 * Note: JWT authentication is not yet implemented. For MVP, accountId is passed as path parameter.
 * TODO: Extract accountId from JWT token 'sub' claim for /me endpoints.
 */
@RestController
@RequestMapping("/api/v1/accounts")
class AccountCardController(
    private val accountCardService: AccountCardService,
    private val knowledgeService: KnowledgeService,
    private val cardTypeService: CardTypeService,
    private val cardTemplateService: CardTemplateService,
) {
    /**
     * List current account's cards with optional filtering.
     * GET /api/v1/accounts/me/cards
     * TODO: Extract accountId from JWT token 'sub' claim
     */
    @GetMapping("/me/cards")
    fun listMyCards(
        @RequestParam(required = false) card_type_code: String?,
        @RequestParam(required = false) status: String?,
        pageable: Pageable,
    ): Mono<ResponseEntity<PageDto<AccountCardDto>>> {
        // TODO: Extract accountId from JWT token
        val accountId = 1L // Placeholder

        return accountCardService
            .getAccountCards(accountId, pageable, card_type_code, status)
            .flatMap { page ->
                // Batch load knowledge and card types to avoid N+1
                val knowledgeCodes = page.content.map { it.knowledgeCode }.distinct()
                val cardTypeCodes = page.content.map { it.cardTypeCode }.distinct()

                Mono
                    .zip(
                        knowledgeService.getKnowledgeByCodes(knowledgeCodes),
                        cardTypeService.getCardTypesByCodes(cardTypeCodes),
                    ).map { tuple ->
                        val knowledgeMap = tuple.t1
                        val cardTypeMap = tuple.t2
                        val dtos =
                            page.content.mapNotNull { card ->
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
                        val pageDto =
                            PageDto(
                                content = dtos,
                                page =
                                    PageInfoDto(
                                        number = page.number,
                                        size = page.size,
                                        totalElements = page.totalElements,
                                        totalPages = page.totalPages,
                                    ),
                            )
                        ResponseEntity.ok(pageDto)
                    }
            }.onErrorResume { error ->
                Mono.just(
                    ResponseEntity
                        .status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(PageDto(emptyList(), PageInfoDto(0, 0, 0, 0))),
                )
            }
    }

    /**
     * List specific account's cards (operator access).
     * GET /api/v1/accounts/{accountId}/cards
     * TODO: Validate operator role from JWT token
     */
    @GetMapping("/{accountId}/cards")
    fun listAccountCards(
        @PathVariable accountId: Long,
        @RequestParam(required = false) card_type_code: String?,
        @RequestParam(required = false) status: String?,
        pageable: Pageable,
    ): Mono<ResponseEntity<PageDto<AccountCardDto>>> =
        accountCardService
            .getAccountCards(accountId, pageable, card_type_code, status)
            .flatMap { page ->
                // Batch load knowledge and card types to avoid N+1
                val knowledgeCodes = page.content.map { it.knowledgeCode }.distinct()
                val cardTypeCodes = page.content.map { it.cardTypeCode }.distinct()

                Mono
                    .zip(
                        knowledgeService.getKnowledgeByCodes(knowledgeCodes),
                        cardTypeService.getCardTypesByCodes(cardTypeCodes),
                    ).map { tuple ->
                        val knowledgeMap = tuple.t1
                        val cardTypeMap = tuple.t2
                        val dtos =
                            page.content.mapNotNull { card ->
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
                        val pageDto =
                            PageDto(
                                content = dtos,
                                page =
                                    PageInfoDto(
                                        number = page.number,
                                        size = page.size,
                                        totalElements = page.totalElements,
                                        totalPages = page.totalPages,
                                    ),
                            )
                        ResponseEntity.ok(pageDto)
                    }
            }.onErrorResume { error ->
                Mono.just(
                    ResponseEntity
                        .status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(PageDto(emptyList(), PageInfoDto(0, 0, 0, 0))),
                )
            }

    /**
     * Get a specific card for current account.
     * GET /api/v1/accounts/me/cards/{cardId}
     * TODO: Extract accountId from JWT token 'sub' claim
     */
    @GetMapping("/me/cards/{cardId}")
    fun getMyCard(
        @PathVariable cardId: Long,
    ): Mono<ResponseEntity<Any>> {
        // TODO: Extract accountId from JWT token
        val accountId = 1L // Placeholder

        return accountCardService
            .getCardById(accountId, cardId)
            .flatMap { card ->
                Mono
                    .zip(
                        knowledgeService.getKnowledgeByCode(card.knowledgeCode),
                        cardTypeService.getCardTypeByCode(card.cardTypeCode),
                    ).map { tuple ->
                        val knowledge = tuple.t1
                        val cardType = tuple.t2
                        ResponseEntity.ok<Any>(
                            card.toDto(
                                knowledge = knowledge.toDto(),
                                cardType = cardType.toDto(),
                            ),
                        )
                    }
            }.switchIfEmpty(
                Mono.just(
                    ResponseEntity
                        .status(HttpStatus.NOT_FOUND)
                        .body(ErrorResponseFactory.notFound("Card", cardId.toString())),
                ),
            ).onErrorResume { error ->
                Mono.just(
                    ResponseEntity
                        .status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(PageDto<AccountCardDto>(emptyList(), PageInfoDto(0, 0, 0, 0))),
                )
            }
    }

    /**
     * Get cards due for review for current account.
     * GET /api/v1/accounts/me/cards:due
     * TODO: Extract accountId from JWT token 'sub' claim
     */
    @GetMapping("/me/cards:due")
    fun getDueCards(
        @RequestParam(required = false) card_type_code: String?,
        pageable: Pageable,
    ): Mono<ResponseEntity<PageDto<AccountCardDto>>> {
        // TODO: Extract accountId from JWT token
        val accountId = 1L // Placeholder

        return accountCardService
            .getDueCards(accountId, pageable, card_type_code)
            .flatMap { page ->
                // Batch load knowledge and card types to avoid N+1
                val knowledgeCodes = page.content.map { it.knowledgeCode }.distinct()
                val cardTypeCodes = page.content.map { it.cardTypeCode }.distinct()

                Mono
                    .zip(
                        knowledgeService.getKnowledgeByCodes(knowledgeCodes),
                        cardTypeService.getCardTypesByCodes(cardTypeCodes),
                    ).flatMap { tuple ->
                        val knowledgeMap = tuple.t1
                        val cardTypeMap = tuple.t2
                        // Render templates for each card (template rendering is cached internally)
                        Flux
                            .fromIterable(page.content)
                            .flatMap { card ->
                                val knowledge = knowledgeMap[card.knowledgeCode]
                                val cardType = cardTypeMap[card.cardTypeCode]
                                if (knowledge != null && cardType != null) {
                                    Mono
                                        .zip(
                                            cardTemplateService.renderByRole(cardType, knowledge, "front"),
                                            cardTemplateService.renderByRole(cardType, knowledge, "back"),
                                        ).map { renderTuple ->
                                            card.toDto(
                                                knowledge = knowledge.toDto(),
                                                cardType = cardType.toDto(),
                                                front = renderTuple.t1,
                                                back = renderTuple.t2,
                                            )
                                        }
                                } else {
                                    Mono.empty()
                                }
                            }.collectList()
                            .map { dtos ->
                                val pageDto =
                                    PageDto<AccountCardDto>(
                                        content = dtos,
                                        page =
                                            PageInfoDto(
                                                number = page.number,
                                                size = page.size,
                                                totalElements = page.totalElements,
                                                totalPages = page.totalPages,
                                            ),
                                    )
                                ResponseEntity.ok(pageDto)
                            }
                    }
            }.onErrorResume { error ->
                Mono.just(
                    ResponseEntity
                        .status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(PageDto<AccountCardDto>(emptyList(), PageInfoDto(0, 0, 0, 0))),
                )
            }
    }

    /**
     * Initialize cards for current account.
     * POST /api/v1/accounts/me/cards:initialize
     * TODO: Extract accountId from JWT token 'sub' claim, trigger Temporal workflow
     */
    @PostMapping("/me/cards:initialize")
    fun initializeCards(
        @RequestBody(required = false) request: InitializeCardsRequestDto?,
    ): Mono<ResponseEntity<Map<String, Int>>> {
        // TODO: Extract accountId from JWT token
        val accountId = 1L // Placeholder

        return accountCardService
            .initializeCards(accountId, request?.cardTypeCodes)
            .map { created ->
                ResponseEntity.ok(mapOf("created" to created, "skipped" to 0))
            }.onErrorResume { error ->
                Mono.just(
                    ResponseEntity
                        .status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(mapOf("created" to 0, "skipped" to 0)),
                )
            }
    }

    /**
     * Submit a review result and update SM-2 algorithm state.
     * POST /api/v1/accounts/me/cards/{cardId}:review
     * TODO: Extract accountId from JWT token 'sub' claim
     */
    @PostMapping("/me/cards/{cardId}:review")
    fun reviewCard(
        @PathVariable cardId: Long,
        @Valid @RequestBody request: ReviewRequestDto,
    ): Mono<ResponseEntity<Any>> {
        // TODO: Extract accountId from JWT token
        val accountId = 1L // Placeholder

        // Validate quality range
        if (request.quality < 0 || request.quality > 5) {
            return Mono.just(
                ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(ErrorResponseFactory.badRequest("Quality must be between 0 and 5")),
            )
        }

        return accountCardService
            .reviewCard(accountId, cardId, request.quality)
            .flatMap { card ->
                Mono
                    .zip(
                        knowledgeService.getKnowledgeByCode(card.knowledgeCode),
                        cardTypeService.getCardTypeByCode(card.cardTypeCode),
                    ).map { tuple ->
                        val knowledge = tuple.t1
                        val cardType = tuple.t2
                        ResponseEntity.ok<Any>(
                            card.toDto(
                                knowledge = knowledge.toDto(),
                                cardType = cardType.toDto(),
                            ),
                        )
                    }
            }.switchIfEmpty(
                Mono.just(
                    ResponseEntity
                        .status(HttpStatus.NOT_FOUND)
                        .body<Any>(ErrorResponseFactory.notFound("Card", cardId.toString())),
                ),
            ).onErrorResume { error ->
                when (error) {
                    is IllegalArgumentException -> {
                        Mono.just(
                            ResponseEntity
                                .status(HttpStatus.BAD_REQUEST)
                                .body<Any>(ErrorResponseFactory.badRequest(error.message ?: "Invalid request")),
                        )
                    }
                    else -> {
                        Mono.just(
                            ResponseEntity
                                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                                .body<Any>(
                                    ErrorResponseFactory.internalError(error.message ?: "Internal server error"),
                                ),
                        )
                    }
                }
            }
    }
}
