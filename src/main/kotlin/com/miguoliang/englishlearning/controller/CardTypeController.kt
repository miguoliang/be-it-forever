package com.miguoliang.englishlearning.controller

import com.miguoliang.englishlearning.dto.CardTypeDto
import com.miguoliang.englishlearning.dto.ErrorResponseFactory
import com.miguoliang.englishlearning.dto.PageDto
import com.miguoliang.englishlearning.dto.PageInfoDto
import com.miguoliang.englishlearning.dto.toDto
import com.miguoliang.englishlearning.service.CardTypeService
import org.springframework.data.domain.Pageable
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import reactor.core.publisher.Mono

/**
 * REST controller for Card Type endpoints.
 * Access: Both operator and client roles (read-only).
 */
@RestController
@RequestMapping("/api/v1/card-types")
class CardTypeController(
    private val cardTypeService: CardTypeService,
) {
    /**
     * List all available card types.
     * GET /api/v1/card-types
     */
    @GetMapping
    fun listCardTypes(pageable: Pageable): Mono<ResponseEntity<PageDto<CardTypeDto>>> =
        cardTypeService
            .getAllCardTypes()
            .collectList()
            .map { cardTypes ->
                val total = cardTypes.size.toLong()
                val start = pageable.offset.toInt()
                val end = minOf(start + pageable.pageSize, cardTypes.size)
                val pagedContent =
                    if (start < cardTypes.size) {
                        cardTypes.subList(start, end)
                    } else {
                        emptyList()
                    }

                val pageDto =
                    PageDto(
                        content = pagedContent.map { it.toDto() },
                        page =
                            PageInfoDto(
                                number = pageable.pageNumber,
                                size = pageable.pageSize,
                                totalElements = total,
                                totalPages = if (total > 0) ((total - 1) / pageable.pageSize + 1).toInt() else 0,
                            ),
                    ) as PageDto<CardTypeDto>
                ResponseEntity.ok(pageDto)
            }.onErrorResume { error ->
                Mono.just(
                    ResponseEntity
                        .status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(PageDto<CardTypeDto>(emptyList(), PageInfoDto(0, 0, 0, 0))),
                )
            }

    /**
     * Get a specific card type.
     * GET /api/v1/card-types/{code}
     */
    @GetMapping("/{code}")
    fun getCardType(
        @PathVariable code: String,
    ): Mono<ResponseEntity<Any>> =
        cardTypeService
            .getCardTypeByCode(code)
            .map { cardType ->
                ResponseEntity.ok<Any>(cardType.toDto())
            }.switchIfEmpty(
                Mono.just(
                    ResponseEntity
                        .status(HttpStatus.NOT_FOUND)
                        .body<Any>(ErrorResponseFactory.notFound("CardType", code)),
                ),
            ).onErrorResume { error ->
                Mono.just(
                    ResponseEntity
                        .status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body<Any>(ErrorResponseFactory.internalError(error.message ?: "Internal server error")),
                )
            }
}
