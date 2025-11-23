package com.miguoliang.englishlearning.repository

import com.miguoliang.englishlearning.common.Pageable
import com.miguoliang.englishlearning.model.Knowledge
import io.quarkus.hibernate.reactive.panache.PanacheRepositoryBase
import io.quarkus.panache.common.Page
import io.quarkus.panache.common.Parameters
import io.quarkus.panache.common.Sort
import io.smallrye.mutiny.coroutines.awaitSuspending
import jakarta.enterprise.context.ApplicationScoped

@ApplicationScoped
class KnowledgeRepository : PanacheRepositoryBase<Knowledge, String> {
    suspend fun findAllOrderedByCode(pageable: Pageable): List<Knowledge> =
        findAll(Sort.by("code"))
            .page<Knowledge>(Page.of(pageable.page, pageable.size))
            .list<Knowledge>()
            .awaitSuspending()

    suspend fun findByCode(code: String): Knowledge? = findById(code).awaitSuspending()

    suspend fun findByCodeIn(codes: Collection<String>): List<Knowledge> =
        find("code in :codes", Parameters.with("codes", codes))
            .list<Knowledge>()
            .awaitSuspending()

    suspend fun countAll(): Long = count().awaitSuspending()
}
