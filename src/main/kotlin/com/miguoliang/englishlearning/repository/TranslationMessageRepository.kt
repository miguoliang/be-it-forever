package com.miguoliang.englishlearning.repository

import com.miguoliang.englishlearning.model.TranslationMessage
import io.quarkus.hibernate.reactive.panache.PanacheRepositoryBase
import io.quarkus.panache.common.Parameters
import io.smallrye.mutiny.coroutines.awaitSuspending
import jakarta.enterprise.context.ApplicationScoped

@ApplicationScoped
class TranslationMessageRepository : PanacheRepositoryBase<TranslationMessage, String> {
    suspend fun findByTranslationKeyCode(translationKeyCode: String): List<TranslationMessage> =
        find("translationKeyCode = :code", Parameters.with("code", translationKeyCode))
            .list<TranslationMessage>()
            .awaitSuspending()

    suspend fun findByTranslationKeyCodeAndLocaleCode(
        translationKeyCode: String,
        localeCode: String,
    ): TranslationMessage? =
        find(
            "translationKeyCode = :translationKeyCode and localeCode = :localeCode",
            Parameters.with("translationKeyCode", translationKeyCode).and("localeCode", localeCode),
        ).firstResult<TranslationMessage>().awaitSuspending()

    suspend fun findByLocaleCode(localeCode: String): List<TranslationMessage> =
        find("localeCode = :localeCode", Parameters.with("localeCode", localeCode))
            .list<TranslationMessage>()
            .awaitSuspending()
}
