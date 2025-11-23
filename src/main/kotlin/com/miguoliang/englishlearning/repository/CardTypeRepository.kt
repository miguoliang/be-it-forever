package com.miguoliang.englishlearning.repository

import com.miguoliang.englishlearning.common.Pageable
import com.miguoliang.englishlearning.model.CardType
import io.quarkus.hibernate.reactive.panache.PanacheQuery
import io.quarkus.hibernate.reactive.panache.PanacheRepositoryBase
import io.quarkus.panache.common.Page
import io.quarkus.panache.common.Parameters
import io.smallrye.mutiny.coroutines.awaitSuspending
import jakarta.enterprise.context.ApplicationScoped

@ApplicationScoped
class CardTypeRepository : PanacheRepositoryBase<CardType, String> {
    suspend fun findByCode(code: String): CardType? = findById(code).awaitSuspending()

    /**
     * Get all card types with proper pagination.
     * This method supports database-level pagination to avoid loading all records.
     *
     * @param pageable Pagination parameters
     * @return List of paginated card types
     */
    suspend fun findAllPaginated(pageable: Pageable): List<CardType> {
        val query: PanacheQuery<CardType> = find("")
        val pagedQuery: PanacheQuery<CardType> = query.page(Page.of(pageable.page, pageable.size))
        return pagedQuery.list<CardType>().awaitSuspending()
    }

    /**
     * Load all card types (use with caution - only for small datasets).
     * For production use with pagination, use findAll(pageable) instead.
     */
    suspend fun streamAll(): List<CardType> {
        val count = count().awaitSuspending()
        // Safety check: warn if loading too many records
        if (count > 1000) {
            throw IllegalStateException(
                "Attempting to load $count card types without pagination. Use findAll(pageable) instead.",
            )
        }
        return listAll().awaitSuspending()
    }

    suspend fun findByCodeIn(codes: Collection<String>): List<CardType> =
        if (codes.isEmpty()) {
            emptyList()
        } else {
            find("code in :codes", Parameters.with("codes", codes))
                .list<CardType>()
                .awaitSuspending()
        }
}
