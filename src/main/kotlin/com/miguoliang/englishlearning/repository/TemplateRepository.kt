package com.miguoliang.englishlearning.repository

import com.miguoliang.englishlearning.model.Template
import io.quarkus.hibernate.reactive.panache.PanacheRepositoryBase
import io.quarkus.panache.common.Parameters
import io.smallrye.mutiny.coroutines.awaitSuspending
import jakarta.enterprise.context.ApplicationScoped

@ApplicationScoped
class TemplateRepository : PanacheRepositoryBase<Template, String> {
    suspend fun streamAll(): List<Template> = findAll().list<Template>().awaitSuspending()

    suspend fun findByCode(code: String): Template? = findById(code).awaitSuspending()

    suspend fun findByName(name: String): Template? =
        find("name = :name", Parameters.with("name", name))
            .firstResult<Template>()
            .awaitSuspending()
}
