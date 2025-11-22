package com.miguoliang.englishlearning.repository

import com.miguoliang.englishlearning.model.CardTypeTemplateRel
import org.springframework.data.repository.reactive.ReactiveCrudRepository
import org.springframework.stereotype.Repository
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

@Repository
interface CardTypeTemplateRelRepository : ReactiveCrudRepository<CardTypeTemplateRel, Long> {
    fun findByCardTypeCode(cardTypeCode: String): Flux<CardTypeTemplateRel>

    fun findByTemplateCode(templateCode: String): Flux<CardTypeTemplateRel>

    fun findByCardTypeCodeAndRole(
        cardTypeCode: String,
        role: String,
    ): Mono<CardTypeTemplateRel>
}
