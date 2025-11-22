package com.miguoliang.englishlearning.repository

import com.miguoliang.englishlearning.model.Knowledge
import org.springframework.data.domain.Pageable
import org.springframework.data.r2dbc.repository.Query
import org.springframework.data.repository.reactive.ReactiveCrudRepository
import org.springframework.stereotype.Repository
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

@Repository
interface KnowledgeRepository : ReactiveCrudRepository<Knowledge, String> {
    @Query("SELECT * FROM knowledge ORDER BY code OFFSET :#{#pageable.offset} LIMIT :#{#pageable.pageSize}")
    fun findAllOrderedByCode(pageable: Pageable): Flux<Knowledge>

    fun findByCode(code: String): Mono<Knowledge>

    @Query("SELECT * FROM knowledge WHERE code IN (:codes)")
    fun findByCodeIn(codes: Collection<String>): Flux<Knowledge>
}
