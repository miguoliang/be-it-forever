package com.miguoliang.englishlearning.controller

import com.miguoliang.englishlearning.dto.ErrorResponseFactory
import com.miguoliang.englishlearning.dto.KnowledgeDto
import com.miguoliang.englishlearning.dto.PageDto
import com.miguoliang.englishlearning.dto.PageInfoDto
import com.miguoliang.englishlearning.dto.toDto
import com.miguoliang.englishlearning.service.KnowledgeService
import org.springframework.data.domain.Pageable
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import reactor.core.publisher.Mono

/**
 * REST controller for Knowledge endpoints.
 * Access: Both operator and client roles (read-only for clients, full CRUD for operators).
 */
@RestController
@RequestMapping("/api/v1/knowledge")
class KnowledgeController(
    private val knowledgeService: KnowledgeService,
) {
    /**
     * List knowledge items with optional filtering.
     * GET /api/v1/knowledge
     */
    @GetMapping
    fun listKnowledge(pageable: Pageable): Mono<ResponseEntity<PageDto<KnowledgeDto>>> =
        knowledgeService
            .getKnowledge(pageable)
            .map { page ->
                val content = page.content.map { it.toDto() }
                val pageDto =
                    PageDto(
                        content = content,
                        page =
                            PageInfoDto(
                                number = page.number,
                                size = page.size,
                                totalElements = page.totalElements,
                                totalPages = page.totalPages,
                            ),
                    ) as PageDto<KnowledgeDto>
                ResponseEntity.ok(pageDto)
            }.onErrorResume { error ->
                Mono.just(
                    ResponseEntity
                        .status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(PageDto<KnowledgeDto>(emptyList(), PageInfoDto(0, 0, 0, 0))),
                )
            }

    /**
     * Get a specific knowledge item.
     * GET /api/v1/knowledge/{code}
     */
    @GetMapping("/{code}")
    fun getKnowledge(
        @PathVariable code: String,
    ): Mono<ResponseEntity<Any>> =
        knowledgeService
            .getKnowledgeByCode(code)
            .map { knowledge ->
                ResponseEntity.ok<Any>(knowledge.toDto())
            }.switchIfEmpty(
                Mono.just(
                    ResponseEntity
                        .status(HttpStatus.NOT_FOUND)
                        .body<Any>(ErrorResponseFactory.notFound("Knowledge", code)),
                ),
            ).onErrorResume { error ->
                Mono.just(
                    ResponseEntity
                        .status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body<Any>(ErrorResponseFactory.internalError(error.message ?: "Internal server error")),
                )
            }
}
