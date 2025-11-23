package com.miguoliang.englishlearning.repository

import com.miguoliang.englishlearning.common.Pageable
import com.miguoliang.englishlearning.model.AccountCard
import io.quarkus.hibernate.reactive.panache.PanacheRepositoryBase
import io.quarkus.panache.common.Page
import io.smallrye.mutiny.coroutines.awaitSuspending
import jakarta.enterprise.context.ApplicationScoped
import jakarta.inject.Inject
import org.hibernate.reactive.mutiny.Mutiny
import java.time.LocalDateTime

@ApplicationScoped
class AccountCardRepository : PanacheRepositoryBase<AccountCard, Long> {
    @Inject
    lateinit var sessionFactory: Mutiny.SessionFactory

    suspend fun findByAccountId(accountId: Long): List<AccountCard> =
        find("accountId", accountId).list<AccountCard>().awaitSuspending()

    suspend fun findDueCardsByAccountId(
        accountId: Long,
        date: LocalDateTime,
        pageable: Pageable,
    ): List<AccountCard> =
        find(
            "accountId = ?1 and nextReviewDate <= ?2 order by nextReviewDate",
            accountId,
            date,
        ).page<AccountCard>(Page.of(pageable.page, pageable.size)).list<AccountCard>().awaitSuspending()

    suspend fun countDueCardsByAccountId(
        accountId: Long,
        date: LocalDateTime,
    ): Long = count("accountId = ?1 and nextReviewDate <= ?2", accountId, date).awaitSuspending()

    suspend fun findDueCardsByAccountIdAndCardTypeCode(
        accountId: Long,
        date: LocalDateTime,
        cardTypeCode: String,
        pageable: Pageable,
    ): List<AccountCard> =
        find(
            "accountId = ?1 and nextReviewDate <= ?2 and cardTypeCode = ?3 order by nextReviewDate",
            accountId,
            date,
            cardTypeCode,
        ).page<AccountCard>(Page.of(pageable.page, pageable.size)).list<AccountCard>().awaitSuspending()

    suspend fun countDueCardsByAccountIdAndCardTypeCode(
        accountId: Long,
        date: LocalDateTime,
        cardTypeCode: String,
    ): Long =
        count(
            "accountId = ?1 and nextReviewDate <= ?2 and cardTypeCode = ?3",
            accountId,
            date,
            cardTypeCode,
        ).awaitSuspending()

    suspend fun findByAccountIdAndKnowledgeCodeAndCardTypeCode(
        accountId: Long,
        knowledgeCode: String,
        cardTypeCode: String,
    ): AccountCard? =
        find(
            "accountId = ?1 and knowledgeCode = ?2 and cardTypeCode = ?3",
            accountId,
            knowledgeCode,
            cardTypeCode,
        ).firstResult<AccountCard>().awaitSuspending()

    suspend fun findByAccountId(
        accountId: Long,
        pageable: Pageable,
    ): List<AccountCard> =
        find("accountId = ?1 order by id", accountId)
            .page<AccountCard>(Page.of(pageable.page, pageable.size))
            .list<AccountCard>()
            .awaitSuspending()

    suspend fun countByAccountId(accountId: Long): Long = count("accountId", accountId).awaitSuspending()

    suspend fun findByAccountIdAndCardTypeCode(
        accountId: Long,
        cardTypeCode: String,
        pageable: Pageable,
    ): List<AccountCard> =
        find(
            "accountId = ?1 and cardTypeCode = ?2 order by id",
            accountId,
            cardTypeCode,
        ).page<AccountCard>(Page.of(pageable.page, pageable.size)).list<AccountCard>().awaitSuspending()

    suspend fun countByAccountIdAndCardTypeCode(
        accountId: Long,
        cardTypeCode: String,
    ): Long = count("accountId = ?1 and cardTypeCode = ?2", accountId, cardTypeCode).awaitSuspending()

    suspend fun findByAccountIdAndStatusNew(
        accountId: Long,
        pageable: Pageable,
    ): List<AccountCard> =
        find("accountId = ?1 and repetitions = 0 order by id", accountId)
            .page<AccountCard>(Page.of(pageable.page, pageable.size))
            .list<AccountCard>()
            .awaitSuspending()

    suspend fun countByAccountIdAndStatusNew(accountId: Long): Long =
        count("accountId = ?1 and repetitions = 0", accountId).awaitSuspending()

    suspend fun findByAccountIdAndStatusLearning(
        accountId: Long,
        pageable: Pageable,
    ): List<AccountCard> =
        find(
            "accountId = ?1 and repetitions > 0 and repetitions < 3 order by id",
            accountId,
        ).page<AccountCard>(Page.of(pageable.page, pageable.size)).list<AccountCard>().awaitSuspending()

    suspend fun countByAccountIdAndStatusLearning(accountId: Long): Long =
        count("accountId = ?1 and repetitions > 0 and repetitions < 3", accountId).awaitSuspending()

    suspend fun findByAccountIdAndStatusReview(
        accountId: Long,
        date: LocalDateTime,
        pageable: Pageable,
    ): List<AccountCard> =
        find(
            "accountId = ?1 and nextReviewDate <= ?2 order by id",
            accountId,
            date,
        ).page<AccountCard>(Page.of(pageable.page, pageable.size)).list<AccountCard>().awaitSuspending()

    suspend fun countByAccountIdAndStatusReview(
        accountId: Long,
        date: LocalDateTime,
    ): Long = count("accountId = ?1 and nextReviewDate <= ?2", accountId, date).awaitSuspending()

    suspend fun findByAccountIdAndCardTypeCodeAndStatusNew(
        accountId: Long,
        cardTypeCode: String,
        pageable: Pageable,
    ): List<AccountCard> =
        find(
            "accountId = ?1 and cardTypeCode = ?2 and repetitions = 0 order by id",
            accountId,
            cardTypeCode,
        ).page<AccountCard>(Page.of(pageable.page, pageable.size)).list<AccountCard>().awaitSuspending()

    suspend fun countByAccountIdAndCardTypeCodeAndStatusNew(
        accountId: Long,
        cardTypeCode: String,
    ): Long =
        count(
            "accountId = ?1 and cardTypeCode = ?2 and repetitions = 0",
            accountId,
            cardTypeCode,
        ).awaitSuspending()

    suspend fun findByAccountIdAndCardTypeCodeAndStatusLearning(
        accountId: Long,
        cardTypeCode: String,
        pageable: Pageable,
    ): List<AccountCard> =
        find(
            "accountId = ?1 and cardTypeCode = ?2 and repetitions > 0 and repetitions < 3 order by id",
            accountId,
            cardTypeCode,
        ).page<AccountCard>(Page.of(pageable.page, pageable.size)).list<AccountCard>().awaitSuspending()

    suspend fun countByAccountIdAndCardTypeCodeAndStatusLearning(
        accountId: Long,
        cardTypeCode: String,
    ): Long =
        count(
            "accountId = ?1 and cardTypeCode = ?2 and repetitions > 0 and repetitions < 3",
            accountId,
            cardTypeCode,
        ).awaitSuspending()

    suspend fun findByAccountIdAndCardTypeCodeAndStatusReview(
        accountId: Long,
        cardTypeCode: String,
        date: LocalDateTime,
        pageable: Pageable,
    ): List<AccountCard> =
        find(
            "accountId = ?1 and cardTypeCode = ?2 and nextReviewDate <= ?3 order by id",
            accountId,
            cardTypeCode,
            date,
        ).page<AccountCard>(Page.of(pageable.page, pageable.size)).list<AccountCard>().awaitSuspending()

    suspend fun countByAccountIdAndCardTypeCodeAndStatusReview(
        accountId: Long,
        cardTypeCode: String,
        date: LocalDateTime,
    ): Long =
        count(
            "accountId = ?1 and cardTypeCode = ?2 and nextReviewDate <= ?3",
            accountId,
            cardTypeCode,
            date,
        ).awaitSuspending()

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
}
