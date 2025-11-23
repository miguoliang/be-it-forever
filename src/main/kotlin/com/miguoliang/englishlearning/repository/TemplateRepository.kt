package com.miguoliang.englishlearning.repository

import com.miguoliang.englishlearning.model.Template
import io.quarkus.hibernate.reactive.panache.PanacheRepositoryBase
import io.smallrye.mutiny.coroutines.awaitSuspending
import jakarta.enterprise.context.ApplicationScoped

@ApplicationScoped
class TemplateRepository : PanacheRepositoryBase<Template, String> {
    suspend fun findByCode(code: String): Template? = findById(code).awaitSuspending()

    /**
     * Load all templates (use with caution - only for small datasets).
     * For production use with large datasets, add pagination support.
     */
    suspend fun streamAll(): List<Template> {
        val count = count().awaitSuspending()
        // Safety check: warn if loading too many records
        if (count > 1000) {
            throw IllegalStateException(
                "Attempting to load $count templates without pagination. Consider adding pagination support.",
            )
        }
        return listAll().awaitSuspending()
    }
}
