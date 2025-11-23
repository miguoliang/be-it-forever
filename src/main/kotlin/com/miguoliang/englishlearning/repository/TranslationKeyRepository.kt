package com.miguoliang.englishlearning.repository

import com.miguoliang.englishlearning.model.TranslationKey
import io.quarkus.hibernate.reactive.panache.PanacheRepositoryBase
import io.quarkus.panache.common.Parameters
import io.smallrye.mutiny.coroutines.awaitSuspending
import jakarta.enterprise.context.ApplicationScoped

@ApplicationScoped
class TranslationKeyRepository : PanacheRepositoryBase<TranslationKey, String> {
    suspend fun findByKey(key: String): TranslationKey? =
        find("key = :key", Parameters.with("key", key))
            .firstResult<TranslationKey>()
            .awaitSuspending()
}
