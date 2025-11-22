package com.miguoliang.englishlearning.repository

import com.miguoliang.englishlearning.model.TranslationMessage
import org.springframework.data.repository.reactive.ReactiveCrudRepository
import org.springframework.stereotype.Repository
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

@Repository
interface TranslationMessageRepository : ReactiveCrudRepository<TranslationMessage, String> {
    fun findByTranslationKeyCode(translationKeyCode: String): Flux<TranslationMessage>

    fun findByTranslationKeyCodeAndLocaleCode(
        translationKeyCode: String,
        localeCode: String,
    ): Mono<TranslationMessage>

    fun findByLocaleCode(localeCode: String): Flux<TranslationMessage>
}
