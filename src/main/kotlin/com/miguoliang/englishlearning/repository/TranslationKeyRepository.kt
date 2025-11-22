package com.miguoliang.englishlearning.repository

import com.miguoliang.englishlearning.model.TranslationKey
import org.springframework.data.repository.reactive.ReactiveCrudRepository
import org.springframework.stereotype.Repository
import reactor.core.publisher.Mono

@Repository
interface TranslationKeyRepository : ReactiveCrudRepository<TranslationKey, String> {
    fun findByKey(key: String): Mono<TranslationKey>
}
