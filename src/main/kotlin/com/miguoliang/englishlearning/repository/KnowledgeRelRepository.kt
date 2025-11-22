package com.miguoliang.englishlearning.repository

import com.miguoliang.englishlearning.model.KnowledgeRel
import org.springframework.data.repository.reactive.ReactiveCrudRepository
import org.springframework.stereotype.Repository
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

@Repository
interface KnowledgeRelRepository : ReactiveCrudRepository<KnowledgeRel, Long> {
    fun findBySourceKnowledgeCode(sourceKnowledgeCode: String): Flux<KnowledgeRel>

    fun findByTargetKnowledgeCode(targetKnowledgeCode: String): Flux<KnowledgeRel>

    fun findBySourceKnowledgeCodeAndTargetKnowledgeCode(
        sourceKnowledgeCode: String,
        targetKnowledgeCode: String,
    ): Mono<KnowledgeRel>
}
