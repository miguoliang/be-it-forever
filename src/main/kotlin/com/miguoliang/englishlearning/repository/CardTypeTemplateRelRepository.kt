package com.miguoliang.englishlearning.repository

import com.miguoliang.englishlearning.model.CardTypeTemplateRel
import io.quarkus.hibernate.reactive.panache.PanacheRepositoryBase
import io.quarkus.panache.common.Parameters
import io.smallrye.mutiny.coroutines.awaitSuspending
import jakarta.enterprise.context.ApplicationScoped

@ApplicationScoped
class CardTypeTemplateRelRepository : PanacheRepositoryBase<CardTypeTemplateRel, Long> {
    suspend fun findByCardTypeCodeAndRole(
        cardTypeCode: String,
        role: String,
    ): CardTypeTemplateRel? =
        find(
            "cardTypeCode = :cardTypeCode and role = :role",
            Parameters.with("cardTypeCode", cardTypeCode).and("role", role),
        ).firstResult<CardTypeTemplateRel>().awaitSuspending()
}
