package com.miguoliang.englishlearning.repository

import com.miguoliang.englishlearning.model.TranslationMessage
import io.quarkus.hibernate.reactive.panache.PanacheRepositoryBase
import io.quarkus.panache.common.Parameters
import io.smallrye.mutiny.coroutines.awaitSuspending
import jakarta.enterprise.context.ApplicationScoped

@ApplicationScoped
class TranslationMessageRepository : PanacheRepositoryBase<TranslationMessage, String> {
    suspend fun findByTranslationKeyCodeAndLocaleCode(
        translationKeyCode: String,
        localeCode: String,
    ): TranslationMessage? =
        find(
            "translationKeyCode = :translationKeyCode and localeCode = :localeCode",
            Parameters.with("translationKeyCode", translationKeyCode).and("localeCode", localeCode),
        ).firstResult<TranslationMessage>().awaitSuspending()
}
