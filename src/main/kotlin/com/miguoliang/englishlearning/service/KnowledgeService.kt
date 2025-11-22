package com.miguoliang.englishlearning.service

import com.miguoliang.englishlearning.model.Knowledge
import com.miguoliang.englishlearning.repository.KnowledgeRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import reactor.core.publisher.Mono

/**
 * Manages knowledge operations.
 */
@Service
class KnowledgeService(
    private val knowledgeRepository: KnowledgeRepository,
    private val paginationHelper: ReactivePaginationHelper,
) {
    /**
     * List knowledge items with pagination.
     * 
     * @param pageable Pagination parameters
     * @param filter Optional filter expression (not implemented in MVP)
     * @return Mono containing Page of Knowledge items
     */
    fun getKnowledge(
        pageable: Pageable,
        filter: String? = null,
    ): Mono<Page<Knowledge>> {
        // TODO: Implement filter support for metadata queries
        return paginationHelper.paginate(
            knowledgeRepository.findAllOrderedByCode(pageable),
            knowledgeRepository.count(),
            pageable,
        )
    }

    /**
     * Get single knowledge item by code.
     *
     * @param code Knowledge code identifier
     * @return Mono containing Knowledge or empty if not found
     */
    fun getKnowledgeByCode(code: String): Mono<Knowledge> = knowledgeRepository.findByCode(code)

    /**
     * Batch load knowledge items by codes.
     *
     * @param codes Collection of knowledge codes
     * @return Mono containing Map of code to Knowledge
     */
    fun getKnowledgeByCodes(codes: Collection<String>): Mono<Map<String, Knowledge>> {
        if (codes.isEmpty()) {
            return Mono.just(emptyMap())
        }
        return knowledgeRepository
            .findByCodeIn(codes)
            .collectMap { it.code }
    }
}
