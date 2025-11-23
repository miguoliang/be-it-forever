package com.miguoliang.englishlearning.repository

import com.miguoliang.englishlearning.model.KnowledgeRel
import io.quarkus.hibernate.reactive.panache.PanacheRepositoryBase
import io.quarkus.panache.common.Parameters
import io.smallrye.mutiny.coroutines.awaitSuspending
import jakarta.enterprise.context.ApplicationScoped

@ApplicationScoped
class KnowledgeRelRepository : PanacheRepositoryBase<KnowledgeRel, Long> {
    suspend fun findBySourceKnowledgeCode(sourceKnowledgeCode: String): List<KnowledgeRel> =
        find("sourceKnowledgeCode = :code", Parameters.with("code", sourceKnowledgeCode))
            .list<KnowledgeRel>()
            .awaitSuspending()

    suspend fun findByTargetKnowledgeCode(targetKnowledgeCode: String): List<KnowledgeRel> =
        find("targetKnowledgeCode = :code", Parameters.with("code", targetKnowledgeCode))
            .list<KnowledgeRel>()
            .awaitSuspending()

    suspend fun findBySourceKnowledgeCodeAndTargetKnowledgeCode(
        sourceKnowledgeCode: String,
        targetKnowledgeCode: String,
    ): KnowledgeRel? =
        find(
            "sourceKnowledgeCode = :source and targetKnowledgeCode = :target",
            Parameters.with("source", sourceKnowledgeCode).and("target", targetKnowledgeCode),
        ).firstResult<KnowledgeRel>().awaitSuspending()
}
