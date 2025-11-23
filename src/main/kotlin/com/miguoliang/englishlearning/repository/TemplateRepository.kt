package com.miguoliang.englishlearning.repository

import com.miguoliang.englishlearning.model.Template
import io.quarkus.hibernate.reactive.panache.PanacheRepositoryBase
import io.smallrye.mutiny.coroutines.awaitSuspending
import jakarta.enterprise.context.ApplicationScoped

@ApplicationScoped
class TemplateRepository : PanacheRepositoryBase<Template, String> {
    suspend fun findByCode(code: String): Template? = findById(code).awaitSuspending()

    suspend fun streamAll(): List<Template> = listAll().awaitSuspending()
}
