package com.miguoliang.englishlearning.repository

import com.miguoliang.englishlearning.common.Pageable
import com.miguoliang.englishlearning.dto.AccountCardListProjection
import com.miguoliang.englishlearning.model.AccountCard
import io.quarkus.hibernate.reactive.panache.PanacheRepositoryBase
import io.quarkus.panache.common.Page
import io.smallrye.mutiny.coroutines.awaitSuspending
import jakarta.enterprise.context.ApplicationScoped
import jakarta.inject.Inject
import org.hibernate.reactive.mutiny.Mutiny
import java.time.LocalDateTime

/**
 * Repository for AccountCard entities with dynamic query building to reduce duplication.
 */
@ApplicationScoped
class AccountCardRepository : PanacheRepositoryBase<AccountCard, Long> {
    @Inject
    lateinit var sessionFactory: Mutiny.SessionFactory

    /**
     * Card status filter types for query building.
     */
    enum class StatusFilter {
        NEW, // repetitions = 0
        LEARNING, // repetitions > 0 AND repetitions < 3
        REVIEW, // nextReviewDate <= now
        DUE, // nextReviewDate <= now (alias for REVIEW)
    }

    /**
     * Dynamic query method that handles all filter combinations.
     * Replaces ~20 duplicate methods with a single flexible implementation.
     *
     * @param accountId Account ID (required)
     * @param cardTypeCode Optional card type filter
     * @param statusFilter Optional status filter (NEW, LEARNING, REVIEW, DUE)
     * @param now Current time (required for REVIEW/DUE status)
     * @param pageable Optional pagination
     * @return List of matching cards
     */
    suspend fun findWithFilters(
        accountId: Long,
        cardTypeCode: String? = null,
        statusFilter: StatusFilter? = null,
        now: LocalDateTime? = null,
        pageable: Pageable? = null,
    ): List<AccountCard> {
        val (query, params) = buildQuery(accountId, cardTypeCode, statusFilter, now)

        var panacheQuery = find(query, *params.toTypedArray())

        if (pageable != null) {
            panacheQuery = panacheQuery.page(Page.of(pageable.page, pageable.size))
        }

        return panacheQuery.list<AccountCard>().awaitSuspending()
    }

    /**
     * Count cards matching the given filters.
     *
     * @param accountId Account ID (required)
     * @param cardTypeCode Optional card type filter
     * @param statusFilter Optional status filter
     * @param now Current time (required for REVIEW/DUE status)
     * @return Count of matching cards
     */
    suspend fun countWithFilters(
        accountId: Long,
        cardTypeCode: String? = null,
        statusFilter: StatusFilter? = null,
        now: LocalDateTime? = null,
    ): Long {
        val (query, params) = buildQuery(accountId, cardTypeCode, statusFilter, now, forCount = true)
        return count(query, *params.toTypedArray()).awaitSuspending()
    }

    /**
     * Builds a dynamic query based on provided filters.
     *
     * @return Pair of (query string, parameters list)
     */
    private fun buildQuery(
        accountId: Long,
        cardTypeCode: String?,
        statusFilter: StatusFilter?,
        now: LocalDateTime?,
        forCount: Boolean = false,
    ): Pair<String, List<Any>> {
        val conditions = mutableListOf<String>()
        val params = mutableListOf<Any>()
        var paramIndex = 1

        // Always filter by accountId
        conditions.add("accountId = ?$paramIndex")
        params.add(accountId)
        paramIndex++

        // Optional: filter by card type
        if (cardTypeCode != null) {
            conditions.add("cardTypeCode = ?$paramIndex")
            params.add(cardTypeCode)
            paramIndex++
        }

        // Optional: filter by status
        when (statusFilter) {
            StatusFilter.NEW -> {
                conditions.add("repetitions = 0")
            }

            StatusFilter.LEARNING -> {
                conditions.add("repetitions > 0 and repetitions < 3")
            }

            StatusFilter.REVIEW, StatusFilter.DUE -> {
                require(now != null) { "now parameter is required for REVIEW/DUE status filter" }
                conditions.add("nextReviewDate <= ?$paramIndex")
                params.add(now)
            }

            null -> { /* no status filter */
            }
        }

        val whereClause = conditions.joinToString(" and ")

        // Add ORDER BY clause (not needed for count queries)
        val orderBy =
            if (!forCount) {
                when (statusFilter) {
                    StatusFilter.REVIEW, StatusFilter.DUE -> " order by nextReviewDate"
                    else -> " order by id"
                }
            } else {
                ""
            }

        return Pair(whereClause + orderBy, params)
    }

    // ========== Legacy method compatibility wrappers ==========
    // These delegate to the new dynamic methods to maintain API compatibility

    suspend fun findDueCardsByAccountId(
        accountId: Long,
        date: LocalDateTime,
        pageable: Pageable,
    ): List<AccountCard> = findWithFilters(accountId, null, StatusFilter.DUE, date, pageable)

    suspend fun countDueCardsByAccountId(
        accountId: Long,
        date: LocalDateTime,
    ): Long = countWithFilters(accountId, null, StatusFilter.DUE, date)

    suspend fun findDueCardsByAccountIdAndCardTypeCode(
        accountId: Long,
        date: LocalDateTime,
        cardTypeCode: String,
        pageable: Pageable,
    ): List<AccountCard> = findWithFilters(accountId, cardTypeCode, StatusFilter.DUE, date, pageable)

    suspend fun countDueCardsByAccountIdAndCardTypeCode(
        accountId: Long,
        date: LocalDateTime,
        cardTypeCode: String,
    ): Long = countWithFilters(accountId, cardTypeCode, StatusFilter.DUE, date)

    // ========== Statistics methods ==========

    /**
     * Compute statistics for an account using database aggregation.
     * This is much more efficient than loading all cards into memory.
     *
     * @param accountId Account ID
     * @param now Current timestamp for due card calculation
     * @return Map with keys: total, new, learning, dueToday
     */
    suspend fun getStatsByAccountId(
        accountId: Long,
        now: LocalDateTime,
    ): Map<String, Long> {
        val query =
            """
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN repetitions = 0 THEN 1 ELSE 0 END) as new,
                SUM(CASE WHEN repetitions > 0 AND repetitions < 3 THEN 1 ELSE 0 END) as learning,
                SUM(CASE WHEN next_review_date <= :now THEN 1 ELSE 0 END) as dueToday
            FROM account_cards
            WHERE account_id = :accountId
            """.trimIndent()

        val result: Array<*> =
            sessionFactory
                .withSession { session ->
                    session
                        .createNativeQuery<Array<Any>>(query, Array<Any>::class.java)
                        .setParameter("accountId", accountId)
                        .setParameter("now", now)
                        .singleResult
                }.awaitSuspending()

        val total = (result[0] as? Number)?.toLong() ?: 0L
        val new = (result[1] as? Number)?.toLong() ?: 0L
        val learning = (result[2] as? Number)?.toLong() ?: 0L
        val dueToday = (result[3] as? Number)?.toLong() ?: 0L

        return mapOf(
            "total" to total,
            "new" to new,
            "learning" to learning,
            "dueToday" to dueToday,
        )
    }

    /**
     * Get card counts grouped by card type for an account.
     *
     * @param accountId Account ID
     * @return Map of card type code to count
     */
    suspend fun getCardTypeStatsByAccountId(accountId: Long): Map<String, Long> {
        val query =
            """
            SELECT card_type_code, COUNT(*) as count
            FROM account_cards
            WHERE account_id = :accountId
            GROUP BY card_type_code
            """.trimIndent()

        @Suppress("UNCHECKED_CAST")
        val results: List<Array<*>> =
            sessionFactory
                .withSession { session ->
                    session
                        .createNativeQuery<Array<Any>>(query, Array<Any>::class.java)
                        .setParameter("accountId", accountId)
                        .resultList
                }.awaitSuspending() as List<Array<*>>

        return results.associate { row ->
            val cardTypeCode = row[0] as String
            val count = (row[1] as? Number)?.toLong() ?: 0L
            cardTypeCode to count
        }
    }

    /**
     * Optimized query for listing account cards with minimal data transfer.
     * Uses HQL with constructor expression for type-safe projections.
     *
     * Benefits of HQL over native SQL:
     * - Database-agnostic (works with any JPA-supported database)
     * - Type-safe (compile-time checking)
     * - Uses entity relationships (no manual JOIN syntax)
     *
     * Performance improvement over findWithFilters:
     * - Old: 3 queries (AccountCard + Knowledge batch + CardType batch)
     * - New: 1 query with JOINs, fetching only needed columns
     *
     * @param accountId Account ID
     * @param pageable Pagination parameters
     * @param cardTypeCode Optional card type filter
     * @param statusFilter Optional status filter
     * @param now Current time for due date calculations
     * @return List of projections containing only needed fields
     */
    suspend fun findProjectionsWithFilters(
        accountId: Long,
        pageable: Pageable,
        cardTypeCode: String? = null,
        statusFilter: StatusFilter? = null,
        now: LocalDateTime? = null,
    ): List<AccountCardListProjection> {
        // Build HQL query with constructor expression for projections
        val hql =
            buildString {
                append(
                    """
                    SELECT new com.miguoliang.englishlearning.dto.AccountCardListProjection(
                        ac.id,
                        ac.easeFactor,
                        ac.intervalDays,
                        ac.repetitions,
                        ac.nextReviewDate,
                        ac.lastReviewedAt,
                        ac.knowledgeCode,
                        k.name,
                        k.description,
                        k.metadata.level,
                        ac.cardTypeCode,
                        ct.name,
                        ct.description
                    )
                    FROM AccountCard ac
                    JOIN Knowledge k ON ac.knowledgeCode = k.code
                    JOIN CardType ct ON ac.cardTypeCode = ct.code
                    WHERE ac.accountId = :accountId
                    """.trimIndent(),
                )

                // Apply filters
                if (cardTypeCode != null) {
                    append(" AND ac.cardTypeCode = :cardTypeCode")
                }

                when (statusFilter) {
                    StatusFilter.NEW -> append(" AND ac.repetitions = 0")
                    StatusFilter.LEARNING -> append(" AND ac.repetitions > 0 AND ac.repetitions < 4")
                    StatusFilter.REVIEW -> append(" AND ac.repetitions >= 4")
                    StatusFilter.DUE -> {
                        require(now != null) { "now parameter required for DUE status filter" }
                        append(" AND ac.nextReviewDate <= :now")
                    }

                    null -> {}
                }
            }

        // Build count query with same filters
        val countHql =
            buildString {
                append(
                    """
                    SELECT COUNT(ac.id)
                    FROM AccountCard ac
                    WHERE ac.accountId = :accountId
                    """.trimIndent(),
                )

                // Apply same filters as main query
                if (cardTypeCode != null) {
                    append(" AND ac.cardTypeCode = :cardTypeCode")
                }

                when (statusFilter) {
                    StatusFilter.NEW -> append(" AND ac.repetitions = 0")
                    StatusFilter.LEARNING -> append(" AND ac.repetitions > 0 AND ac.repetitions < 4")
                    StatusFilter.REVIEW -> append(" AND ac.repetitions >= 4")
                    StatusFilter.DUE -> {
                        append(" AND ac.nextReviewDate <= :now")
                    }

                    null -> {}
                }
            }

        val session = sessionFactory.openSession().awaitSuspending()
        try {
            // Execute count query
            val countQuery =
                session
                    .createQuery<Long>(countHql, Long::class.java)
                    .setParameter("accountId", accountId)

            if (cardTypeCode != null) {
                countQuery.setParameter("cardTypeCode", cardTypeCode)
            }
            if (statusFilter == StatusFilter.DUE) {
                countQuery.setParameter("now", now)
            }

            val totalElements = countQuery.singleResult.awaitSuspending()

            // Execute main query
            val query =
                session
                    .createQuery<AccountCardListProjection>(
                        hql,
                        AccountCardListProjection::class.java,
                    ).setParameter("accountId", accountId)
                    .setFirstResult(pageable.page * pageable.size)
                    .setMaxResults(pageable.size)

            if (cardTypeCode != null) {
                query.setParameter("cardTypeCode", cardTypeCode)
            }
            if (statusFilter == StatusFilter.DUE) {
                query.setParameter("now", now)
            }

            return query.resultList.awaitSuspending()
        } finally {
            session.close().awaitSuspending()
        }
    }
}
