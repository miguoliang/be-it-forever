package com.miguoliang.englishlearning.repository

import com.miguoliang.englishlearning.model.CardTypeTemplateRel
import io.quarkus.hibernate.reactive.panache.PanacheRepositoryBase
import io.quarkus.panache.common.Parameters
import io.smallrye.mutiny.coroutines.awaitSuspending
import jakarta.enterprise.context.ApplicationScoped

@ApplicationScoped
class CardTypeTemplateRelRepository : PanacheRepositoryBase<CardTypeTemplateRel, Long> {
    suspend fun findByCardTypeCode(cardTypeCode: String): List<CardTypeTemplateRel> =
        find("cardTypeCode = :code", Parameters.with("code", cardTypeCode))
            .list<CardTypeTemplateRel>()
            .awaitSuspending()

    suspend fun findByTemplateCode(templateCode: String): List<CardTypeTemplateRel> =
        find("templateCode = :code", Parameters.with("code", templateCode))
            .list<CardTypeTemplateRel>()
            .awaitSuspending()

    suspend fun findByCardTypeCodeAndRole(
        cardTypeCode: String,
        role: String,
    ): CardTypeTemplateRel? =
        find(
            "cardTypeCode = :cardTypeCode and role = :role",
            Parameters.with("cardTypeCode", cardTypeCode).and("role", role),
        ).firstResult<CardTypeTemplateRel>().awaitSuspending()
}
