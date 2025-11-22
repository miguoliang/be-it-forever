package com.miguoliang.englishlearning.repository

import com.miguoliang.englishlearning.model.CardType
import org.springframework.data.r2dbc.repository.Query
import org.springframework.data.repository.reactive.ReactiveCrudRepository
import org.springframework.stereotype.Repository
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

@Repository
interface CardTypeRepository : ReactiveCrudRepository<CardType, String> {
    fun findByCode(code: String): Mono<CardType>

    fun findByName(name: String): Mono<CardType>

    @Query("SELECT * FROM card_types WHERE code IN (:codes)")
    fun findByCodeIn(codes: Collection<String>): Flux<CardType>
}
